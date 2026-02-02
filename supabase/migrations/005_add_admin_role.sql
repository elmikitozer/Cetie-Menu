-- Migration: Add admin role with access to all restaurants
-- Admin users can view and manage all restaurants

-- 1. Update role constraint to include 'admin'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('owner', 'staff', 'admin'));

-- 2. Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update RLS policies for restaurants
DROP POLICY IF EXISTS "Users can view their own restaurant" ON restaurants;
DROP POLICY IF EXISTS "Users can view restaurants" ON restaurants;
CREATE POLICY "Users can view restaurants"
  ON restaurants FOR SELECT
  USING (
    id = get_user_restaurant_id()
    OR is_admin()
    OR NOT EXISTS (SELECT 1 FROM users u WHERE u.restaurant_id = restaurants.id)
  );

DROP POLICY IF EXISTS "Users can update their own restaurant" ON restaurants;
CREATE POLICY "Users can update their own restaurant"
  ON restaurants FOR UPDATE
  USING (
    id = get_user_restaurant_id()
    OR is_admin()
  );

-- 4. Update RLS policies for categories
DROP POLICY IF EXISTS "Users can view categories for their restaurant" ON categories;
CREATE POLICY "Users can view categories for their restaurant"
  ON categories FOR SELECT
  USING (
    restaurant_id = get_user_restaurant_id()
    OR is_admin()
  );

DROP POLICY IF EXISTS "Users can insert categories for their restaurant" ON categories;
CREATE POLICY "Users can insert categories for their restaurant"
  ON categories FOR INSERT
  WITH CHECK (
    restaurant_id = get_user_restaurant_id()
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = categories.restaurant_id
      AND NOT EXISTS (
        SELECT 1 FROM users u WHERE u.restaurant_id = r.id
      )
    )
  );

DROP POLICY IF EXISTS "Users can update categories for their restaurant" ON categories;
CREATE POLICY "Users can update categories for their restaurant"
  ON categories FOR UPDATE
  USING (
    restaurant_id = get_user_restaurant_id()
    OR is_admin()
  );

DROP POLICY IF EXISTS "Users can delete categories for their restaurant" ON categories;
CREATE POLICY "Users can delete categories for their restaurant"
  ON categories FOR DELETE
  USING (
    restaurant_id = get_user_restaurant_id()
    OR is_admin()
  );

-- 5. Update RLS policies for products
DROP POLICY IF EXISTS "Users can view products for their restaurant" ON products;
CREATE POLICY "Users can view products for their restaurant"
  ON products FOR SELECT
  USING (
    restaurant_id = get_user_restaurant_id()
    OR is_admin()
  );

DROP POLICY IF EXISTS "Users can insert products for their restaurant" ON products;
CREATE POLICY "Users can insert products for their restaurant"
  ON products FOR INSERT
  WITH CHECK (
    restaurant_id = get_user_restaurant_id()
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = products.restaurant_id
      AND NOT EXISTS (
        SELECT 1 FROM users u WHERE u.restaurant_id = r.id AND u.id != auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can update products for their restaurant" ON products;
CREATE POLICY "Users can update products for their restaurant"
  ON products FOR UPDATE
  USING (
    restaurant_id = get_user_restaurant_id()
    OR is_admin()
  );

DROP POLICY IF EXISTS "Users can delete products for their restaurant" ON products;
CREATE POLICY "Users can delete products for their restaurant"
  ON products FOR DELETE
  USING (
    restaurant_id = get_user_restaurant_id()
    OR is_admin()
  );

-- 6. Update RLS policies for daily_menus
DROP POLICY IF EXISTS "Users can view menus for their restaurant" ON daily_menus;
CREATE POLICY "Users can view menus for their restaurant"
  ON daily_menus FOR SELECT
  USING (
    restaurant_id = get_user_restaurant_id()
    OR is_admin()
  );

DROP POLICY IF EXISTS "Users can insert menus for their restaurant" ON daily_menus;
CREATE POLICY "Users can insert menus for their restaurant"
  ON daily_menus FOR INSERT
  WITH CHECK (
    restaurant_id = get_user_restaurant_id()
    OR is_admin()
  );

DROP POLICY IF EXISTS "Users can update menus for their restaurant" ON daily_menus;
CREATE POLICY "Users can update menus for their restaurant"
  ON daily_menus FOR UPDATE
  USING (
    restaurant_id = get_user_restaurant_id()
    OR is_admin()
  );

DROP POLICY IF EXISTS "Users can delete menus for their restaurant" ON daily_menus;
CREATE POLICY "Users can delete menus for their restaurant"
  ON daily_menus FOR DELETE
  USING (
    restaurant_id = get_user_restaurant_id()
    OR is_admin()
  );

-- 7. Update RLS policies for daily_menu_items
DROP POLICY IF EXISTS "Users can view menu items for their restaurant" ON daily_menu_items;
CREATE POLICY "Users can view menu items for their restaurant"
  ON daily_menu_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM daily_menus dm
      WHERE dm.id = daily_menu_items.daily_menu_id
      AND (dm.restaurant_id = get_user_restaurant_id() OR is_admin())
    )
  );

DROP POLICY IF EXISTS "Users can insert menu items for their restaurant" ON daily_menu_items;
CREATE POLICY "Users can insert menu items for their restaurant"
  ON daily_menu_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_menus dm
      WHERE dm.id = daily_menu_items.daily_menu_id
      AND (dm.restaurant_id = get_user_restaurant_id() OR is_admin())
    )
  );

DROP POLICY IF EXISTS "Users can update menu items for their restaurant" ON daily_menu_items;
CREATE POLICY "Users can update menu items for their restaurant"
  ON daily_menu_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM daily_menus dm
      WHERE dm.id = daily_menu_items.daily_menu_id
      AND (dm.restaurant_id = get_user_restaurant_id() OR is_admin())
    )
  );

DROP POLICY IF EXISTS "Users can delete menu items for their restaurant" ON daily_menu_items;
CREATE POLICY "Users can delete menu items for their restaurant"
  ON daily_menu_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM daily_menus dm
      WHERE dm.id = daily_menu_items.daily_menu_id
      AND (dm.restaurant_id = get_user_restaurant_id() OR is_admin())
    )
  );
