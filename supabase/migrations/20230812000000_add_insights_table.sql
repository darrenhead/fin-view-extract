-- Create insights table to cache Gemini-generated insights
CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insights_data JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() + INTERVAL '1 day',
  CONSTRAINT insights_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add RLS (Row Level Security) policies
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- Create policies for insights table
CREATE POLICY "Users can view their own insights" 
ON insights FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own insights" 
ON insights FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights" 
ON insights FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insights" 
ON insights FOR DELETE 
USING (auth.uid() = user_id); 