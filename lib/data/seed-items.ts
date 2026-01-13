// Menu items data - source of truth for seeding
// Based on Le Severo menu (reference PDF)

export type PriceUnit = 'FIXED' | 'PER_PERSON';

export const CATEGORIES = [
  { name: 'Boisson', displayOrder: 0 },
  { name: 'Entrée', displayOrder: 1 },
  { name: 'Plat', displayOrder: 2 },
  { name: 'Fromage', displayOrder: 3 },
  { name: 'Dessert', displayOrder: 4 },
] as const;

export type CategoryName = (typeof CATEGORIES)[number]['name'];

export interface SeedItem {
  category: CategoryName;
  name: string;
  price: number; // Price in euros (e.g., 14.00)
  priceUnit?: PriceUnit; // Default: FIXED
}

export const SEED_ITEMS: SeedItem[] = [
  // BOISSONS (1)
  {
    category: 'Boisson',
    name: 'Coupe de champagne A Heucq (12cl)',
    price: 16.0,
  },

  // ENTRÉES (5)
  {
    category: 'Entrée',
    name: 'Boudin noir de Ch Parra, salade verte',
    price: 14.0,
  },
  {
    category: 'Entrée',
    name: 'Rosette de Vic',
    price: 14.0,
  },
  {
    category: 'Entrée',
    name: 'Cecina de bœuf séché',
    price: 20.0,
  },
  {
    category: 'Entrée',
    name: 'Pied de porc désossé, salade verte',
    price: 14.0,
  },
  {
    category: 'Entrée',
    name: 'Poireaux vigne',
    price: 14.0,
  },

  // PLATS (9)
  {
    category: 'Plat',
    name: 'Steak haché (250 grs), frites ou haricots verts',
    price: 19.5,
  },
  {
    category: 'Plat',
    name: 'Steak tartare (250 grs), frites ou haricots verts',
    price: 28.0,
  },
  {
    category: 'Plat',
    name: 'Faux-Filet noire de la Baltique, frites',
    price: 52.0,
  },
  {
    category: 'Plat',
    name: 'Pavé de rumsteak sauce au poivre, frites',
    price: 40.0,
  },
  {
    category: 'Plat',
    name: 'L Bone, frites',
    price: 160.0,
  },
  {
    category: 'Plat',
    name: 'Filet de bœuf sauce au poivre, frites',
    price: 65.0,
  },
  {
    category: 'Plat',
    name: 'Côte de bœuf bio domaine Coiffard 2-3P, frites',
    price: 180.0,
    priceUnit: 'PER_PERSON',
  },
  {
    category: 'Plat',
    name: 'Côte de bœuf bio domaine Coiffard 3+, frites',
    price: 220.0,
    priceUnit: 'PER_PERSON',
  },
  {
    category: 'Plat',
    name: 'Tataki de bœuf anchois et comté, frites',
    price: 32.0,
  },

  // FROMAGES (3)
  {
    category: 'Fromage',
    name: 'Saint Nectaire',
    price: 8.0,
  },
  {
    category: 'Fromage',
    name: 'Comté',
    price: 8.0,
  },
  {
    category: 'Fromage',
    name: 'Brie de Melun',
    price: 8.0,
  },

  // DESSERTS (3)
  {
    category: 'Dessert',
    name: 'Mousse au chocolat',
    price: 9.0,
  },
  {
    category: 'Dessert',
    name: 'Crème au caramel',
    price: 9.0,
  },
  {
    category: 'Dessert',
    name: 'Tarte aux poires',
    price: 9.0,
  },
];

// Summary: 21 items total (1 boisson, 5 entrées, 9 plats, 3 fromages, 3 desserts)

// Helper function to find or match an item by name (fuzzy match)
export function findItemByName(name: string): SeedItem | undefined {
  const normalizedName = name.toLowerCase().trim();
  return SEED_ITEMS.find((item) => {
    const itemName = item.name.toLowerCase().trim();
    // Exact match or close match (handles minor variations)
    return (
      itemName === normalizedName ||
      itemName.includes(normalizedName) ||
      normalizedName.includes(itemName)
    );
  });
}
