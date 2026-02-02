-- Migration: Invitation-only signup + roles per restaurant
-- Date: 2026-02-02
-- Description: Adds invites table, removes auto-restaurant creation on signup,
--              and tightens RLS to separate restaurant admins vs staff.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. Helper functions for role checks
-- ============================================
CREATE OR REPLACE FUNCTION is_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'staff'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. Invites table (invitation-only signup)
-- ============================================
CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('owner', 'staff')),
  email TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  used_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ
);

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins or owners can view invites" ON invites;
CREATE POLICY "Admins or owners can view invites"
  ON invites FOR SELECT
  USING (
    is_admin()
    OR (restaurant_id = get_user_restaurant_id() AND is_owner())
  );

DROP POLICY IF EXISTS "Admins or owners can create invites" ON invites;
CREATE POLICY "Admins or owners can create invites"
  ON invites FOR INSERT
  WITH CHECK (
    is_admin()
    OR (restaurant_id = get_user_restaurant_id() AND is_owner())
  );

DROP POLICY IF EXISTS "Admins or owners can update invites" ON invites;
CREATE POLICY "Admins or owners can update invites"
  ON invites FOR UPDATE
  USING (
    is_admin()
    OR (restaurant_id = get_user_restaurant_id() AND is_owner())
  );

-- ============================================
-- 3. Update RLS policies (owner/admin vs staff)
-- ============================================
-- Users (prevent role/restaurant escalation)
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (
    id = auth.uid()
    OR is_admin()
  )
  WITH CHECK (
    (id = auth.uid()
      AND role = (SELECT role FROM users WHERE id = auth.uid())
      AND restaurant_id = (SELECT restaurant_id FROM users WHERE id = auth.uid()))
    OR is_admin()
  );

-- Restaurants
DROP POLICY IF EXISTS "Users can view restaurants" ON restaurants;
CREATE POLICY "Users can view restaurants"
  ON restaurants FOR SELECT
  USING (
    id = get_user_restaurant_id()
    OR is_admin()
  );

DROP POLICY IF EXISTS "Users can update their own restaurant" ON restaurants;
CREATE POLICY "Users can update their own restaurant"
  ON restaurants FOR UPDATE
  USING (
    (id = get_user_restaurant_id() AND is_owner())
    OR is_admin()
  );

-- Categories
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
    (restaurant_id = get_user_restaurant_id() AND is_owner())
    OR is_admin()
  );

DROP POLICY IF EXISTS "Users can update categories for their restaurant" ON categories;
CREATE POLICY "Users can update categories for their restaurant"
  ON categories FOR UPDATE
  USING (
    (restaurant_id = get_user_restaurant_id() AND is_owner())
    OR is_admin()
  );

DROP POLICY IF EXISTS "Users can delete categories for their restaurant" ON categories;
CREATE POLICY "Users can delete categories for their restaurant"
  ON categories FOR DELETE
  USING (
    (restaurant_id = get_user_restaurant_id() AND is_owner())
    OR is_admin()
  );

-- Products
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
    (restaurant_id = get_user_restaurant_id() AND is_owner())
    OR is_admin()
  );

DROP POLICY IF EXISTS "Users can update products for their restaurant" ON products;
CREATE POLICY "Users can update products for their restaurant"
  ON products FOR UPDATE
  USING (
    (restaurant_id = get_user_restaurant_id() AND is_owner())
    OR is_admin()
  );

DROP POLICY IF EXISTS "Users can delete products for their restaurant" ON products;
CREATE POLICY "Users can delete products for their restaurant"
  ON products FOR DELETE
  USING (
    (restaurant_id = get_user_restaurant_id() AND is_owner())
    OR is_admin()
  );

-- Daily menus
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
    (restaurant_id = get_user_restaurant_id() AND (is_owner() OR is_staff()))
    OR is_admin()
  );

DROP POLICY IF EXISTS "Users can update menus for their restaurant" ON daily_menus;
CREATE POLICY "Users can update menus for their restaurant"
  ON daily_menus FOR UPDATE
  USING (
    (restaurant_id = get_user_restaurant_id() AND (is_owner() OR is_staff()))
    OR is_admin()
  );

DROP POLICY IF EXISTS "Users can delete menus for their restaurant" ON daily_menus;
CREATE POLICY "Users can delete menus for their restaurant"
  ON daily_menus FOR DELETE
  USING (
    (restaurant_id = get_user_restaurant_id() AND (is_owner() OR is_staff()))
    OR is_admin()
  );

-- Daily menu items
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
      AND (
        (dm.restaurant_id = get_user_restaurant_id() AND (is_owner() OR is_staff()))
        OR is_admin()
      )
    )
  );

DROP POLICY IF EXISTS "Users can update menu items for their restaurant" ON daily_menu_items;
CREATE POLICY "Users can update menu items for their restaurant"
  ON daily_menu_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM daily_menus dm
      WHERE dm.id = daily_menu_items.daily_menu_id
      AND (
        (dm.restaurant_id = get_user_restaurant_id() AND (is_owner() OR is_staff()))
        OR is_admin()
      )
    )
  );

DROP POLICY IF EXISTS "Users can delete menu items for their restaurant" ON daily_menu_items;
CREATE POLICY "Users can delete menu items for their restaurant"
  ON daily_menu_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM daily_menus dm
      WHERE dm.id = daily_menu_items.daily_menu_id
      AND (
        (dm.restaurant_id = get_user_restaurant_id() AND (is_owner() OR is_staff()))
        OR is_admin()
      )
    )
  );

-- ============================================
-- 4. Update signup trigger: invitation-only
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  invite_token TEXT;
  invite_record RECORD;
  desired_role TEXT;
BEGIN
  invite_token := COALESCE(NEW.raw_user_meta_data->>'invite_token', '');

  -- Allow super admin creation without invite (set role=admin in user metadata)
  IF NEW.raw_user_meta_data->>'role' = 'admin' THEN
    INSERT INTO users (id, email, full_name, restaurant_id, role)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'full_name',
      NULL,
      'admin'
    );
    RETURN NEW;
  END IF;

  -- Require a valid invite token for standard users
  IF invite_token = '' THEN
    RAISE EXCEPTION 'Invitation requise pour créer un compte.';
  END IF;

  IF invite_token !~* '^[0-9a-f-]{36}$' THEN
    RAISE EXCEPTION 'Invitation invalide.';
  END IF;

  SELECT * INTO invite_record
  FROM invites
  WHERE token = invite_token::uuid
    AND used_at IS NULL
    AND (expires_at IS NULL OR expires_at > NOW())
  LIMIT 1;

  IF invite_record IS NULL THEN
    RAISE EXCEPTION 'Invitation expirée ou déjà utilisée.';
  END IF;

  desired_role := invite_record.role;

  INSERT INTO users (id, email, full_name, restaurant_id, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    invite_record.restaurant_id,
    desired_role
  );

  UPDATE invites
  SET used_at = NOW(),
      used_by = NEW.id
  WHERE id = invite_record.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
