"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type PriceUnit = "FIXED" | "PER_PERSON";

type CategoryRow = {
  id: string;
  name: string;
  display_order: number;
};

type ProductRow = {
  id: string;
  name: string;
  category_id: string | null;
  is_active: boolean;
  price: number | null;
  price_unit: PriceUnit;
};

type DailyMenuRow = {
  id: string;
  date: string;
  is_published: boolean;
  show_prices: boolean;
};

type DailyMenuItemRow = {
  id: string;
  product_id: string;
  display_order: number;
};

export type ProductWithCategory = ProductRow & {
  category: CategoryRow | null;
};

export type DailyMenuWithItems = DailyMenuRow & {
  items: DailyMenuItemRow[];
};

async function getRestaurantId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("users")
    .select("restaurant_id")
    .eq("id", user.id)
    .single();

  return (data as { restaurant_id: string | null } | null)?.restaurant_id ?? null;
}

export async function getProductsWithCategories(includeInactive = false) {
  const supabase = await createClient();
  const restaurantId = await getRestaurantId();

  if (!restaurantId) {
    return { error: "Non authentifié", products: [], categories: [] };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Get categories
  const { data: categoriesData, error: catError } = await db
    .from("categories")
    .select("id, name, display_order")
    .eq("restaurant_id", restaurantId)
    .order("display_order");

  if (catError) {
    console.error("Categories fetch error:", catError);
    return { error: "Erreur lors du chargement", products: [], categories: [] };
  }

  const categories = (categoriesData as CategoryRow[]) || [];

  // Get products (optionally filter by active status)
  let query = db
    .from("products")
    .select("id, name, category_id, is_active, price, price_unit")
    .eq("restaurant_id", restaurantId);

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data: productsData, error: prodError } = await query;

  if (prodError) {
    console.error("Products fetch error:", prodError);
    return { error: "Erreur lors du chargement", products: [], categories: [] };
  }

  const products = (productsData as ProductRow[]) || [];

  // Join products with categories
  const productsWithCategory: ProductWithCategory[] = products.map((p) => ({
    ...p,
    category: categories.find((c) => c.id === p.category_id) || null,
  }));

  return { products: productsWithCategory, categories };
}

