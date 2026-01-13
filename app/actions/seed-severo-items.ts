"use server";

/**
 * Server action to seed/update products with Severo menu items
 *
 * This action:
 * 1. Adds new items that don't exist
 * 2. Updates existing items if name or price differs
 * 3. Does not create duplicates
 */

import { createClient } from "@/lib/supabase/server";
import { SEED_ITEMS, CATEGORIES, type SeedItem } from "@/lib/data/seed-items";
import { revalidatePath } from "next/cache";

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

type CategoryRow = {
  id: string;
  name: string;
  display_order: number;
};

type ProductRow = {
  id: string;
  name: string;
  price: number | null;
  price_unit: "FIXED" | "PER_PERSON";
  category_id: string | null;
};

export type SeedResult = {
  success: boolean;
  error?: string;
  stats?: {
    added: number;
    updated: number;
    skipped: number;
    categoriesCreated: number;
  };
};

/**
 * Normalize a string for comparison (lowercase, trim, remove extra spaces)
 */
function normalizeForComparison(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Check if two product names are similar enough to be considered the same
 */
function isSimilarName(name1: string, name2: string): boolean {
  const n1 = normalizeForComparison(name1);
  const n2 = normalizeForComparison(name2);

  // Exact match after normalization
  if (n1 === n2) return true;

  // Check if one contains the other (for slight variations)
  if (n1.includes(n2) || n2.includes(n1)) return true;

  // Check similarity by removing common suffixes/variations
  const cleaned1 = n1.replace(/,?\s*(salade\s*verte?|frites?|haricots?\s*verts?)/gi, "").trim();
  const cleaned2 = n2.replace(/,?\s*(salade\s*verte?|frites?|haricots?\s*verts?)/gi, "").trim();

  if (cleaned1 === cleaned2) return true;

  return false;
}

export async function seedSeveroItems(): Promise<SeedResult> {
  const supabase = await createClient();
  const restaurantId = await getRestaurantId();

  if (!restaurantId) {
    return { success: false, error: "Non authentifié" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const stats = {
    added: 0,
    updated: 0,
    skipped: 0,
    categoriesCreated: 0,
  };

  try {
    // 1. Ensure all categories exist
    const { data: existingCategoriesData } = await db
      .from("categories")
      .select("id, name, display_order")
      .eq("restaurant_id", restaurantId);

    const existingCategories = (existingCategoriesData || []) as CategoryRow[];
    const categoryMap: Record<string, string> = {};

    for (const cat of CATEGORIES) {
      const existing = existingCategories.find(
        (c) => c.name.toLowerCase() === cat.name.toLowerCase()
      );

      if (existing) {
        categoryMap[cat.name] = existing.id;
      } else {
        // Create the category
        const { data: newCat, error: catError } = await db
          .from("categories")
          .insert({
            restaurant_id: restaurantId,
            name: cat.name,
            display_order: cat.displayOrder,
          })
          .select("id")
          .single();

        if (catError) {
          console.error(`Error creating category ${cat.name}:`, catError);
          continue;
        }

        categoryMap[cat.name] = (newCat as { id: string }).id;
        stats.categoriesCreated++;
      }
    }

    // 2. Get existing products
    const { data: existingProductsData } = await db
      .from("products")
      .select("id, name, price, price_unit, category_id")
      .eq("restaurant_id", restaurantId);

    const existingProducts = (existingProductsData || []) as ProductRow[];

    // 3. Process each seed item
    for (const item of SEED_ITEMS) {
      const categoryId = categoryMap[item.category];

      if (!categoryId) {
        console.warn(`Category not found for item: ${item.name}`);
        stats.skipped++;
        continue;
      }

      // Find existing product by similar name
      const existing = existingProducts.find((p) => isSimilarName(p.name, item.name));

      if (existing) {
        // Check if update is needed
        const needsUpdate =
          !isSimilarName(existing.name, item.name) || // Name has minor differences
          existing.price !== item.price ||
          existing.price_unit !== (item.priceUnit || "FIXED") ||
          existing.category_id !== categoryId;

        if (needsUpdate) {
          const { error: updateError } = await db
            .from("products")
            .update({
              name: item.name,
              price: item.price,
              price_unit: item.priceUnit || "FIXED",
              category_id: categoryId,
            })
            .eq("id", existing.id);

          if (updateError) {
            console.error(`Error updating product ${item.name}:`, updateError);
            stats.skipped++;
          } else {
            stats.updated++;
          }
        } else {
          stats.skipped++;
        }
      } else {
        // Create new product
        const { error: insertError } = await db
          .from("products")
          .insert({
            restaurant_id: restaurantId,
            category_id: categoryId,
            name: item.name,
            price: item.price,
            price_unit: item.priceUnit || "FIXED",
            is_active: true,
          });

        if (insertError) {
          console.error(`Error creating product ${item.name}:`, insertError);
          stats.skipped++;
        } else {
          stats.added++;
        }
      }
    }

    revalidatePath("/dashboard/produits");
    revalidatePath("/dashboard");

    return { success: true, stats };
  } catch (error) {
    console.error("Seed error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Get a preview of what would be seeded/updated
 */
export async function previewSeedItems(): Promise<{
  success: boolean;
  error?: string;
  preview?: {
    toAdd: SeedItem[];
    toUpdate: Array<{ current: ProductRow; new: SeedItem }>;
    unchanged: number;
  };
}> {
  const supabase = await createClient();
  const restaurantId = await getRestaurantId();

  if (!restaurantId) {
    return { success: false, error: "Non authentifié" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  try {
    // Get existing products
    const { data: existingProductsData } = await db
      .from("products")
      .select("id, name, price, price_unit, category_id")
      .eq("restaurant_id", restaurantId);

    const existingProducts = (existingProductsData || []) as ProductRow[];

    const toAdd: SeedItem[] = [];
    const toUpdate: Array<{ current: ProductRow; new: SeedItem }> = [];
    let unchanged = 0;

    for (const item of SEED_ITEMS) {
      const existing = existingProducts.find((p) => isSimilarName(p.name, item.name));

      if (!existing) {
        toAdd.push(item);
      } else {
        const needsUpdate =
          existing.price !== item.price ||
          existing.price_unit !== (item.priceUnit || "FIXED");

        if (needsUpdate) {
          toUpdate.push({ current: existing, new: item });
        } else {
          unchanged++;
        }
      }
    }

    return {
      success: true,
      preview: { toAdd, toUpdate, unchanged },
    };
  } catch (error) {
    console.error("Preview error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

