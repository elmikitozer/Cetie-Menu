/**
 * Route API: /api/menu/pdf
 *
 * Génère et télécharge le PDF du menu du jour.
 *
 * Query params:
 * - slug: slug du restaurant (required)
 * - date: date au format YYYY-MM-DD (optional, default: today)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateMenuPdf } from "@/lib/pdf/generate-menu-pdf";
import type { MenuTemplateData } from "@/components/menu/MenuPrintTemplate";

export const dynamic = "force-dynamic";
export const maxDuration = 30; // Vercel timeout

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  if (!slug) {
    return NextResponse.json(
      { error: "Le paramètre 'slug' est requis" },
      { status: 400 }
    );
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Format de date invalide. Utilisez YYYY-MM-DD" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // 1. Fetch restaurant by slug
    const { data: restaurant, error: restaurantError } = await db
      .from("restaurants")
      .select("id, name")
      .eq("slug", slug)
      .single();

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: "Restaurant non trouvé" },
        { status: 404 }
      );
    }

    const { id: restaurantId, name: restaurantName } = restaurant as {
      id: string;
      name: string;
    };

    // 2. Fetch daily menu for the date
    const { data: menu, error: menuError } = await db
      .from("daily_menus")
      .select("id, is_published")
      .eq("restaurant_id", restaurantId)
      .eq("date", date)
      .single();

    if (menuError && menuError.code !== "PGRST116") {
      console.error("Menu fetch error:", menuError);
      return NextResponse.json(
        { error: "Erreur lors de la récupération du menu" },
        { status: 500 }
      );
    }

    if (!menu) {
      return NextResponse.json(
        { error: `Aucun menu trouvé pour le ${date}` },
        { status: 404 }
      );
    }

    const { id: menuId } = menu as { id: string };

    // 3. Fetch menu items
    const { data: menuItems, error: itemsError } = await db
      .from("daily_menu_items")
      .select("product_id, display_order")
      .eq("daily_menu_id", menuId)
      .order("display_order");

    if (itemsError) {
      console.error("Menu items fetch error:", itemsError);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des items" },
        { status: 500 }
      );
    }

    const items = (menuItems || []) as Array<{
      product_id: string;
      display_order: number;
    }>;

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Le menu est vide" },
        { status: 404 }
      );
    }

    // 4. Fetch products
    const productIds = items.map((item) => item.product_id);
    const { data: productsData, error: productsError } = await db
      .from("products")
      .select("id, name, description, price, category_id")
      .in("id", productIds);

    if (productsError) {
      console.error("Products fetch error:", productsError);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des produits" },
        { status: 500 }
      );
    }

    const products = (productsData || []) as Array<{
      id: string;
      name: string;
      description: string | null;
      price: number | null;
      category_id: string | null;
    }>;

    // 5. Fetch categories
    const categoryIds = Array.from(
      new Set(products.map((p) => p.category_id).filter(Boolean))
    ) as string[];

    let categories: Array<{
      id: string;
      name: string;
      display_order: number;
    }> = [];

    if (categoryIds.length > 0) {
      const { data: categoriesData } = await db
        .from("categories")
        .select("id, name, display_order")
        .in("id", categoryIds);

      categories = (categoriesData || []) as typeof categories;
    }

    // 6. Order products according to menu item order
    const orderedProducts = items
      .map((item) => products.find((p) => p.id === item.product_id))
      .filter(Boolean) as typeof products;

    // 7. Prepare template data
    const templateData: MenuTemplateData = {
      restaurantName,
      date,
      items: orderedProducts,
      categories,
    };

    // 8. Generate PDF
    const pdfBuffer = await generateMenuPdf(templateData);

    // 9. Generate filename
    const formattedDate = date.replace(/-/g, "");
    const safeRestaurantName = restaurantName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    const filename = `menu-${safeRestaurantName}-${formattedDate}.pdf`;

    // 10. Return PDF
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la génération du PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
