/*
  # System Ankiet - Schemat Bazy Danych

  1. Nowe Tabele
    - `surveys` - główna tabela ankiet
      - `id` (uuid, klucz główny)
      - `title` (text) - tytuł ankiety
      - `description` (text) - opis ankiety
      - `questions` (jsonb) - pytania w formacie JSON
      - `settings` (jsonb) - ustawienia ankiety
      - `mailerlite_token` (text) - token API MailerLite
      - `mailerlite_group_id` (text) - ID grupy MailerLite
      - `is_active` (boolean) - czy ankieta jest aktywna
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `user_id` (uuid) - właściciel ankiety

    - `survey_responses` - odpowiedzi na ankiety
      - `id` (uuid, klucz główny)
      - `survey_id` (uuid) - referencja do ankiety
      - `responses` (jsonb) - odpowiedzi w formacie JSON
      - `email` (text) - email respondenta
      - `mailerlite_synced` (boolean) - czy zsynchronizowano z MailerLite
      - `created_at` (timestamp)

  2. Bezpieczeństwo
    - Włączenie RLS na wszystkich tabelach
    - Polityki dla uwierzytelnionych użytkowników
    - Publiczny dostęp do ankiet i zapisywania odpowiedzi
*/

-- Tabela ankiet
CREATE TABLE IF NOT EXISTS surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  questions jsonb DEFAULT '[]'::jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  mailerlite_token text DEFAULT '',
  mailerlite_group_id text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabela odpowiedzi na ankiety
CREATE TABLE IF NOT EXISTS survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid REFERENCES surveys(id) ON DELETE CASCADE NOT NULL,
  responses jsonb DEFAULT '{}'::jsonb,
  email text DEFAULT '',
  mailerlite_synced boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Włączenie RLS
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Polityki dla tabeli surveys
CREATE POLICY "Użytkownicy mogą przeglądać swoje ankiety"
  ON surveys
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Użytkownicy mogą tworzyć ankiety"
  ON surveys
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Użytkownicy mogą aktualizować swoje ankiety"
  ON surveys
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Użytkownicy mogą usuwać swoje ankiety"
  ON surveys
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Publiczny dostęp do przeglądania aktywnych ankiet
CREATE POLICY "Publiczny dostęp do aktywnych ankiet"
  ON surveys
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Polityki dla tabeli survey_responses
CREATE POLICY "Właściciele ankiet mogą przeglądać odpowiedzi"
  ON survey_responses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM surveys 
      WHERE surveys.id = survey_responses.survey_id 
      AND surveys.user_id = auth.uid()
    )
  );

-- Publiczny dostęp do zapisywania odpowiedzi
CREATE POLICY "Publiczny dostęp do zapisywania odpowiedzi"
  ON survey_responses
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Indeksy dla lepszej wydajności
CREATE INDEX IF NOT EXISTS idx_surveys_user_id ON surveys(user_id);
CREATE INDEX IF NOT EXISTS idx_surveys_is_active ON surveys(is_active);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_created_at ON survey_responses(created_at);

-- Funkcja do automatycznego aktualizowania updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger dla tabeli surveys
DROP TRIGGER IF EXISTS update_surveys_updated_at ON surveys;
CREATE TRIGGER update_surveys_updated_at
  BEFORE UPDATE ON surveys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();