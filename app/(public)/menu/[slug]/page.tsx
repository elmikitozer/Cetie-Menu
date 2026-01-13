import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Restaurant } from "@/lib/types/database";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string }>;
}

function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function isToday(dateStr: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return dateStr === today;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("restaurants")
    .select("name")
    .eq("slug", slug)
    .single();

  const restaurant = data as Pick<Restaurant, "name"> | null;

  if (!restaurant) {
    return { title: "Menu non trouvé" };
  }

  return {
    title: `Menu du jour - ${restaurant.name}`,
    description: `Découvrez le menu du jour de ${restaurant.name}`,
  };
}

export default async function PublicMenuPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { date: dateParam } = await searchParams;
  const supabase = await createClient();

  // Use date from query param or default to today
  const selectedDate = dateParam || new Date().toISOString().split("T")[0];

  // Fetch restaurant
  const { data: restaurantData } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .single();

  const restaurant = restaurantData as Restaurant | null;

  if (!restaurant) {
    notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Fetch menu for the selected date
  // Note: We fetch without is_published filter for preview (when date param is provided)
  // If no date param, we only show published menus
  const query = db
    .from("daily_menus")
    .select("id, date, is_published")
    .eq("restaurant_id", restaurant.id)
    .eq("date", selectedDate);

  // If viewing via date param (preview mode), show even unpublished menus
  // If viewing without date param (public access), only show published
  if (!dateParam) {
    query.eq("is_published", true);
  }

  const { data: dailyMenuData, error: menuError } = await query.single();

  if (menuError && menuError.code !== "PGRST116") {
    console.error("Menu fetch error:", menuError);
  }

  type DailyMenuRow = {
    id: string;
    date: string;
    is_published: boolean;
  };

  const dailyMenu = dailyMenuData as DailyMenuRow | null;

  // Fetch menu items with products and categories
  type MenuItemWithProduct = {
    id: string;
    product_id: string;
    custom_price: number | null;
    display_order: number;
    product: {
      id: string;
      name: string;
      description: string | null;
      price: number | null;
      category: {
        id: string;
        name: string;
        display_order: number;
      } | null;
    } | null;
  };

  let menuItems: MenuItemWithProduct[] = [];

  if (dailyMenu) {
    // Fetch menu items
    const { data: itemsData } = await db
      .from("daily_menu_items")
      .select("id, product_id, custom_price, display_order")
      .eq("daily_menu_id", dailyMenu.id)
      .order("display_order");

    const items = (itemsData || []) as Array<{
      id: string;
      product_id: string;
      custom_price: number | null;
      display_order: number;
    }>;

    if (items.length > 0) {
      // Fetch products for these items
      const productIds = items.map((i) => i.product_id);
      const { data: productsData } = await db
        .from("products")
        .select("id, name, description, price, category_id")
        .in("id", productIds);

      const products = (productsData || []) as Array<{
        id: string;
        name: string;
        description: string | null;
        price: number | null;
        category_id: string | null;
      }>;

      // Fetch categories
      const categoryIds = Array.from(new Set(products.map((p) => p.category_id).filter(Boolean)));
      const { data: categoriesData } = await db
        .from("categories")
        .select("id, name, display_order")
        .in("id", categoryIds);

      const categories = (categoriesData || []) as Array<{
        id: string;
        name: string;
        display_order: number;
      }>;

      // Build the complete menu items with products and categories
      menuItems = items.map((item) => {
        const product = products.find((p) => p.id === item.product_id);
        const category = product?.category_id
          ? categories.find((c) => c.id === product.category_id)
          : null;

        return {
          ...item,
          product: product
            ? {
                ...product,
                category: category || null,
              }
            : null,
        };
      });
    }
  }

  // Group items by category
  const groupedItems: Record<string, MenuItemWithProduct[]> = {};

  menuItems.forEach((item) => {
    if (!item.product) return;
    const categoryName = item.product.category?.name || "Autres";
    if (!groupedItems[categoryName]) {
      groupedItems[categoryName] = [];
    }
    groupedItems[categoryName].push(item);
  });

  // Sort items within each category by display_order
  Object.keys(groupedItems).forEach((categoryName) => {
    groupedItems[categoryName].sort((a, b) => a.display_order - b.display_order);
  });

  // Sort categories by display_order
  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
    const orderA = groupedItems[a][0]?.product?.category?.display_order ?? 99;
    const orderB = groupedItems[b][0]?.product?.category?.display_order ?? 99;
    return orderA - orderB;
  });

  const hasMenu = dailyMenu && sortedCategories.length > 0;
  const dateDisplay = formatDateDisplay(selectedDate);
  const isTodayDate = isToday(selectedDate);

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="text-center py-8 px-4 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>
        <p className="text-gray-600 dark:text-gray-400 capitalize">
          Menu du {dateDisplay}
        </p>
        {dailyMenu && !dailyMenu.is_published && (
          <p className="mt-2 text-sm text-amber-600 dark:text-amber-400 font-medium">
            (Aperçu - Menu non publié)
          </p>
        )}
      </header>

      {/* Menu content */}
      <div className="max-w-lg mx-auto p-6">
        {!hasMenu ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              {isTodayDate
                ? "Aucun menu disponible pour aujourd'hui."
                : `Aucun menu disponible pour le ${dateDisplay}.`}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedCategories.map((categoryName) => (
              <section key={categoryName}>
                <h2 className="text-lg font-semibold text-center uppercase tracking-wider text-gray-500 mb-4">
                  {categoryName}
                </h2>
                <div className="space-y-4">
                  {groupedItems[categoryName].map((item) => {
                    if (!item.product) return null;
                    const price = item.custom_price ?? item.product.price;
                    return (
                      <div
                        key={item.id}
                        className="flex justify-between items-start"
                      >
                        <div className="flex-1 pr-4">
                          <h3 className="font-medium">{item.product.name}</h3>
                          {item.product.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {item.product.description}
                            </p>
                          )}
                        </div>
                        {price !== null && (
                          <span className="font-medium whitespace-nowrap">
                            {price.toFixed(2)}€
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-6 px-4 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-500">
        {restaurant.address && <p>{restaurant.address}</p>}
        {restaurant.phone && <p>{restaurant.phone}</p>}
      </footer>
    </main>
  );
}
