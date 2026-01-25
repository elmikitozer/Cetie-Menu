/**
 * MenuPrintTemplate - Template réutilisable pour l'affichage et l'export PDF du menu
 *
 * DIRECTION ARTISTIQUE (DA) - Style Le Severo:
 * - Header 3 colonnes: infos pratiques | date | horaires
 * - Logo S stylisé avec "evero RESTAURANT BOUCHER PARIS TOKYO"
 * - Boisson (champagne) centrée
 * - Sections: Entrées / Plats / Fromages / Desserts (titres centrés soulignés)
 * - Prix alignés à droite format XX.XX
 * - Footer: congés en rouge/typewriter, mentions viandes, moyens de paiement
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
  lunchHours?: string; // e.g., "12h-14h"
  dinnerHours?: string; // e.g., "19h30-21h30"
  holidayNotice?: string; // e.g., "Le Severo sera fermé pour les\ncongés d'hiver du 24/12 au 4/01"
  meatOrigin?: string; // e.g., "Le bœuf est d'origine allemande ou française..."
  paymentNotice?: string; // e.g., "Devant la recrudescence des chèques impayés..."
  subtitle?: string; // e.g., "RESTAURANT"
  type?: string; // e.g., "- BOUCHER -"
  cities?: string; // e.g., "PARIS • TOKYO"
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
  // Format with 2 decimal places (XX.XX style like in PDF)
  const formatted = price.toFixed(2);
  if (priceUnit === "PER_PERSON") {
    return formatted;
  }
  return formatted;
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
    lunchHours: restaurantInfo?.lunchHours ?? "12h-14h",
    dinnerHours: restaurantInfo?.dinnerHours ?? "19h30-21h30",
    holidayNotice: restaurantInfo?.holidayNotice ?? "",
    meatOrigin: restaurantInfo?.meatOrigin ?? "Le boeuf est d'origine allemande ou française le veau est hollandais.",
    paymentNotice: restaurantInfo?.paymentNotice ?? "Devant la recrudescence des chèques impayés, nous vous prions de régler par Carte Bleue, espèces ou tickets restaurant (article 40 décret 92-456 du 22/05/92)",
    subtitle: restaurantInfo?.subtitle ?? "RESTAURANT",
    type: restaurantInfo?.type ?? "- BOUCHER -",
    cities: restaurantInfo?.cities ?? "PARIS • TOKYO",
  };

  // Logo image path (in public folder)
  const logoPath = "/logo-severo.png";

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
    (c) => c.name.toLowerCase() === "boisson" || c.name.toLowerCase() === "boissons"
  );
  const boissonItems = boissonCategory ? itemsByCategory[boissonCategory.id] || [] : [];

  // Other categories (excluding Boisson)
  const mainCategories = sortedCategories.filter(
    (c) => c.name.toLowerCase() !== "boisson" && c.name.toLowerCase() !== "boissons"
  );

  // Map category names to French display titles
  const getCategoryTitle = (name: string): string => {
    const titleMap: Record<string, string> = {
      "Entrée": "Entrées",
      "Entrées": "Entrées",
      "Plat": "Plats",
      "Plats": "Plats",
      "Fromage": "Fromages",
      "Fromages": "Fromages",
      "Dessert": "Desserts",
      "Desserts": "Desserts",
    };
    return titleMap[name] || name;
  };

  const containerClass = `severo-menu-container severo-menu-mode-${mode}${!showPrices ? " severo-no-prices" : ""}`;

  return (
    <div className={containerClass}>
      {/* Header - 3 colonnes */}
      <header className="severo-header">
        <div className="severo-header-col-left">
          <p className="severo-header-line">Carafe d&apos;eau gratuite</p>
          <p className="severo-header-line">Service compris 15%</p>
        </div>
        <div className="severo-header-col-center">
          <p className="severo-header-line">{restaurantName} est ouvert {info.openingDays}</p>
          <p className="severo-header-line">Aujourd&apos;hui {formattedDate}</p>
        </div>
        <div className="severo-header-col-right">
          <p className="severo-header-line severo-header-line-bold">Service {info.lunchHours}</p>
          <p className="severo-header-line severo-header-line-bold">{info.dinnerHours}</p>
        </div>
      </header>

      {/* Logo section */}
      <div className="severo-logo-section">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoPath}
          alt={restaurantName}
          className="severo-logo-image"
        />
        <div className="severo-logo-subtitle-section">
          <p className="severo-logo-subtitle">{info.subtitle}</p>
          <p className="severo-logo-type">{info.type}</p>
          <p className="severo-logo-cities">{info.cities}</p>
        </div>
      </div>

      {/* Boisson section (champagne) - centered single line */}
      {boissonItems.length > 0 && (
        <section className="severo-boisson-section">
          {boissonItems.map((item) => (
            <span key={item.id} className="severo-boisson-item">
              <span className="severo-boisson-name">{item.name}</span>
              {showPrices && item.price != null && (
                <span className="severo-boisson-price">
                  {formatPrice(item.price, item.price_unit)} €
                </span>
              )}
            </span>
          ))}
        </section>
      )}

      {/* Main menu content */}
      <main className="severo-menu-content">
        {mainCategories.map((category) => {
          const categoryItems = itemsByCategory[category.id];
          if (!categoryItems || categoryItems.length === 0) return null;

          const displayTitle = getCategoryTitle(category.name);

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
        <div className="severo-footer-legal">
          {info.meatOrigin && (
            <p className="severo-footer-meat">{info.meatOrigin}</p>
          )}
          {info.paymentNotice && (
            <p className="severo-footer-payment">{info.paymentNotice}</p>
          )}
        </div>
      </footer>
    </div>
  );
}
