-- Migration: Allow authenticated users to initialize their own restaurant
-- Run this AFTER schema.sql if you want app-side initialization instead of trigger

-- Allow authenticated users to create a restaurant
CREATE POLICY "Authenticated users can create a restaurant"
  ON restaurants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Modify categories policy to allow insert when user just created their restaurant
-- The existing policy uses get_user_restaurant_id() which may return NULL initially
DROP POLICY IF EXISTS "Users can insert categories for their restaurant" ON categories;
CREATE POLICY "Users can insert categories for their restaurant"
  ON categories FOR INSERT
  WITH CHECK (
    -- Either the restaurant belongs to user (normal case)
    restaurant_id = get_user_restaurant_id()
    OR
    -- Or user just created this restaurant and is setting up profile
    EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = categories.restaurant_id
      AND NOT EXISTS (
        SELECT 1 FROM users u WHERE u.restaurant_id = r.id
      )
    )
  );

-- Same for products
DROP POLICY IF EXISTS "Users can insert products for their restaurant" ON products;
CREATE POLICY "Users can insert products for their restaurant"
  ON products FOR INSERT
  WITH CHECK (
    restaurant_id = get_user_restaurant_id()
    OR
    EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = products.restaurant_id
      AND NOT EXISTS (
        SELECT 1 FROM users u WHERE u.restaurant_id = r.id AND u.id != auth.uid()
      )
    )
  );

-- Allow user to view restaurant they just created (before profile is linked)
DROP POLICY IF EXISTS "Users can view their own restaurant" ON restaurants;
CREATE POLICY "Users can view their own restaurant"
  ON restaurants FOR SELECT
  USING (
    id = get_user_restaurant_id()
    OR
    -- Allow viewing unclaimed restaurants (for setup flow)
    NOT EXISTS (SELECT 1 FROM users u WHERE u.restaurant_id = restaurants.id)
  );
