/**
 * PDF Generation Service - Style Le Severo
 *
 * Génère un PDF A4 du menu au style bistrot parisien.
 * Compatible avec Vercel (utilise @sparticuz/chromium en production).
 */

import type { MenuTemplateData, PriceUnit, RestaurantInfo } from "@/components/menu/MenuPrintTemplate";

// Lazy imports for serverless
let chromiumPromise: Promise<typeof import("@sparticuz/chromium")> | null = null;
let puppeteerPromise: Promise<typeof import("puppeteer-core")> | null = null;

async function getChromium() {
  if (!chromiumPromise) {
    chromiumPromise = import("@sparticuz/chromium");
  }
  return chromiumPromise;
}

async function getPuppeteer() {
  if (!puppeteerPromise) {
    puppeteerPromise = import("puppeteer-core");
  }
  return puppeteerPromise;
}

/**
 * Format date in Severo style: "13-janv.-26"
 */
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

/**
 * Format price with 2 decimals, comma separator
 */
function formatPrice(price: number, priceUnit: PriceUnit = "FIXED"): string {
  const formatted = price.toFixed(2).replace(".", ",");
  if (priceUnit === "PER_PERSON") {
    return `${formatted} €`;
  }
  return `${formatted} €`;
}

/**
 * Génère le HTML complet pour le PDF - Style Le Severo
 */
function generateMenuHtml(data: MenuTemplateData): string {
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

  // Format date
  const formattedDate = formatDateSevero(date);

  // Group items by category
  const sortedCategories = [...categories].sort(
    (a, b) => a.display_order - b.display_order
  );

  const itemsByCategory: Record<string, typeof items> = {};
  sortedCategories.forEach((cat) => {
    const catItems = items.filter((item) => item.category_id === cat.id);
    if (catItems.length > 0) {
      itemsByCategory[cat.id] = catItems;
    }
  });

  const uncategorizedItems = items.filter((item) => !item.category_id);

  // Find Boisson category
  const boissonCategory = sortedCategories.find(
    (c) => c.name.toLowerCase() === "boisson"
  );
  const boissonItems = boissonCategory ? itemsByCategory[boissonCategory.id] || [] : [];

  // Other categories (excluding Boisson)
  const mainCategories = sortedCategories.filter(
    (c) => c.name.toLowerCase() !== "boisson"
  );

  // Category titles mapping
  const categoryTitles: Record<string, string> = {
    "Entrée": "Entrées",
    "Plat": "Plats",
    "Fromage": "Fromages",
    "Dessert": "Desserts",
  };

  // Generate item HTML
  const generateItemHtml = (item: typeof items[0]) => {
    const showPrice = showPrices && item.price != null;
    return `
      <li class="severo-item">
        <span class="severo-item-name">${escapeHtml(item.name)}</span>
        ${showPrice ? `<span class="severo-item-price">${formatPrice(item.price!, item.price_unit)}</span>` : ""}
      </li>
    `;
  };

  // Generate boisson section HTML
  const boissonHtml = boissonItems.length > 0 ? `
    <section class="severo-boisson-section">
      ${boissonItems.map((item) => {
        const showPrice = showPrices && item.price != null;
        return `
          <div class="severo-boisson-item">
            <span class="severo-boisson-name">${escapeHtml(item.name)}</span>
            ${showPrice ? `<span class="severo-boisson-price">${formatPrice(item.price!, item.price_unit)}</span>` : ""}
          </div>
        `;
      }).join("")}
    </section>
  ` : "";

  // Generate categories HTML
  const categoriesHtml = mainCategories
    .map((category) => {
      const categoryItems = itemsByCategory[category.id];
      if (!categoryItems || categoryItems.length === 0) return "";

      const displayTitle = categoryTitles[category.name] || category.name;
      const itemsHtml = categoryItems.map(generateItemHtml).join("");

      return `
        <section class="severo-category">
          <h2 class="severo-category-title">${escapeHtml(displayTitle)}</h2>
          <ul class="severo-items-list">${itemsHtml}</ul>
        </section>
      `;
    })
    .join("");

  // Generate uncategorized items HTML
  const uncategorizedHtml =
    uncategorizedItems.length > 0
      ? `
        <section class="severo-category">
          <h2 class="severo-category-title">Autres</h2>
          <ul class="severo-items-list">
            ${uncategorizedItems.map(generateItemHtml).join("")}
          </ul>
        </section>
      `
      : "";

  // Generate footer HTML
  const footerHtml = `
    <footer class="severo-footer">
      ${info.holidayNotice ? `<p class="severo-footer-holiday">${escapeHtml(info.holidayNotice)}</p>` : ""}
      ${info.meatOrigin ? `<p class="severo-footer-meat">${escapeHtml(info.meatOrigin)}</p>` : ""}
      ${info.paymentNotice ? `<p class="severo-footer-payment">${escapeHtml(info.paymentNotice)}</p>` : ""}
    </footer>
  `;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Menu - ${escapeHtml(restaurantName)}</title>
  <style>
    ${getSeveroStyles()}
  </style>
</head>
<body>
  <div class="severo-menu-container">
    <header class="severo-header">
      <div class="severo-header-top">
        <span class="severo-header-left">Carafe d'eau gratuite</span>
        <span class="severo-header-right">Service compris 15%</span>
      </div>

      <div class="severo-header-info">
        <span class="severo-restaurant-name">${escapeHtml(restaurantName)}</span>
        <span class="severo-opening">est ouvert ${escapeHtml(info.openingDays || "")}</span>
      </div>

      <div class="severo-header-date">
        Aujourd'hui ${formattedDate}
      </div>

      <div class="severo-header-hours">
        Service ${escapeHtml(info.serviceHours || "")}
      </div>
    </header>

    ${boissonHtml}

    <main class="severo-menu-content">
      ${categoriesHtml}
      ${uncategorizedHtml}
    </main>

    ${footerHtml}
  </div>
</body>
</html>`;
}

/**
 * Escape HTML characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * CSS styles pour le PDF - Style Le Severo
 */
function getSeveroStyles(): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: "Times New Roman", Georgia, serif;
      color: #1a1a1a;
      background: #ffffff;
      line-height: 1.4;
      font-size: 14px;
    }

    .severo-menu-container {
      width: 210mm;
      min-height: 297mm;
      padding: 15mm 20mm;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
    }

    /* Header */
    .severo-header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 1px solid #cccccc;
      padding-bottom: 16px;
    }

    .severo-header-top {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #4a4a4a;
      margin-bottom: 12px;
    }

    .severo-header-left,
    .severo-header-right {
      font-style: italic;
    }

    .severo-header-info {
      margin-bottom: 8px;
    }

    .severo-restaurant-name {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .severo-opening {
      font-size: 13px;
      color: #4a4a4a;
      margin-left: 8px;
    }

    .severo-header-date {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .severo-header-hours {
      font-size: 12px;
      color: #4a4a4a;
      letter-spacing: 0.1em;
    }

    /* Boisson section */
    .severo-boisson-section {
      text-align: center;
      margin-bottom: 20px;
      padding: 12px 0;
      border-bottom: 1px solid #cccccc;
    }

    .severo-boisson-item {
      display: flex;
      justify-content: center;
      align-items: baseline;
      gap: 24px;
    }

    .severo-boisson-name {
      font-size: 13px;
      font-style: italic;
    }

    .severo-boisson-price {
      font-size: 13px;
      font-weight: 600;
    }

    /* Content */
    .severo-menu-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Categories */
    .severo-category {
      break-inside: avoid;
    }

    .severo-category-title {
      font-size: 16px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin: 0 0 10px 0;
      padding-bottom: 4px;
      border-bottom: 2px solid #2c2c2c;
      color: #1a1a1a;
    }

    /* Items */
    .severo-items-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .severo-item {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 12px;
      padding: 2px 0;
      break-inside: avoid;
    }

    .severo-item-name {
      font-size: 14px;
      color: #1a1a1a;
      flex: 1;
    }

    .severo-item-price {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a1a;
      white-space: nowrap;
      min-width: 60px;
      text-align: right;
    }

    /* Footer */
    .severo-footer {
      margin-top: auto;
      padding-top: 20px;
      border-top: 1px solid #cccccc;
      font-size: 10px;
      color: #6a6a6a;
      line-height: 1.5;
    }

    .severo-footer p {
      margin: 0 0 8px 0;
    }

    .severo-footer p:last-child {
      margin-bottom: 0;
    }

    .severo-footer-holiday {
      font-weight: 600;
      font-style: italic;
      text-align: center;
      font-size: 11px;
      color: #4a4a4a;
    }

    .severo-footer-meat {
      font-style: italic;
    }

    .severo-footer-payment {
      font-size: 9px;
    }

    @page {
      size: A4;
      margin: 0;
    }
  `;
}

