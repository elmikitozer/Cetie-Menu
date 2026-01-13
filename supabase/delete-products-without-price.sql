-- ============================================
-- Script: Supprimer les produits sans prix
-- Exécuter dans Supabase Dashboard > SQL Editor
-- ============================================

-- 1. D'abord, voir quels produits seront supprimés
SELECT
  p.id,
  p.name as produit,
  c.name as categorie,
  p.price
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.price IS NULL;

-- 2. Supprimer les produits sans prix
DELETE FROM products
WHERE price IS NULL;

-- 3. Confirmation : afficher le nombre de produits restants
SELECT COUNT(*) as produits_restants FROM products;

