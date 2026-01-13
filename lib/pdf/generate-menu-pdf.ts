/**
 * PDF Generation Service
 *
 * Génère un PDF A4 du menu à partir du template HTML.
 * Compatible avec Vercel (utilise @sparticuz/chromium en production).
 */

import type { MenuTemplateData, PriceUnit } from "@/components/menu/MenuPrintTemplate";

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
 * Génère le HTML complet pour le PDF
 */
function generateMenuHtml(data: MenuTemplateData): string {
  const { restaurantName, date, items, categories, showPrices = true } = data;

  // Format date
  const dateObj = new Date(date + "T12:00:00");
  const formattedDate = dateObj.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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

  // Format price helper
  const formatPrice = (price: number, priceUnit: PriceUnit = "FIXED") => {
    const formatted = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price);
    return priceUnit === "PER_PERSON" ? `${formatted} / pers.` : formatted;
  };

  // Generate item HTML
  const generateItemHtml = (item: typeof items[0]) => {
    const headerClass = showPrices ? "menu-item-header" : "menu-item-header menu-item-header-no-price";
    const showPrice = showPrices && item.price != null;

    return `
      <li class="menu-item">
        <div class="${headerClass}">
          <span class="menu-item-name">${escapeHtml(item.name)}</span>
          ${showPrice ? `<span class="menu-item-price">${formatPrice(item.price!, item.price_unit)}</span>` : ""}
        </div>
        ${item.description ? `<p class="menu-item-description">${escapeHtml(item.description)}</p>` : ""}
      </li>
    `;
  };

  // Generate categories HTML
  const categoriesHtml = sortedCategories
    .map((category) => {
      const categoryItems = itemsByCategory[category.id];
      if (!categoryItems || categoryItems.length === 0) return "";

      const itemsHtml = categoryItems.map(generateItemHtml).join("");

      return `
        <section class="menu-category">
          <h2 class="menu-category-title">${escapeHtml(category.name)}</h2>
          <ul class="menu-items">${itemsHtml}</ul>
        </section>
      `;
    })
    .join("");

  // Generate uncategorized items HTML
  const uncategorizedHtml =
    uncategorizedItems.length > 0
      ? `
        <section class="menu-category">
          <h2 class="menu-category-title">Autres</h2>
          <ul class="menu-items">
            ${uncategorizedItems.map(generateItemHtml).join("")}
          </ul>
        </section>
      `
      : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Menu - ${escapeHtml(restaurantName)}</title>
  <style>
    ${getMenuStyles(showPrices)}
  </style>
</head>
<body>
  <div class="menu-container">
    <header class="menu-header">
      <h1 class="menu-restaurant-name">${escapeHtml(restaurantName)}</h1>
      <div class="menu-title">Menu du jour</div>
      <div class="menu-date">${formattedDate}</div>
    </header>

    <div class="menu-divider">
      <span class="menu-divider-ornament">✦</span>
    </div>

    <main class="menu-content">
      ${categoriesHtml}
      ${uncategorizedHtml}
    </main>

    <footer class="menu-footer">
      <p class="menu-footer-text">Bon appétit !</p>
    </footer>
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
 * CSS styles pour le PDF (embedded pour autonomie)
 *
 * DIRECTION ARTISTIQUE :
 * Modifier ces styles pour changer l'apparence du PDF
 */
function getMenuStyles(showPrices: boolean): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Georgia, "Times New Roman", serif;
      color: #1a1a1a;
      background: #ffffff;
      line-height: 1.5;
    }

    .menu-container {
      width: 210mm;
      min-height: 297mm;
      padding: 20mm 25mm;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
    }

    /* Header */
    .menu-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .menu-restaurant-name {
      font-size: 36px;
      font-weight: 700;
      margin: 0 0 8px 0;
      letter-spacing: 0.02em;
      color: #1a1a1a;
    }

    .menu-title {
      font-size: 18px;
      font-weight: 400;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #2563eb;
      margin-bottom: 8px;
    }

    .menu-date {
      font-size: 14px;
      color: #666666;
      font-style: italic;
    }

    /* Divider */
    .menu-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 24px 0;
    }

    .menu-divider::before,
    .menu-divider::after {
      content: "";
      flex: 1;
      height: 1px;
      background: linear-gradient(to right, transparent, #e5e5e5, transparent);
      max-width: 120px;
    }

    .menu-divider-ornament {
      padding: 0 16px;
      color: #c9a227;
      font-size: 18px;
    }

    /* Content */
    .menu-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    /* Categories */
    .menu-category {
      break-inside: avoid;
    }

    .menu-category-title {
      font-size: 22px;
      font-weight: 600;
      margin: 0 0 14px 0;
      padding-bottom: 6px;
      border-bottom: 2px solid #2563eb;
      color: #1a1a1a;
      text-transform: capitalize;
    }

    /* Items */
    .menu-items {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .menu-item {
      break-inside: avoid;
    }

    .menu-item-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 12px;
    }

    .menu-item-name {
      font-size: 16px;
      font-weight: 500;
      color: #1a1a1a;
    }

    /* Ligne pointillée entre le nom et le prix (seulement si prix affichés) */
    ${showPrices ? `
    .menu-item-header::after {
      content: "";
      flex: 1;
      border-bottom: 1px dotted #e5e5e5;
      margin: 0 8px;
      min-width: 20px;
    }
    ` : `
    .menu-item-header-no-price {
      justify-content: flex-start;
    }
    `}

    .menu-item-price {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a1a;
      white-space: nowrap;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .menu-item-description {
      font-size: 13px;
      color: #666666;
      margin: 4px 0 0 0;
      font-style: italic;
      line-height: 1.4;
    }

    /* Footer */
    .menu-footer {
      margin-top: auto;
      padding-top: 28px;
      text-align: center;
    }

    .menu-footer-text {
      font-size: 16px;
      font-style: italic;
      color: #666666;
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
