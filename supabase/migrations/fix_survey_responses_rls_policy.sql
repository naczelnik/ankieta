/*
  # Naprawa polityki RLS dla tabeli survey_responses

  1. Problem
    - Anonimowi użytkownicy nie mogą zapisywać odpowiedzi na ankiety
    - Polityka RLS blokuje publiczny dostęp do zapisywania

  2. Rozwiązanie
    - Aktualizacja polityki dla publicznego dostępu do zapisywania odpowiedzi
    - Zachowanie bezpieczeństwa - tylko właściciele ankiet mogą czytać odpowiedzi
    - Umożliwienie anonimowym użytkownikom zapisywania odpowiedzi

  3. Bezpieczeństwo
    - Publiczny dostęp tylko do zapisywania (INSERT)
    - Odczyt odpowiedzi tylko dla właścicieli ankiet
    - Brak możliwości modyfikacji lub usuwania przez anonimowych użytkowników
*/

-- Usunięcie istniejącej polityki dla publicznego dostępu
DROP POLICY IF EXISTS "Publiczny dostęp do zapisywania odpowiedzi" ON survey_responses;

-- Utworzenie nowej polityki dla publicznego zapisywania odpowiedzi
CREATE POLICY "Publiczny dostęp do zapisywania odpowiedzi"
  ON survey_responses
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Sprawdzenie czy polityka dla uwierzytelnionych użytkowników istnieje
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'survey_responses' 
    AND policyname = 'Właściciele ankiet mogą przeglądać odpowiedzi'
  ) THEN
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
  END IF;
END $$;

-- Sprawdzenie czy RLS jest włączone
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Dodanie polityki dla uwierzytelnionych użytkowników do aktualizacji (np. synchronizacja z MailerLite)
DROP POLICY IF EXISTS "Właściciele ankiet mogą aktualizować odpowiedzi" ON survey_responses;
CREATE POLICY "Właściciele ankiet mogą aktualizować odpowiedzi"
  ON survey_responses
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM surveys 
      WHERE surveys.id = survey_responses.survey_id 
      AND surveys.user_id = auth.uid()
    )
  );