-- Create statement_summary table to store the summary information from statements
CREATE TABLE IF NOT EXISTS statement_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  statement_id UUID NOT NULL REFERENCES statements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_number TEXT,
  period_start DATE,
  period_end DATE,
  opening_balance DECIMAL,
  total_paid_in DECIMAL,
  total_paid_out DECIMAL,
  closing_balance DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add balance column to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS balance DECIMAL;

-- Add RLS (Row Level Security) policies
ALTER TABLE statement_summary ENABLE ROW LEVEL SECURITY;

-- Create policies for statement_summary table
CREATE POLICY "Users can view their own statement summaries" 
ON statement_summary FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own statement summaries" 
ON statement_summary FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own statement summaries" 
ON statement_summary FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own statement summaries" 
ON statement_summary FOR DELETE 
USING (auth.uid() = user_id); 