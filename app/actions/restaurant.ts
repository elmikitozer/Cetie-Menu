"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { CATEGORIES, SEED_ITEMS } from "@/lib/data/seed-items";

// Type helpers for Supabase responses
type CategoryRow = { id: string; name: string };
type RestaurantRow = { id: string; name: string; slug: string };

function generateSlug(name: string): string {
  let slug = name.toLowerCase();
  slug = slug.replace(/[^a-z0-9]+/g, "-");
  slug = slug.replace(/-+/g, "-");
  slug = slug.replace(/^-|-$/g, "");
  // Add random suffix to ensure uniqueness
  slug = `${slug}-${Math.random().toString(36).substring(2, 8)}`;
  return slug;
}

export async function initializeRestaurant(restaurantName: string = "Mon Restaurant") {
  const supabase = await createClient();

  // 1. Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Non authentifié" };
  }

  // 2. Check if user already has a profile with restaurant
  const { data: existingProfileData } = await supabase
    .from("users")
    .select("id, restaurant_id")
    .eq("id", user.id)
    .single();

  const existingProfile = existingProfileData as { id: string; restaurant_id: string | null } | null;

  if (existingProfile?.restaurant_id) {
    // Already initialized, check if products exist
    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("restaurant_id", existingProfile.restaurant_id);

    if (count && count > 0) {
      return { error: "Restaurant déjà initialisé", alreadyExists: true };
    }

    // Restaurant exists but no products - seed them
    return await seedProducts(existingProfile.restaurant_id);
  }

  // 3. Create restaurant
  const slug = generateSlug(restaurantName);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: restaurantData, error: restaurantError } = await (supabase as any)
    .from("restaurants")
    .insert({ name: restaurantName, slug })
    .select()
    .single();

  const restaurant = restaurantData as RestaurantRow | null;

  if (restaurantError || !restaurant) {
    console.error("Restaurant creation error:", restaurantError);
    return { error: "Erreur lors de la création du restaurant" };
  }

  // 4. Create or update user profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: profileError } = await (supabase as any).from("users").upsert({
    id: user.id,
    email: user.email!,
    restaurant_id: restaurant.id,
    role: "owner",
  });

  if (profileError) {
    console.error("Profile creation error:", profileError);
    return { error: "Erreur lors de la création du profil" };
  }

  // 5. Create categories
  const categoriesInsertData = CATEGORIES.map((cat) => ({
    restaurant_id: restaurant.id,
    name: cat.name,
    display_order: cat.displayOrder,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: categoriesResult, error: categoriesError } = await (supabase as any)
    .from("categories")
    .insert(categoriesInsertData)
    .select();

  const categories = categoriesResult as CategoryRow[] | null;

  if (categoriesError || !categories) {
    console.error("Categories creation error:", categoriesError);
    return { error: "Erreur lors de la création des catégories" };
  }

  // 6. Create products
  const categoryMap = new Map(categories.map((c) => [c.name, c.id]));

  const productsData = SEED_ITEMS.map((item) => ({
    restaurant_id: restaurant.id,
    category_id: categoryMap.get(item.category),
    name: item.name,
    is_active: true,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: productsError } = await (supabase as any)
    .from("products")
    .insert(productsData);

  if (productsError) {
    console.error("Products creation error:", productsError);
    return { error: "Erreur lors de la création des produits" };
  }

  revalidatePath("/dashboard");
  return { success: true, restaurantId: restaurant.id };
}

async function seedProducts(restaurantId: string) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Get existing categories
  const { data: categoriesData } = await db
    .from("categories")
    .select("id, name")
    .eq("restaurant_id", restaurantId);

  const categories = categoriesData as CategoryRow[] | null;

  if (!categories || categories.length === 0) {
    // Create categories first
    const categoriesInsert = CATEGORIES.map((cat) => ({
      restaurant_id: restaurantId,
      name: cat.name,
      display_order: cat.displayOrder,
    }));

    const { data: newCategoriesData, error } = await db
      .from("categories")
      .insert(categoriesInsert)
      .select();

    const newCategories = newCategoriesData as CategoryRow[] | null;

    if (error || !newCategories) {
      return { error: "Erreur lors de la création des catégories" };
    }

    const categoryMap = new Map(newCategories.map((c) => [c.name, c.id]));
    const productsData = SEED_ITEMS.map((item) => ({
      restaurant_id: restaurantId,
      category_id: categoryMap.get(item.category),
      name: item.name,
      is_active: true,
    }));

    const { error: productsError } = await db.from("products").insert(productsData);

    if (productsError) {
      return { error: "Erreur lors de la création des produits" };
    }
  } else {
    const categoryMap = new Map(categories.map((c) => [c.name, c.id]));
    const productsData = SEED_ITEMS.map((item) => ({
      restaurant_id: restaurantId,
      category_id: categoryMap.get(item.category),
      name: item.name,
      is_active: true,
    }));

    const { error: productsError } = await db.from("products").insert(productsData);

    if (productsError) {
      return { error: "Erreur lors de la création des produits" };
    }
  }

  revalidatePath("/dashboard");
  return { success: true };
}

// DEV ONLY: Reset and reimport all items
export async function resetAndReimportItems() {
  if (process.env.NODE_ENV !== "development") {
    return { error: "Cette action n'est disponible qu'en développement" };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié" };
  }

  const { data: profileData } = await db
    .from("users")
    .select("restaurant_id")
    .eq("id", user.id)
    .single();

  const profile = profileData as { restaurant_id: string | null } | null;

  if (!profile?.restaurant_id) {
    return { error: "Aucun restaurant trouvé" };
  }

  const restaurantId = profile.restaurant_id;

  // Delete all existing products
  await db.from("products").delete().eq("restaurant_id", restaurantId);

  // Delete all existing categories
  await db.from("categories").delete().eq("restaurant_id", restaurantId);

  // Recreate categories
  const categoriesData = CATEGORIES.map((cat) => ({
    restaurant_id: restaurantId,
    name: cat.name,
    display_order: cat.displayOrder,
  }));

  const { data: categoriesResult, error: catError } = await db
    .from("categories")
    .insert(categoriesData)
    .select();

  const categories = categoriesResult as CategoryRow[] | null;

  if (catError || !categories) {
    return { error: "Erreur lors de la recréation des catégories" };
  }

  // Recreate products
  const categoryMap = new Map(categories.map((c) => [c.name, c.id]));
  const productsData = SEED_ITEMS.map((item) => ({
    restaurant_id: restaurantId,
    category_id: categoryMap.get(item.category),
    name: item.name,
    is_active: true,
  }));

  const { error: prodError } = await db.from("products").insert(productsData);

  if (prodError) {
    return { error: "Erreur lors de la recréation des produits" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/produits");
  return { success: true, message: "18 produits réimportés" };
}
