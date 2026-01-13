/**
 * MenuPrintTemplate - Template réutilisable pour l'affichage et l'export PDF du menu
 *
 * DIRECTION ARTISTIQUE (DA) - Style Le Severo:
 * - En-tête: infos pratiques, nom restaurant, horaires
 * - Date au centre
 * - Boisson (champagne) au-dessus des entrées
 * - Sections: Entrées / Plats / Fromages / Desserts
 * - Prix alignés à droite avec 2 décimales
 * - Footer: congés, mentions viandes, moyens de paiement
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

export type RestaurantInfo = {
  openingDays?: string; // e.g., "du lundi au vendredi"
  serviceHours?: string; // e.g., "12h-14h / 19h30-21h30"
  holidayNotice?: string; // e.g., "fermé pour les congés d'hiver du 24/12 au 4/01"
  meatOrigin?: string; // e.g., "Le bœuf est d'origine allemande ou française..."
  paymentNotice?: string; // e.g., "Devant la recrudescence des chèques impayés..."
};

export type MenuTemplateData = {
  restaurantName: string;
  date: string; // Format: YYYY-MM-DD
  items: MenuItem[];
  categories: MenuCategory[];
  showPrices?: boolean; // Default: true
  restaurantInfo?: RestaurantInfo;
};

interface MenuPrintTemplateProps {
  data: MenuTemplateData;
  /** Mode d'affichage : 'screen' pour web, 'print' pour PDF */
  mode?: "screen" | "print";
}

function formatDateSevero(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const day = date.getDate();
  const monthNames = [
    "janv.", "févr.", "mars", "avr.", "mai", "juin",
    "juil.", "août", "sept.", "oct.", "nov.", "déc."
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear().toString().slice(-2);
  return `${day}-${month}-${year}`;
}

function formatPrice(price: number, priceUnit: PriceUnit = "FIXED"): string {
  // Format with 2 decimal places, French style
  const formatted = price.toFixed(2).replace(".", ",");
  if (priceUnit === "PER_PERSON") {
    return `${formatted} €`;
  }
  return `${formatted} €`;
}

export function MenuPrintTemplate({
  data,
  mode = "screen",
}: MenuPrintTemplateProps) {
  const {
    restaurantName,
    date,
    items,
    categories,
    showPrices = true,
    restaurantInfo,
  } = data;

  // Default restaurant info (Le Severo style)
  const info: RestaurantInfo = {
    openingDays: restaurantInfo?.openingDays ?? "du lundi au vendredi",
    serviceHours: restaurantInfo?.serviceHours ?? "12h-14h   19h30-21h30",
    holidayNotice: restaurantInfo?.holidayNotice ?? "",
    meatOrigin: restaurantInfo?.meatOrigin ?? "Le bœuf est d'origine allemande ou française le veau est hollandais.",
    paymentNotice: restaurantInfo?.paymentNotice ?? "Devant la recrudescence des chèques impayés, nous vous prions de régler par Carte Bleue, espèces ou tickets restaurant (article 40 décret 92-456 du 22/05/92)",
  };

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

  const formattedDate = formatDateSevero(date);

  // Find Boisson category and separate it
  const boissonCategory = sortedCategories.find(
    (c) => c.name.toLowerCase() === "boisson"
  );
  const boissonItems = boissonCategory ? itemsByCategory[boissonCategory.id] || [] : [];

  // Other categories (excluding Boisson)
  const mainCategories = sortedCategories.filter(
    (c) => c.name.toLowerCase() !== "boisson"
  );

  return (
    <div className={`severo-menu-container severo-menu-mode-${mode}`}>
      {/* Top header bar */}
      <header className="severo-header">
        <div className="severo-header-top">
          <span className="severo-header-left">Carafe d'eau gratuite</span>
          <span className="severo-header-right">Service compris 15%</span>
        </div>

        <div className="severo-header-info">
          <span className="severo-restaurant-name">{restaurantName}</span>
          <span className="severo-opening">
            est ouvert {info.openingDays}
          </span>
        </div>

        <div className="severo-header-date">
          Aujourd'hui {formattedDate}
        </div>

        <div className="severo-header-hours">
          Service {info.serviceHours}
        </div>
      </header>

      {/* Boisson section (champagne) - before main menu */}
      {boissonItems.length > 0 && (
        <section className="severo-boisson-section">
          {boissonItems.map((item) => (
            <div key={item.id} className="severo-boisson-item">
              <span className="severo-boisson-name">{item.name}</span>
              {showPrices && item.price != null && (
                <span className="severo-boisson-price">
                  {formatPrice(item.price, item.price_unit)}
                </span>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Main menu content */}
      <main className="severo-menu-content">
        {mainCategories.map((category) => {
          const categoryItems = itemsByCategory[category.id];
          if (!categoryItems || categoryItems.length === 0) return null;

          // Map category names to French titles
          const categoryTitles: Record<string, string> = {
            "Entrée": "Entrées",
            "Plat": "Plats",
            "Fromage": "Fromages",
            "Dessert": "Desserts",
          };
          const displayTitle = categoryTitles[category.name] || category.name;

          return (
            <section key={category.id} className="severo-category">
              <h2 className="severo-category-title">{displayTitle}</h2>
              <ul className="severo-items-list">
                {categoryItems.map((item) => (
                  <li key={item.id} className="severo-item">
                    <span className="severo-item-name">{item.name}</span>
                    {showPrices && item.price != null && (
                      <span className="severo-item-price">
                        {formatPrice(item.price, item.price_unit)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {/* Uncategorized items */}
        {uncategorizedItems.length > 0 && (
          <section className="severo-category">
            <h2 className="severo-category-title">Autres</h2>
            <ul className="severo-items-list">
              {uncategorizedItems.map((item) => (
                <li key={item.id} className="severo-item">
                  <span className="severo-item-name">{item.name}</span>
                  {showPrices && item.price != null && (
                    <span className="severo-item-price">
                      {formatPrice(item.price, item.price_unit)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="severo-footer">
        {info.holidayNotice && (
          <p className="severo-footer-holiday">{info.holidayNotice}</p>
        )}
        {info.meatOrigin && (
          <p className="severo-footer-meat">{info.meatOrigin}</p>
        )}
        {info.paymentNotice && (
          <p className="severo-footer-payment">{info.paymentNotice}</p>
        )}
      </footer>
    </div>
  );
}