export async function getDailyMenu(date: string) {
  const supabase = await createClient();
  const restaurantId = await getRestaurantId();

  if (!restaurantId) {
    return { error: "Non authentifié", menu: null };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Get menu for date
  const { data: menuData, error: menuError } = await db
    .from("daily_menus")
    .select("id, date, is_published, show_prices")
    .eq("restaurant_id", restaurantId)
    .eq("date", date)
    .single();

  if (menuError && menuError.code !== "PGRST116") {
    console.error("Menu fetch error:", menuError);
    return { error: "Erreur lors du chargement", menu: null };
  }

  const menu = menuData as DailyMenuRow | null;

  if (!menu) {
    return { menu: null };
  }

  // Get menu items
  const { data: itemsData, error: itemsError } = await db
    .from("daily_menu_items")
    .select("id, product_id, display_order")
    .eq("daily_menu_id", menu.id)
    .order("display_order");

  if (itemsError) {
    console.error("Menu items fetch error:", itemsError);
    return { error: "Erreur lors du chargement", menu: null };
  }

  const items = (itemsData as DailyMenuItemRow[]) || [];

  return {
    menu: {
      ...menu,
      items,
    } as DailyMenuWithItems,
  };
}

export async function saveDailyMenu(
  date: string,
  selectedProductIds: string[],
  productOrders: Record<string, number>,
  options?: { showPrices?: boolean }
) {
  const supabase = await createClient();
  const restaurantId = await getRestaurantId();

  if (!restaurantId) {
    return { error: "Non authentifié" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Check if menu exists for this date
  const { data: existingMenuData } = await db
    .from("daily_menus")
    .select("id, show_prices")
    .eq("restaurant_id", restaurantId)
    .eq("date", date)
    .single();

  const existingMenu = existingMenuData as { id: string; show_prices: boolean } | null;

  let menuId: string;

  if (existingMenu) {
    menuId = existingMenu.id;
    // Delete existing items
    await db.from("daily_menu_items").delete().eq("daily_menu_id", menuId);

    // Update show_prices if provided
    if (options?.showPrices !== undefined) {
      await db
        .from("daily_menus")
        .update({ show_prices: options.showPrices })
        .eq("id", menuId);
    }
  } else {
    // Create new menu
    const { data: newMenuData, error: createError } = await db
      .from("daily_menus")
      .insert({
        restaurant_id: restaurantId,
        date,
        is_published: false,
        show_prices: options?.showPrices ?? true,
      })
      .select("id")
      .single();

    if (createError || !newMenuData) {
      console.error("Menu creation error:", createError);
      return { error: "Erreur lors de la création du menu" };
    }

    menuId = (newMenuData as { id: string }).id;
  }

  // Insert new items
  if (selectedProductIds.length > 0) {
    const itemsData = selectedProductIds.map((productId) => ({
      daily_menu_id: menuId,
      product_id: productId,
      display_order: productOrders[productId] ?? 0,
    }));

    const { error: insertError } = await db
      .from("daily_menu_items")
      .insert(itemsData);

    if (insertError) {
      console.error("Menu items insert error:", insertError);
      return { error: "Erreur lors de l'enregistrement des items" };
    }
  }

  revalidatePath("/dashboard/menu");
  return { success: true, menuId };
}

export async function updateMenuShowPrices(date: string, showPrices: boolean) {
  const supabase = await createClient();
  const restaurantId = await getRestaurantId();

  if (!restaurantId) {
    return { error: "Non authentifié" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { error } = await db
    .from("daily_menus")
    .update({ show_prices: showPrices })
    .eq("restaurant_id", restaurantId)
    .eq("date", date);

  if (error) {
    console.error("Update show_prices error:", error);
    return { error: "Erreur lors de la mise à jour" };
  }

  revalidatePath("/dashboard/menu");
  return { success: true };
}

export async function publishDailyMenu(date: string, publish: boolean) {
  const supabase = await createClient();
  const restaurantId = await getRestaurantId();

  if (!restaurantId) {
    return { error: "Non authentifié" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { error } = await db
    .from("daily_menus")
    .update({ is_published: publish })
    .eq("restaurant_id", restaurantId)
    .eq("date", date);

  if (error) {
    console.error("Publish error:", error);
    return { error: "Erreur lors de la publication" };
  }

  revalidatePath("/dashboard/menu");
  return { success: true };
}

export async function getRestaurantSlug(): Promise<string | null> {
  const supabase = await createClient();
  const restaurantId = await getRestaurantId();

  if (!restaurantId) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("restaurants")
    .select("slug")
    .eq("id", restaurantId)
    .single();

  return (data as { slug: string } | null)?.slug ?? null;
}

export type DashboardStats = {
  totalProducts: number;
  activeProducts: number;
  todayMenuItemsCount: number;
  todayMenuPublished: boolean;
  hasMenu: boolean;
};

export async function getDashboardStats(): Promise<{ stats: DashboardStats | null; error?: string }> {
  const supabase = await createClient();
  const restaurantId = await getRestaurantId();

  if (!restaurantId) {
    return { stats: null, error: "Non authentifié" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Get total products count
  const { count: totalProducts, error: totalError } = await db
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("restaurant_id", restaurantId);

  if (totalError) {
    console.error("Total products count error:", totalError);
    return { stats: null, error: "Erreur lors du chargement des statistiques" };
  }

  // Get active products count
  const { count: activeProducts, error: activeError } = await db
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("restaurant_id", restaurantId)
    .eq("is_active", true);

  if (activeError) {
    console.error("Active products count error:", activeError);
    return { stats: null, error: "Erreur lors du chargement des statistiques" };
  }

  // Get today's menu
  const today = new Date().toISOString().split("T")[0];
  const { data: menuData, error: menuError } = await db
    .from("daily_menus")
    .select("id, is_published")
    .eq("restaurant_id", restaurantId)
    .eq("date", today)
    .single();

  let todayMenuItemsCount = 0;
  let todayMenuPublished = false;
  let hasMenu = false;

  if (menuError && menuError.code !== "PGRST116") {
    console.error("Menu fetch error:", menuError);
  }

  const menu = menuData as { id: string; is_published: boolean } | null;

  if (menu) {
    hasMenu = true;
    todayMenuPublished = menu.is_published;

    // Get menu items count
    const { count: itemsCount, error: itemsError } = await db
      .from("daily_menu_items")
      .select("*", { count: "exact", head: true })
      .eq("daily_menu_id", menu.id);

    if (!itemsError) {
      todayMenuItemsCount = itemsCount || 0;
    }
  }

  return {
    stats: {
      totalProducts: totalProducts || 0,
      activeProducts: activeProducts || 0,
      todayMenuItemsCount,
      todayMenuPublished,
      hasMenu,
    },
  };
}
