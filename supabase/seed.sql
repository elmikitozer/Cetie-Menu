-- Carte du Jour - Seed Data
-- Run this AFTER schema.sql and AFTER creating your first user account
-- This will insert products for the first restaurant in the database

-- ============================================
-- INSERT PRODUCTS
-- ============================================

DO $$
DECLARE
  v_restaurant_id UUID;
  v_cat_entree UUID;
  v_cat_plat UUID;
  v_cat_fromage UUID;
  v_cat_dessert UUID;
BEGIN
  -- Get the first restaurant (created via signup trigger)
  SELECT id INTO v_restaurant_id FROM restaurants LIMIT 1;

  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'No restaurant found. Please create an account first.';
  END IF;

  -- Get category IDs
  SELECT id INTO v_cat_entree FROM categories
    WHERE restaurant_id = v_restaurant_id AND name = 'Entrée';
  SELECT id INTO v_cat_plat FROM categories
    WHERE restaurant_id = v_restaurant_id AND name = 'Plat';
  SELECT id INTO v_cat_fromage FROM categories
    WHERE restaurant_id = v_restaurant_id AND name = 'Fromage';
  SELECT id INTO v_cat_dessert FROM categories
    WHERE restaurant_id = v_restaurant_id AND name = 'Dessert';

  -- ============================================
  -- ENTRÉES (5 items)
  -- ============================================
  INSERT INTO products (restaurant_id, category_id, name, is_active) VALUES
    (v_restaurant_id, v_cat_entree, 'Boudin noir de Christian PARRA, salade verte', TRUE),
    (v_restaurant_id, v_cat_entree, 'Jambon ibérique', TRUE),
    (v_restaurant_id, v_cat_entree, 'Rosette de Vic', TRUE),
    (v_restaurant_id, v_cat_entree, 'Pied de porc désossé, salade', TRUE),
    (v_restaurant_id, v_cat_entree, 'Poêlée de girolles', TRUE);

  -- ============================================
  -- PLATS (9 items)
  -- ============================================
  INSERT INTO products (restaurant_id, category_id, name, is_active) VALUES
    (v_restaurant_id, v_cat_plat, 'Steak tartare (250 g), frites ou haricots verts', TRUE),
    (v_restaurant_id, v_cat_plat, 'Steak haché (200 g), frites ou haricots verts', TRUE),
    (v_restaurant_id, v_cat_plat, 'Faux filet, frites ou haricots verts', TRUE),
    (v_restaurant_id, v_cat_plat, 'Pavé de rumsteak sauce au poivre, frites', TRUE),
    (v_restaurant_id, v_cat_plat, 'Tataki de bœuf aux anchois et parmesan, frites', TRUE),
    (v_restaurant_id, v_cat_plat, 'Côte de bœuf (Simmental) 2–3 pers., frites', TRUE),
    (v_restaurant_id, v_cat_plat, 'Côte de bœuf (Simmental) 2 pers., frites', TRUE),
    (v_restaurant_id, v_cat_plat, 'Pavé de veau « Sous Noix », purée', TRUE),
    (v_restaurant_id, v_cat_plat, 'Côte de veau, purée et girolles', TRUE);

  -- ============================================
  -- FROMAGES (2 items)
  -- ============================================
  INSERT INTO products (restaurant_id, category_id, name, is_active) VALUES
    (v_restaurant_id, v_cat_fromage, 'Saint-Nectaire', TRUE),
    (v_restaurant_id, v_cat_fromage, 'Parmesan', TRUE);

  -- ============================================
  -- DESSERTS (2 items)
  -- ============================================
  INSERT INTO products (restaurant_id, category_id, name, is_active) VALUES
    (v_restaurant_id, v_cat_dessert, 'Mousse au chocolat', TRUE),
    (v_restaurant_id, v_cat_dessert, 'Crème caramel', TRUE);

  RAISE NOTICE 'Seed completed: 18 products inserted for restaurant %', v_restaurant_id;
END $$;
