/*
  # Add name field to survey responses

  1. Changes
    - Add `name` column to `survey_responses` table for storing respondent names
    - Update existing policies to handle the new field
  
  2. Security
    - Maintain existing RLS policies
    - No changes to security model needed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'survey_responses' AND column_name = 'name'
  ) THEN
    ALTER TABLE survey_responses ADD COLUMN name text;
  END IF;
END $$;