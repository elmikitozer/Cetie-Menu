"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { CATEGORIES, SEED_ITEMS } from "@/lib/data/seed-items";

const ADMIN_RESTAURANT_COOKIE = "admin_selected_restaurant";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // 1. Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Non authentifié" };
  }

  // Only super admins can create restaurants
  const { data: roleData } = await db
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (roleData as { role?: string } | null)?.role;
  if (role !== "admin") {
    return { error: "Seuls les administrateurs peuvent créer un restaurant" };
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

  // 4. Only link the user if they're not a super admin
  if (role !== "admin") {
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

// Switch restaurant for admin users
export async function switchRestaurant(restaurantId: string) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié" };
  }

  // Check if user is admin
  const { data: profileData } = await db
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const profile = profileData as { role: string } | null;

  if (profile?.role !== "admin") {
    return { error: "Seuls les administrateurs peuvent changer de restaurant" };
  }

  // Verify restaurant exists
  const { data: restaurant } = await db
    .from("restaurants")
    .select("id")
    .eq("id", restaurantId)
    .single();

  if (!restaurant) {
    return { error: "Restaurant introuvable" };
  }

  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_RESTAURANT_COOKIE, restaurantId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  revalidatePath("/dashboard");
  return { success: true };
}

// Upload logo to Supabase Storage
export async function uploadLogo(formData: FormData) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié" };
  }

  const file = formData.get("file") as File;
  const restaurantId = formData.get("restaurantId") as string;

  if (!file) {
    return { error: "Aucun fichier fourni" };
  }

  // Get user's role and restaurant
  const { data: profileData } = await db
    .from("users")
    .select("restaurant_id, role")
    .eq("id", user.id)
    .single();

  const profile = profileData as { restaurant_id: string | null; role: string } | null;

  // Determine which restaurant to update
  const targetRestaurantId = profile?.role === "admin" && restaurantId
    ? restaurantId
    : profile?.restaurant_id;

  if (!targetRestaurantId) {
    return { error: "Aucun restaurant trouvé" };
  }

  // Only owners and admins can update
  if (profile?.role !== "owner" && profile?.role !== "admin") {
    return { error: "Non autorisé" };
  }

  // Upload to Supabase Storage
  const fileExt = file.name.split(".").pop();
  const fileName = `${targetRestaurantId}/logo.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("logos")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return { error: "Erreur lors de l'upload du fichier" };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("logos")
    .getPublicUrl(fileName);

  const logoUrl = urlData.publicUrl;

  // Update restaurant with new logo URL
  const { error: updateError } = await db
    .from("restaurants")
    .update({ logo_url: logoUrl })
    .eq("id", targetRestaurantId);

  if (updateError) {
    console.error("Update error:", updateError);
    return { error: "Erreur lors de la mise à jour du restaurant" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/parametres");
  return { success: true, logoUrl };
}

// Update restaurant settings (name, logo, PDF design fields)
export async function updateRestaurant(data: {
  restaurantId?: string; // For admin to specify which restaurant
  name?: string;
  logoUrl?: string | null;
  // PDF Design fields
  openingDays?: string | null;
  openingDays2?: string | null;
  lunchHours?: string | null;
  dinnerHours?: string | null;
  holidayNotice?: string | null;
  meatOrigin?: string | null;
  paymentNotice?: string | null;
  subtitle?: string | null;
  restaurantType?: string | null;
  cities?: string | null;
  sidesNote?: string | null;
}) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non authentifié" };
  }

  // Get user's restaurant
  const { data: profileData } = await db
    .from("users")
    .select("restaurant_id, role")
    .eq("id", user.id)
    .single();

  const profile = profileData as { restaurant_id: string | null; role: string } | null;

  // Determine which restaurant to update
  const targetRestaurantId = profile?.role === "admin" && data.restaurantId
    ? data.restaurantId
    : profile?.restaurant_id;

  if (!targetRestaurantId) {
    return { error: "Aucun restaurant trouvé" };
  }

  // Only owners and admins can update restaurant settings
  if (profile?.role !== "owner" && profile?.role !== "admin") {
    return { error: "Seuls les propriétaires peuvent modifier les paramètres du restaurant" };
  }

  // Build update object
  const updateData: Record<string, string | null | undefined> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.logoUrl !== undefined) updateData.logo_url = data.logoUrl;
  if (data.openingDays !== undefined) updateData.opening_days = data.openingDays;
  if (data.openingDays2 !== undefined) updateData.opening_days_2 = data.openingDays2;
  if (data.lunchHours !== undefined) updateData.lunch_hours = data.lunchHours;
  if (data.dinnerHours !== undefined) updateData.dinner_hours = data.dinnerHours;
  if (data.holidayNotice !== undefined) updateData.holiday_notice = data.holidayNotice;
  if (data.meatOrigin !== undefined) updateData.meat_origin = data.meatOrigin;
  if (data.paymentNotice !== undefined) updateData.payment_notice = data.paymentNotice;
  if (data.subtitle !== undefined) updateData.subtitle = data.subtitle;
  if (data.restaurantType !== undefined) updateData.restaurant_type = data.restaurantType;
  if (data.cities !== undefined) updateData.cities = data.cities;
  if (data.sidesNote !== undefined) updateData.sides_note = data.sidesNote;

  if (Object.keys(updateData).length === 0) {
    return { error: "Aucune modification" };
  }

  const { error } = await db
    .from("restaurants")
    .update(updateData)
    .eq("id", targetRestaurantId);

  if (error) {
    console.error("Restaurant update error:", error);
    return { error: "Erreur lors de la mise à jour du restaurant" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/parametres");
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
    .select("restaurant_id, role")
    .eq("id", user.id)
    .single();

  const profile = profileData as { restaurant_id: string | null; role?: string } | null;

  if (!profile?.restaurant_id) {
    return { error: "Aucun restaurant trouvé" };
  }
  if (profile.role !== "owner" && profile.role !== "admin") {
    return { error: "Non autorisé" };
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
