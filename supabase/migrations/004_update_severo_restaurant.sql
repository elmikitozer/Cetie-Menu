-- Migration: Update existing restaurant to Le Severo with logo
-- This updates the first/only restaurant to have the correct name and logo

UPDATE restaurants
SET
  name = 'Le Severo',
  logo_url = '/logo-severo.png'
WHERE id = (SELECT id FROM restaurants LIMIT 1);
