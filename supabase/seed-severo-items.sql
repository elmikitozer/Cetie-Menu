-- ============================================
-- Script: Seed Severo Menu Items
-- Exécuter dans Supabase Dashboard > SQL Editor
-- ============================================

-- 1. Créer la catégorie Boisson si elle n'existe pas
INSERT INTO categories (restaurant_id, name, display_order)
SELECT r.id, 'Boisson', 0
FROM restaurants r
WHERE NOT EXISTS (
  SELECT 1 FROM categories c
  WHERE c.restaurant_id = r.id AND c.name = 'Boisson'
);

-- 2. Insérer tous les items Severo
-- (Utilise une CTE pour récupérer les category IDs dynamiquement)

DO $$
DECLARE
  v_restaurant_id UUID;
  v_cat_boisson UUID;
  v_cat_entree UUID;
  v_cat_plat UUID;
  v_cat_fromage UUID;
  v_cat_dessert UUID;
BEGIN
  -- Récupérer le premier restaurant (adapter si plusieurs)
  SELECT id INTO v_restaurant_id FROM restaurants LIMIT 1;

  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'Aucun restaurant trouvé';
  END IF;

  -- Récupérer les IDs des catégories
  SELECT id INTO v_cat_boisson FROM categories WHERE restaurant_id = v_restaurant_id AND name = 'Boisson';
  SELECT id INTO v_cat_entree FROM categories WHERE restaurant_id = v_restaurant_id AND name = 'Entrée';
  SELECT id INTO v_cat_plat FROM categories WHERE restaurant_id = v_restaurant_id AND name = 'Plat';
  SELECT id INTO v_cat_fromage FROM categories WHERE restaurant_id = v_restaurant_id AND name = 'Fromage';
  SELECT id INTO v_cat_dessert FROM categories WHERE restaurant_id = v_restaurant_id AND name = 'Dessert';

  -- ========== BOISSON ==========
  INSERT INTO products (restaurant_id, category_id, name, price, price_unit, is_active)
  VALUES (v_restaurant_id, v_cat_boisson, 'Coupe de champagne A Heucq (12cl)', 16.00, 'FIXED', true)
  ON CONFLICT DO NOTHING;

  -- ========== ENTRÉES ==========
  INSERT INTO products (restaurant_id, category_id, name, price, price_unit, is_active)
  VALUES
    (v_restaurant_id, v_cat_entree, 'Boudin noir de Ch Parra, salade verte', 14.00, 'FIXED', true),
    (v_restaurant_id, v_cat_entree, 'Rosette de Vic', 14.00, 'FIXED', true),
    (v_restaurant_id, v_cat_entree, 'Cecina de bœuf séché', 20.00, 'FIXED', true),
    (v_restaurant_id, v_cat_entree, 'Pied de porc désossé, salade verte', 14.00, 'FIXED', true),
    (v_restaurant_id, v_cat_entree, 'Poireaux vigne', 14.00, 'FIXED', true)
  ON CONFLICT DO NOTHING;

  -- ========== PLATS ==========
  INSERT INTO products (restaurant_id, category_id, name, price, price_unit, is_active)
  VALUES
    (v_restaurant_id, v_cat_plat, 'Steak haché (250 grs), frites ou haricots verts', 19.50, 'FIXED', true),
    (v_restaurant_id, v_cat_plat, 'Steak tartare (250 grs), frites ou haricots verts', 28.00, 'FIXED', true),
    (v_restaurant_id, v_cat_plat, 'Faux-Filet noire de la Baltique, frites', 52.00, 'FIXED', true),
    (v_restaurant_id, v_cat_plat, 'Pavé de rumsteak sauce au poivre, frites', 40.00, 'FIXED', true),
    (v_restaurant_id, v_cat_plat, 'L Bone, frites', 160.00, 'FIXED', true),
    (v_restaurant_id, v_cat_plat, 'Filet de bœuf sauce au poivre, frites', 65.00, 'FIXED', true),
    (v_restaurant_id, v_cat_plat, 'Côte de bœuf bio domaine Coiffard 2-3P, frites', 180.00, 'PER_PERSON', true),
    (v_restaurant_id, v_cat_plat, 'Côte de bœuf bio domaine Coiffard 3+, frites', 220.00, 'PER_PERSON', true),
    (v_restaurant_id, v_cat_plat, 'Tataki de bœuf anchois et comté, frites', 32.00, 'FIXED', true)
  ON CONFLICT DO NOTHING;

  -- ========== FROMAGES ==========
  INSERT INTO products (restaurant_id, category_id, name, price, price_unit, is_active)
  VALUES
    (v_restaurant_id, v_cat_fromage, 'Saint Nectaire', 8.00, 'FIXED', true),
    (v_restaurant_id, v_cat_fromage, 'Comté', 8.00, 'FIXED', true),
    (v_restaurant_id, v_cat_fromage, 'Brie de Melun', 8.00, 'FIXED', true)
  ON CONFLICT DO NOTHING;

  -- ========== DESSERTS ==========
  INSERT INTO products (restaurant_id, category_id, name, price, price_unit, is_active)
  VALUES
    (v_restaurant_id, v_cat_dessert, 'Mousse au chocolat', 9.00, 'FIXED', true),
    (v_restaurant_id, v_cat_dessert, 'Crème au caramel', 9.00, 'FIXED', true),
    (v_restaurant_id, v_cat_dessert, 'Tarte aux poires', 9.00, 'FIXED', true)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Items Severo insérés avec succès pour le restaurant %', v_restaurant_id;
END $$;

-- 3. Vérification : afficher les produits créés
SELECT
  c.name as categorie,
  p.name as produit,
  p.price as prix,
  p.price_unit as type_prix
FROM products p
JOIN categories c ON p.category_id = c.id
ORDER BY c.display_order, p.name;

