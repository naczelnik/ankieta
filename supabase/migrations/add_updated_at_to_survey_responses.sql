/*
  # Add updated_at column to survey_responses table

  1. Changes
    - Add `updated_at` column to `survey_responses` table with default timestamp
    - Add trigger to automatically update the timestamp on row updates
  
  2. Security
    - Maintain existing RLS policies
    - No changes to security model needed
*/

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'survey_responses' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE survey_responses ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Update existing rows to have updated_at = created_at
UPDATE survey_responses 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Create trigger to automatically update updated_at on row updates
DROP TRIGGER IF EXISTS update_survey_responses_updated_at ON survey_responses;
CREATE TRIGGER update_survey_responses_updated_at
  BEFORE UPDATE ON survey_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();