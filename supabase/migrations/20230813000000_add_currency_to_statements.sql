-- Add currency column to statements table
ALTER TABLE statements ADD COLUMN IF NOT EXISTS currency TEXT; 