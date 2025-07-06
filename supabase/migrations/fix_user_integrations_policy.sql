/*
  # Naprawa polityki dla tabeli user_integrations

  1. Sprawdzenie i utworzenie polityki
    - Sprawdzenie czy polityka już istnieje
    - Utworzenie polityki tylko jeśli nie istnieje
    - Bezpieczne dodanie wszystkich brakujących elementów

  2. Weryfikacja struktury tabeli
    - Sprawdzenie czy tabela istnieje
    - Dodanie brakujących kolumn jeśli potrzeba
    - Weryfikacja indeksów i triggerów
*/

-- Sprawdzenie czy tabela user_integrations istnieje, jeśli nie - utworzenie
CREATE TABLE IF NOT EXISTS user_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mailerlite_token text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Włączenie RLS jeśli nie jest włączone
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Sprawdzenie czy polityka istnieje i utworzenie tylko jeśli nie istnieje
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_integrations' 
    AND policyname = 'Użytkownicy mogą zarządzać swoimi integracjami'
  ) THEN
    CREATE POLICY "Użytkownicy mogą zarządzać swoimi integracjami"
      ON user_integrations
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

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

-- Indeksy dla lepszej wydajności (jeśli nie istnieją)
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON user_integrations(user_id);

-- Sprawdzenie czy trigger istnieje przed utworzeniem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_user_integrations_updated_at'
  ) THEN
    CREATE TRIGGER update_user_integrations_updated_at
      BEFORE UPDATE ON user_integrations
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;