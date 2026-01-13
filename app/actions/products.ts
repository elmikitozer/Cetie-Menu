"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type PriceUnit = "FIXED" | "PER_PERSON";

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

export type ProductInput = {
  name: string;
  categoryId: string;
  price?: number | null; // Price in euros (e.g., 14.50)
  priceUnit?: PriceUnit;
};

export async function addProduct(input: ProductInput) {
  const supabase = await createClient();
  const restaurantId = await getRestaurantId();

  if (!restaurantId) {
    return { error: "Non authentifié" };
  }

  if (!input.name.trim()) {
    return { error: "Le nom du produit est requis" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data, error } = await db
    .from("products")
    .insert({
      restaurant_id: restaurantId,
      category_id: input.categoryId,
      name: input.name.trim(),
      price: input.price ?? null,
      price_unit: input.priceUnit ?? "FIXED",
      is_active: true,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Add product error:", error);
    return { error: "Erreur lors de l'ajout du produit" };
  }

  revalidatePath("/dashboard/produits");
  revalidatePath("/dashboard");
  return { success: true, productId: (data as { id: string }).id };
}

export async function updateProduct(
  productId: string,
  updates: {
    name?: string;
    categoryId?: string;
    price?: number | null;
    priceUnit?: PriceUnit;
  }
) {
  const supabase = await createClient();
  const restaurantId = await getRestaurantId();

  if (!restaurantId) {
    return { error: "Non authentifié" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Verify the product belongs to this restaurant
  const { data: product, error: fetchError } = await db
    .from("products")
    .select("id, restaurant_id")
    .eq("id", productId)
    .single();

  if (fetchError || !product) {
    return { error: "Produit introuvable" };
  }

  if ((product as { restaurant_id: string }).restaurant_id !== restaurantId) {
    return { error: "Non autorisé" };
  }

  const updateData: Record<string, unknown> = {};
  if (updates.name !== undefined) updateData.name = updates.name.trim();
  if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId;
  if (updates.price !== undefined) updateData.price = updates.price;
  if (updates.priceUnit !== undefined) updateData.price_unit = updates.priceUnit;

  const { error } = await db
    .from("products")
    .update(updateData)
    .eq("id", productId);

  if (error) {
    console.error("Update product error:", error);
    return { error: "Erreur lors de la mise à jour" };
  }

  revalidatePath("/dashboard/produits");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/menu");
  return { success: true };
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient();
  const restaurantId = await getRestaurantId();

  if (!restaurantId) {
    return { error: "Non authentifié" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Verify the product belongs to this restaurant
  const { data: product, error: fetchError } = await db
    .from("products")
    .select("id, restaurant_id")
    .eq("id", productId)
    .single();

  if (fetchError || !product) {
    return { error: "Produit introuvable" };
  }

  if ((product as { restaurant_id: string }).restaurant_id !== restaurantId) {
    return { error: "Non autorisé" };
  }

  const { error } = await db
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) {
    console.error("Delete product error:", error);
    return { error: "Erreur lors de la suppression" };
  }

  revalidatePath("/dashboard/produits");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/menu");
  return { success: true };
}

export async function toggleProductActive(productId: string, isActive: boolean) {
  const supabase = await createClient();
  const restaurantId = await getRestaurantId();

  if (!restaurantId) {
    return { error: "Non authentifié" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Verify the product belongs to this restaurant
  const { data: product, error: fetchError } = await db
    .from("products")
    .select("id, restaurant_id")
    .eq("id", productId)
    .single();

  if (fetchError || !product) {
    return { error: "Produit introuvable" };
  }

  if ((product as { restaurant_id: string }).restaurant_id !== restaurantId) {
    return { error: "Non autorisé" };
  }

  const { error } = await db
    .from("products")
    .update({ is_active: isActive })
    .eq("id", productId);

  if (error) {
    console.error("Toggle product error:", error);
    return { error: "Erreur lors de la mise à jour" };
  }

  revalidatePath("/dashboard/produits");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/menu");
  return { success: true };
}

export async function getCategories() {
  const supabase = await createClient();
  const restaurantId = await getRestaurantId();

  if (!restaurantId) {
    return { error: "Non authentifié", categories: [] };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data, error } = await db
    .from("categories")
    .select("id, name, display_order")
    .eq("restaurant_id", restaurantId)
    .order("display_order");

  if (error) {
    console.error("Get categories error:", error);
    return { error: "Erreur lors du chargement", categories: [] };
  }

  return {
    categories: (data || []) as Array<{ id: string; name: string; display_order: number }>,
  };
}
