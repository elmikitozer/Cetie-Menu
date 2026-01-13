/**
 * MenuPrintTemplate - Template réutilisable pour l'affichage et l'export PDF du menu
 *
 * DIRECTION ARTISTIQUE (DA):
 * Pour modifier l'apparence du menu, éditez ce fichier et le fichier CSS associé :
 * - Ce composant : structure HTML du menu
 * - styles/menu-print.css : styles d'impression et de mise en page
 */

import "./menu-print.css";

export type PriceUnit = "FIXED" | "PER_PERSON";

export type MenuCategory = {
  id: string;
  name: string;
  display_order: number;
};

export type MenuItem = {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  price_unit?: PriceUnit;
  category_id: string | null;
};

export type MenuTemplateData = {
  restaurantName: string;
  date: string; // Format: YYYY-MM-DD
  items: MenuItem[];
  categories: MenuCategory[];
  showPrices?: boolean; // Default: true
};

interface MenuPrintTemplateProps {
  data: MenuTemplateData;
  /** Mode d'affichage : 'screen' pour web, 'print' pour PDF */
  mode?: "screen" | "print";
}

function formatDateFrench(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatPrice(price: number, priceUnit: PriceUnit = "FIXED"): string {
  const formatted = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(price);
  return priceUnit === "PER_PERSON" ? `${formatted} / pers.` : formatted;
}

export function MenuPrintTemplate({
  data,
  mode = "screen",
}: MenuPrintTemplateProps) {
  const { restaurantName, date, items, categories, showPrices = true } = data;

  // Group items by category
  const itemsByCategory: Record<string, MenuItem[]> = {};
  const sortedCategories = [...categories].sort(
    (a, b) => a.display_order - b.display_order
  );

  sortedCategories.forEach((cat) => {
    const catItems = items.filter((item) => item.category_id === cat.id);
    if (catItems.length > 0) {
      itemsByCategory[cat.id] = catItems;
    }
  });

  // Items without category
  const uncategorizedItems = items.filter((item) => !item.category_id);

  const formattedDate = formatDateFrench(date);

  return (
    <div className={`menu-print-container menu-print-mode-${mode}`}>
      {/* Header */}
      <header className="menu-print-header">
        <h1 className="menu-print-restaurant-name">{restaurantName}</h1>
        <div className="menu-print-title">Menu du jour</div>
        <div className="menu-print-date">{formattedDate}</div>
      </header>

      {/* Decorative divider */}
      <div className="menu-print-divider">
        <span className="menu-print-divider-ornament">✦</span>
      </div>

      {/* Menu content */}
      <main className="menu-print-content">
        {sortedCategories.map((category) => {
          const categoryItems = itemsByCategory[category.id];
          if (!categoryItems || categoryItems.length === 0) return null;

          return (
            <section key={category.id} className="menu-print-category">
              <h2 className="menu-print-category-title">{category.name}</h2>
              <ul className={`menu-print-items ${!showPrices ? "menu-print-items-no-price" : ""}`}>
                {categoryItems.map((item) => (
                  <li key={item.id} className="menu-print-item">
                    <div className={`menu-print-item-header ${!showPrices ? "menu-print-item-header-no-price" : ""}`}>
                      <span className="menu-print-item-name">{item.name}</span>
                      {showPrices && item.price != null && (
                        <span className="menu-print-item-price">
                          {formatPrice(item.price, item.price_unit)}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="menu-print-item-description">
                        {item.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {/* Uncategorized items */}
        {uncategorizedItems.length > 0 && (
          <section className="menu-print-category">
            <h2 className="menu-print-category-title">Autres</h2>
            <ul className={`menu-print-items ${!showPrices ? "menu-print-items-no-price" : ""}`}>
              {uncategorizedItems.map((item) => (
                <li key={item.id} className="menu-print-item">
                  <div className={`menu-print-item-header ${!showPrices ? "menu-print-item-header-no-price" : ""}`}>
                    <span className="menu-print-item-name">{item.name}</span>
                    {showPrices && item.price != null && (
                      <span className="menu-print-item-price">
                        {formatPrice(item.price, item.price_unit)}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="menu-print-item-description">
                      {item.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="menu-print-footer">
        <p className="menu-print-footer-text">Bon appétit !</p>
      </footer>
    </div>
  );
}
