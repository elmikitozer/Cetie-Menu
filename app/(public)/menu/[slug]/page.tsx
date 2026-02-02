import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Restaurant } from "@/lib/types/database";
import {
  MenuPrintTemplate,
  type MenuTemplateData,
  type PriceUnit,
} from "@/components/menu/MenuPrintTemplate";
import { PrintModeHandler } from "@/components/menu/PrintModeHandler";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string; print?: string }>;
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
  const { date: dateParam, print: printParam } = await searchParams;
  const supabase = await createClient();
  const isPrintMode = printParam === "1";

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

  // Fetch menu for the selected date (including show_prices)
  // Note: We fetch without is_published filter for preview (when date param is provided)
  // If no date param, we only show published menus
  const query = db
    .from("daily_menus")
    .select("id, date, is_published, show_prices")
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
    show_prices: boolean;
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
      price_unit: PriceUnit;
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
      // Fetch products for these items (including price_unit)
      const productIds = items.map((i) => i.product_id);
      const { data: productsData } = await db
        .from("products")
        .select("id, name, description, price, price_unit, category_id")
        .in("id", productIds);

      const products = (productsData || []) as Array<{
        id: string;
        name: string;
        description: string | null;
        price: number | null;
        price_unit: PriceUnit;
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

  // Prepare template data for MenuPrintTemplate
  const templateData: MenuTemplateData | null = hasMenu
    ? {
        restaurantName: restaurant.name,
        logoUrl: restaurant.logo_url,
        date: selectedDate,
        items: menuItems
          .filter((item) => item.product)
          .map((item) => ({
            id: item.id,
            name: item.product!.name,
            description: item.product!.description,
            price: item.custom_price ?? item.product!.price,
            price_unit: item.product!.price_unit,
            category_id: item.product!.category?.id || null,
          })),
        categories: sortedCategories
          .map((name) => {
            const firstItem = groupedItems[name][0];
            return {
              id: firstItem?.product?.category?.id || name,
              name,
              display_order: firstItem?.product?.category?.display_order ?? 99,
            };
          }),
        showPrices: dailyMenu.show_prices ?? true,
        // PDF Design fields from restaurant
        restaurantInfo: {
          openingDays: restaurant.opening_days || undefined,
          openingDays2: restaurant.opening_days_2 || undefined,
          lunchHours: restaurant.lunch_hours || undefined,
          dinnerHours: restaurant.dinner_hours || undefined,
          holidayNotice: restaurant.holiday_notice || undefined,
          meatOrigin: restaurant.meat_origin || undefined,
          paymentNotice: restaurant.payment_notice || undefined,
          subtitle: restaurant.subtitle || undefined,
          type: restaurant.restaurant_type || undefined,
          cities: restaurant.cities || undefined,
          sidesNote: restaurant.sides_note || undefined,
        },
      }
    : null;

  // Print mode - simplified layout for printing
  if (isPrintMode && hasMenu) {
    return (
      <>
        <PrintModeHandler />
        <main className="print-page">
          <MenuPrintTemplate data={templateData!} mode="print" />
        </main>
      </>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-950 print:hidden">
      {/* Preview banner */}
      {dailyMenu && !dailyMenu.is_published && (
        <div className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-center py-2 text-sm font-medium no-print">
          Aperçu - Menu non publié
        </div>
      )}

      {/* Menu content */}
      <div className="py-8 px-4">
        {!hasMenu ? (
          <div className="max-w-lg mx-auto bg-white dark:bg-gray-900 rounded-xl p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold mb-4">{restaurant.name}</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isTodayDate
                ? "Aucun menu disponible pour aujourd'hui."
                : `Aucun menu disponible pour le ${dateDisplay}.`}
            </p>
          </div>
        ) : (
          <>
            <MenuPrintTemplate data={templateData!} mode="screen" />
            {/* Download PDF button */}
            <div className="max-w-lg mx-auto mt-6 text-center no-print">
              <a
                href={`/menu/${slug}?date=${selectedDate}&print=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Télécharger PDF
              </a>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-6 px-4 text-sm text-gray-500 no-print">
        {restaurant.address && <p>{restaurant.address}</p>}
        {restaurant.phone && <p>{restaurant.phone}</p>}
      </footer>
    </main>
  );
}
