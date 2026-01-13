-- Migration: Add price management fields
-- Date: 2026-01-13
-- Description: Adds price_unit to products and show_prices to daily_menus

-- ============================================
-- 1. Create price_unit enum type
-- ============================================
DO $$ BEGIN
  CREATE TYPE price_unit_type AS ENUM ('FIXED', 'PER_PERSON');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. Add price_unit column to products
-- ============================================
ALTER TABLE products
ADD COLUMN IF NOT EXISTS price_unit price_unit_type NOT NULL DEFAULT 'FIXED';

-- ============================================
-- 3. Add show_prices column to daily_menus
-- ============================================
ALTER TABLE daily_menus
ADD COLUMN IF NOT EXISTS show_prices BOOLEAN NOT NULL DEFAULT TRUE;

-- ============================================
-- 4. Convert existing price to price_cents (optional migration)
-- Note: We keep 'price' as DECIMAL for now for backward compatibility
-- If you want to migrate to cents, uncomment below:
-- ============================================
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS price_cents INTEGER;
-- UPDATE products SET price_cents = (price * 100)::INTEGER WHERE price IS NOT NULL;

-- ============================================
-- COMMENTS for documentation
-- ============================================
COMMENT ON COLUMN products.price_unit IS 'Price type: FIXED for standard price, PER_PERSON for per-person pricing';
COMMENT ON COLUMN daily_menus.show_prices IS 'Whether to display prices on the public menu';
