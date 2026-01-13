-- Migration: Add Boisson category and update display orders
-- Date: 2026-01-13
-- Description: Adds "Boisson" category for champagne/drinks, reorders categories

-- ============================================
-- 1. Update default categories creation in trigger
-- ============================================
-- Note: This will only affect NEW users signing up.
-- For existing users, run the manual update below.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_restaurant_id UUID;
  restaurant_name TEXT;
  restaurant_slug TEXT;
BEGIN
  -- Get restaurant name from user metadata, default to email prefix
  restaurant_name := COALESCE(
    NEW.raw_user_meta_data->>'restaurant_name',
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- Generate slug from restaurant name
  restaurant_slug := LOWER(REGEXP_REPLACE(restaurant_name, '[^a-zA-Z0-9]', '-', 'g'));
  restaurant_slug := REGEXP_REPLACE(restaurant_slug, '-+', '-', 'g');
  restaurant_slug := TRIM(BOTH '-' FROM restaurant_slug);

  -- Make slug unique by appending random string if needed
  restaurant_slug := restaurant_slug || '-' || SUBSTR(MD5(RANDOM()::TEXT), 1, 6);

  -- Create restaurant
  INSERT INTO restaurants (name, slug)
  VALUES (restaurant_name, restaurant_slug)
  RETURNING id INTO new_restaurant_id;

  -- Create user profile
  INSERT INTO users (id, email, full_name, restaurant_id, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    new_restaurant_id,
    'owner'
  );

  -- Create default categories (including Boisson)
  INSERT INTO categories (restaurant_id, name, display_order) VALUES
    (new_restaurant_id, 'Boisson', 0),
    (new_restaurant_id, 'Entrée', 1),
    (new_restaurant_id, 'Plat', 2),
    (new_restaurant_id, 'Fromage', 3),
    (new_restaurant_id, 'Dessert', 4);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. Add Boisson category to existing restaurants (if not exists)
-- ============================================
INSERT INTO categories (restaurant_id, name, display_order)
SELECT r.id, 'Boisson', 0
FROM restaurants r
WHERE NOT EXISTS (
  SELECT 1 FROM categories c
  WHERE c.restaurant_id = r.id AND c.name = 'Boisson'
);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION handle_new_user() IS 'Creates restaurant, user profile, and default categories (Boisson, Entrée, Plat, Fromage, Dessert) on signup';

