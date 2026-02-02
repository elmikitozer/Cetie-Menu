-- Carte du Jour - Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLES
-- ============================================

-- Restaurants table
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users profile table (extends auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'staff', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily menus table
CREATE TABLE daily_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, date)
);

-- Daily menu items (junction table)
CREATE TABLE daily_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_menu_id UUID NOT NULL REFERENCES daily_menus(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  custom_price DECIMAL(10,2),
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(daily_menu_id, product_id)
);

-- Invites table (invitation-only signup)
CREATE TABLE invites (
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

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_users_restaurant ON users(restaurant_id);
CREATE INDEX idx_categories_restaurant ON categories(restaurant_id);
CREATE INDEX idx_products_restaurant ON products(restaurant_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_daily_menus_restaurant_date ON daily_menus(restaurant_id, date);
CREATE INDEX idx_daily_menu_items_menu ON daily_menu_items(daily_menu_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's restaurant_id
CREATE OR REPLACE FUNCTION get_user_restaurant_id()
RETURNS UUID AS $$
  SELECT restaurant_id FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper functions for role checks
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- RESTAURANTS policies
CREATE POLICY "Users can view restaurants"
  ON restaurants FOR SELECT
  USING (
    id = get_user_restaurant_id()
    OR is_admin()
  );

CREATE POLICY "Users can update their own restaurant"
  ON restaurants FOR UPDATE
  USING (
    (id = get_user_restaurant_id() AND is_owner())
    OR is_admin()
  );

CREATE POLICY "Anyone can view restaurants by slug (public menus)"
  ON restaurants FOR SELECT
  USING (TRUE);

-- USERS policies
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

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

CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

-- INVITES policies
CREATE POLICY "Admins or owners can view invites"
  ON invites FOR SELECT
  USING (
    is_admin()
    OR (restaurant_id = get_user_restaurant_id() AND is_owner())
  );

CREATE POLICY "Admins or owners can create invites"
  ON invites FOR INSERT
  WITH CHECK (
    is_admin()
    OR (restaurant_id = get_user_restaurant_id() AND is_owner())
  );

CREATE POLICY "Admins or owners can update invites"
  ON invites FOR UPDATE
  USING (
    is_admin()
    OR (restaurant_id = get_user_restaurant_id() AND is_owner())
  );

-- CATEGORIES policies
CREATE POLICY "Users can view their restaurant categories"
  ON categories FOR SELECT
  USING (
    restaurant_id = get_user_restaurant_id()
    OR is_admin()
  );

CREATE POLICY "Users can insert categories for their restaurant"
  ON categories FOR INSERT
  WITH CHECK (
    (restaurant_id = get_user_restaurant_id() AND is_owner())
    OR is_admin()
  );

CREATE POLICY "Users can update their restaurant categories"
  ON categories FOR UPDATE
  USING (
    (restaurant_id = get_user_restaurant_id() AND is_owner())
    OR is_admin()
  );

CREATE POLICY "Users can delete their restaurant categories"
  ON categories FOR DELETE
  USING (
    (restaurant_id = get_user_restaurant_id() AND is_owner())
    OR is_admin()
  );

-- PRODUCTS policies
CREATE POLICY "Users can view their restaurant products"
  ON products FOR SELECT
  USING (
    restaurant_id = get_user_restaurant_id()
    OR is_admin()
  );

CREATE POLICY "Users can insert products for their restaurant"
  ON products FOR INSERT
  WITH CHECK (
    (restaurant_id = get_user_restaurant_id() AND is_owner())
    OR is_admin()
  );

CREATE POLICY "Users can update their restaurant products"
  ON products FOR UPDATE
  USING (
    (restaurant_id = get_user_restaurant_id() AND is_owner())
    OR is_admin()
  );

CREATE POLICY "Users can delete their restaurant products"
  ON products FOR DELETE
  USING (
    (restaurant_id = get_user_restaurant_id() AND is_owner())
    OR is_admin()
  );

-- Public can view products for published menus (via daily_menu_items join)
CREATE POLICY "Public can view products in published menus"
  ON products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM daily_menu_items dmi
      JOIN daily_menus dm ON dm.id = dmi.daily_menu_id
      WHERE dmi.product_id = products.id
      AND dm.is_published = TRUE
    )
  );

-- DAILY_MENUS policies
CREATE POLICY "Users can view their restaurant menus"
  ON daily_menus FOR SELECT
  USING (
    restaurant_id = get_user_restaurant_id()
    OR is_admin()
  );

CREATE POLICY "Users can insert menus for their restaurant"
  ON daily_menus FOR INSERT
  WITH CHECK (
    (restaurant_id = get_user_restaurant_id() AND (is_owner() OR is_staff()))
    OR is_admin()
  );

CREATE POLICY "Users can update their restaurant menus"
  ON daily_menus FOR UPDATE
  USING (
    (restaurant_id = get_user_restaurant_id() AND (is_owner() OR is_staff()))
    OR is_admin()
  );

CREATE POLICY "Users can delete their restaurant menus"
  ON daily_menus FOR DELETE
  USING (
    (restaurant_id = get_user_restaurant_id() AND (is_owner() OR is_staff()))
    OR is_admin()
  );

CREATE POLICY "Public can view published menus"
  ON daily_menus FOR SELECT
  USING (is_published = TRUE);

-- DAILY_MENU_ITEMS policies
CREATE POLICY "Users can view their restaurant menu items"
  ON daily_menu_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM daily_menus dm
      WHERE dm.id = daily_menu_items.daily_menu_id
      AND (dm.restaurant_id = get_user_restaurant_id() OR is_admin())
    )
  );

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

CREATE POLICY "Users can update their restaurant menu items"
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

CREATE POLICY "Users can delete their restaurant menu items"
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

CREATE POLICY "Public can view items from published menus"
  ON daily_menu_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM daily_menus dm
      WHERE dm.id = daily_menu_items.daily_menu_id
      AND dm.is_published = TRUE
    )
  );

-- ============================================
-- TRIGGER: Create user profile on signup (invitation-only)
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  invite_token TEXT;
  invite_record RECORD;
  desired_role TEXT;
BEGIN
  invite_token := COALESCE(NEW.raw_user_meta_data->>'invite_token', '');

  -- Allow super admin creation without invite (set role=admin in metadata)
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

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
