-- Migration: Add PDF design customization fields per restaurant
-- These fields allow each restaurant to customize their menu PDF

ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS opening_days TEXT DEFAULT 'Carafe d''eau gratuite',
ADD COLUMN IF NOT EXISTS opening_days_2 TEXT DEFAULT 'Service compris 15%',
ADD COLUMN IF NOT EXISTS lunch_hours TEXT DEFAULT '12h-14h',
ADD COLUMN IF NOT EXISTS dinner_hours TEXT DEFAULT '19h30-21h30',
ADD COLUMN IF NOT EXISTS holiday_notice TEXT,
ADD COLUMN IF NOT EXISTS meat_origin TEXT DEFAULT 'Le boeuf est d''origine allemande ou française le veau est hollandais.',
ADD COLUMN IF NOT EXISTS payment_notice TEXT DEFAULT 'Devant la recrudescence des chèques impayés, nous vous prions de régler par Carte Bleue, espèces ou tickets restaurant (article 40 décret 92-456 du 22/05/92)',
ADD COLUMN IF NOT EXISTS subtitle TEXT DEFAULT 'RESTAURANT',
ADD COLUMN IF NOT EXISTS restaurant_type TEXT DEFAULT '- BOUCHER -',
ADD COLUMN IF NOT EXISTS cities TEXT DEFAULT 'PARIS • TOKYO',
ADD COLUMN IF NOT EXISTS sides_note TEXT DEFAULT '* Accompagnements au choix';
