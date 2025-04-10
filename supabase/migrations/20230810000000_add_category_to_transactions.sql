-- Add category column to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category TEXT; 