-- Carte du Jour - Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Restaurants table
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, date)
);

-- Daily menu items (junction table)
CREATE TABLE daily_menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  daily_menu_id UUID NOT NULL REFERENCES daily_menus(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  custom_price DECIMAL(10,2),
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(daily_menu_id, product_id)
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

-- Helper function to get current user's restaurant_id
CREATE OR REPLACE FUNCTION get_user_restaurant_id()
RETURNS UUID AS $$
  SELECT restaurant_id FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- RESTAURANTS policies
CREATE POLICY "Users can view their own restaurant"
  ON restaurants FOR SELECT
  USING (id = get_user_restaurant_id());

CREATE POLICY "Users can update their own restaurant"
  ON restaurants FOR UPDATE
  USING (id = get_user_restaurant_id());

CREATE POLICY "Anyone can view restaurants by slug (public menus)"
  ON restaurants FOR SELECT
  USING (TRUE);

-- USERS policies
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

-- CATEGORIES policies
CREATE POLICY "Users can view their restaurant categories"
  ON categories FOR SELECT
  USING (restaurant_id = get_user_restaurant_id());

CREATE POLICY "Users can insert categories for their restaurant"
  ON categories FOR INSERT
  WITH CHECK (restaurant_id = get_user_restaurant_id());

CREATE POLICY "Users can update their restaurant categories"
  ON categories FOR UPDATE
  USING (restaurant_id = get_user_restaurant_id());

CREATE POLICY "Users can delete their restaurant categories"
  ON categories FOR DELETE
  USING (restaurant_id = get_user_restaurant_id());

-- PRODUCTS policies
CREATE POLICY "Users can view their restaurant products"
  ON products FOR SELECT
  USING (restaurant_id = get_user_restaurant_id());

CREATE POLICY "Users can insert products for their restaurant"
  ON products FOR INSERT
  WITH CHECK (restaurant_id = get_user_restaurant_id());

CREATE POLICY "Users can update their restaurant products"
  ON products FOR UPDATE
  USING (restaurant_id = get_user_restaurant_id());

CREATE POLICY "Users can delete their restaurant products"
  ON products FOR DELETE
  USING (restaurant_id = get_user_restaurant_id());

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
  USING (restaurant_id = get_user_restaurant_id());

CREATE POLICY "Users can insert menus for their restaurant"
  ON daily_menus FOR INSERT
  WITH CHECK (restaurant_id = get_user_restaurant_id());

CREATE POLICY "Users can update their restaurant menus"
  ON daily_menus FOR UPDATE
  USING (restaurant_id = get_user_restaurant_id());

CREATE POLICY "Users can delete their restaurant menus"
  ON daily_menus FOR DELETE
  USING (restaurant_id = get_user_restaurant_id());

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
      AND dm.restaurant_id = get_user_restaurant_id()
    )
  );

CREATE POLICY "Users can insert menu items for their restaurant"
  ON daily_menu_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_menus dm
      WHERE dm.id = daily_menu_items.daily_menu_id
      AND dm.restaurant_id = get_user_restaurant_id()
    )
  );

CREATE POLICY "Users can update their restaurant menu items"
  ON daily_menu_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM daily_menus dm
      WHERE dm.id = daily_menu_items.daily_menu_id
      AND dm.restaurant_id = get_user_restaurant_id()
    )
  );

CREATE POLICY "Users can delete their restaurant menu items"
  ON daily_menu_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM daily_menus dm
      WHERE dm.id = daily_menu_items.daily_menu_id
      AND dm.restaurant_id = get_user_restaurant_id()
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
-- TRIGGER: Auto-create user profile and restaurant on signup
-- ============================================

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

  -- Create default categories
  INSERT INTO categories (restaurant_id, name, display_order) VALUES
    (new_restaurant_id, 'Entrée', 1),
    (new_restaurant_id, 'Plat', 2),
    (new_restaurant_id, 'Fromage', 3),
    (new_restaurant_id, 'Dessert', 4);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
