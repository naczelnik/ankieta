/*
  # Tabela integracji użytkowników

  1. Nowe Tabele
    - `user_integrations` - przechowuje tokeny i konfiguracje integracji
      - `id` (uuid, klucz główny)
      - `user_id` (uuid) - referencja do użytkownika
      - `mailerlite_token` (text) - token API MailerLite
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Bezpieczeństwo
    - Włączenie RLS na tabeli
    - Polityki dla uwierzytelnionych użytkowników
    - Każdy użytkownik może zarządzać tylko swoimi integracjami

  3. Zmiany w istniejących tabelach
    - Usunięcie kolumn mailerlite_token i mailerlite_group_id z tabeli surveys
    - Dodanie kolumny mailerlite_group_id do surveys (ID grupy, nie token)
*/

-- Tabela integracji użytkowników
CREATE TABLE IF NOT EXISTS user_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mailerlite_token text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Włączenie RLS
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Polityki dla tabeli user_integrations
CREATE POLICY "Użytkownicy mogą zarządzać swoimi integracjami"
  ON user_integrations
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Usunięcie starych kolumn z tabeli surveys (jeśli istnieją)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'surveys' AND column_name = 'mailerlite_token'
  ) THEN
    ALTER TABLE surveys DROP COLUMN mailerlite_token;
  END IF;
END $$;

-- Dodanie kolumny mailerlite_group_id do surveys (jeśli nie istnieje)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'surveys' AND column_name = 'mailerlite_group_id'
  ) THEN
    ALTER TABLE surveys ADD COLUMN mailerlite_group_id text DEFAULT '';
  END IF;
END $$;

-- Indeksy dla lepszej wydajności
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON user_integrations(user_id);

-- Trigger dla automatycznego aktualizowania updated_at
CREATE TRIGGER update_user_integrations_updated_at
  BEFORE UPDATE ON user_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();