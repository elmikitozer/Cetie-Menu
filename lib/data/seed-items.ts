// Menu items data - source of truth for seeding
// DO NOT add example items - use only real menu data

export const CATEGORIES = [
  { name: "Entrée", displayOrder: 1 },
  { name: "Plat", displayOrder: 2 },
  { name: "Fromage", displayOrder: 3 },
  { name: "Dessert", displayOrder: 4 },
] as const;

export type CategoryName = (typeof CATEGORIES)[number]["name"];

export interface SeedItem {
  category: CategoryName;
  name: string;
}

export const SEED_ITEMS: SeedItem[] = [
  // ENTRÉES (5)
  { category: "Entrée", name: "Boudin noir de Christian PARRA, salade verte" },
  { category: "Entrée", name: "Jambon ibérique" },
  { category: "Entrée", name: "Rosette de Vic" },
  { category: "Entrée", name: "Pied de porc désossé, salade" },
  { category: "Entrée", name: "Poêlée de girolles" },

  // PLATS (9)
  { category: "Plat", name: "Steak tartare (250 g), frites ou haricots verts" },
  { category: "Plat", name: "Steak haché (200 g), frites ou haricots verts" },
  { category: "Plat", name: "Faux filet, frites ou haricots verts" },
  { category: "Plat", name: "Pavé de rumsteak sauce au poivre, frites" },
  { category: "Plat", name: "Tataki de bœuf aux anchois et parmesan, frites" },
  { category: "Plat", name: "Côte de bœuf (Simmental) 2–3 pers., frites" },
  { category: "Plat", name: "Côte de bœuf (Simmental) 2 pers., frites" },
  { category: "Plat", name: "Pavé de veau « Sous Noix », purée" },
  { category: "Plat", name: "Côte de veau, purée et girolles" },

  // FROMAGES (2)
  { category: "Fromage", name: "Saint-Nectaire" },
  { category: "Fromage", name: "Parmesan" },

  // DESSERTS (2)
  { category: "Dessert", name: "Mousse au chocolat" },
  { category: "Dessert", name: "Crème caramel" },
];

// Summary: 18 items total (5 entrées, 9 plats, 2 fromages, 2 desserts)