/**
 * Génère le PDF du menu
 */
export async function generateMenuPdf(
  data: MenuTemplateData
): Promise<Buffer> {
  const chromium = await getChromium();
  const puppeteer = await getPuppeteer();

  // Configuration pour Vercel (production) vs local (development)
  const isProduction = process.env.NODE_ENV === "production";

  let executablePath: string;

  if (isProduction) {
    executablePath = await chromium.default.executablePath();
  } else {
    // En développement, utiliser le Chrome local
    // macOS
    const macPath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    // Linux
    const linuxPath = "/usr/bin/google-chrome";
    // Windows
    const winPath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

    const fs = await import("fs");
    if (fs.existsSync(macPath)) {
      executablePath = macPath;
    } else if (fs.existsSync(linuxPath)) {
      executablePath = linuxPath;
    } else if (fs.existsSync(winPath)) {
      executablePath = winPath;
    } else {
      throw new Error(
        "Chrome non trouvé. Installez Chrome ou définissez CHROME_PATH."
      );
    }
  }

  const browser = await puppeteer.default.launch({
    args: isProduction ? chromium.default.args : ["--no-sandbox"],
    defaultViewport: { width: 1200, height: 800 },
    executablePath,
    headless: true,
  });

  try {
    const page = await browser.newPage();

    // Generate HTML
    const html = generateMenuHtml(data);

    // Set content
    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
