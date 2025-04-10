-- Add currency column to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS currency TEXT; 