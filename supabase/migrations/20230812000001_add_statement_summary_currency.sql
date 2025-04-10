-- Add currency column to statement_summary table if it doesn't exist
ALTER TABLE IF EXISTS statement_summary 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD'; 