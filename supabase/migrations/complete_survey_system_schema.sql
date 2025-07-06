/*
  # Kompletny Schemat Systemu Ankiet

  1. Nowe Tabele
    - `user_profiles` - profile użytkowników
    - `survey_templates` - szablony ankiet
    - `survey_analytics` - analityka ankiet
    - `survey_shares` - udostępnienia ankiet
    - `survey_tags` - tagi dla ankiet
    - `email_campaigns` - kampanie emailowe
    - `webhook_logs` - logi webhooków
    - `api_keys` - klucze API użytkowników
    - `subscription_plans` - plany subskrypcji
    - `user_subscriptions` - subskrypcje użytkowników
    - `payment_history` - historia płatności
    - `survey_logic` - logika warunkowa ankiet
    - `response_exports` - eksporty odpowiedzi

  2. Rozszerzenia istniejących tabel
    - Dodanie brakujących pól do `surveys`
    - Dodanie brakujących pól do `survey_responses`
    - Dodanie brakujących pól do `user_integrations`

  3. Bezpieczeństwo
    - RLS dla wszystkich tabel
    - Odpowiednie polityki dostępu
    - Indeksy dla wydajności
*/

-- =============================================
-- ROZSZERZENIE ISTNIEJĄCYCH TABEL
-- =============================================

-- Dodanie pól do tabeli surveys
DO $$
BEGIN
  -- Status ankiety
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'surveys' AND column_name = 'status'
  ) THEN
    ALTER TABLE surveys ADD COLUMN status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived'));
  END IF;

  -- Liczba odpowiedzi
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'surveys' AND column_name = 'response_count'
  ) THEN
    ALTER TABLE surveys ADD COLUMN response_count integer DEFAULT 0;
  END IF;

  -- Limit odpowiedzi
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'surveys' AND column_name = 'response_limit'
  ) THEN
    ALTER TABLE surveys ADD COLUMN response_limit integer;
  END IF;

  -- Data rozpoczęcia
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'surveys' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE surveys ADD COLUMN start_date timestamptz;
  END IF;

  -- Data zakończenia
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'surveys' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE surveys ADD COLUMN end_date timestamptz;
  END IF;

  -- Slug dla publicznych linków
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'surveys' AND column_name = 'slug'
  ) THEN
    ALTER TABLE surveys ADD COLUMN slug text UNIQUE;
  END IF;

  -- Hasło dostępu
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'surveys' AND column_name = 'password'
  ) THEN
    ALTER TABLE surveys ADD COLUMN password text;
  END IF;

  -- Kategoria
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'surveys' AND column_name = 'category'
  ) THEN
    ALTER TABLE surveys ADD COLUMN category text;
  END IF;

  -- Tagi
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'surveys' AND column_name = 'tags'
  ) THEN
    ALTER TABLE surveys ADD COLUMN tags text[] DEFAULT '{}';
  END IF;

  -- Metadane SEO
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'surveys' AND column_name = 'meta_title'
  ) THEN
    ALTER TABLE surveys ADD COLUMN meta_title text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'surveys' AND column_name = 'meta_description'
  ) THEN
    ALTER TABLE surveys ADD COLUMN meta_description text;
  END IF;

  -- Obraz ankiety
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'surveys' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE surveys ADD COLUMN image_url text;
  END IF;

  -- Ustawienia zaawansowane
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'surveys' AND column_name = 'advanced_settings'
  ) THEN
    ALTER TABLE surveys ADD COLUMN advanced_settings jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Dodanie pól do tabeli survey_responses
DO $$
BEGIN
  -- IP adres respondenta
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'survey_responses' AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE survey_responses ADD COLUMN ip_address inet;
  END IF;

  -- User Agent
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'survey_responses' AND column_name = 'user_agent'
  ) THEN
    ALTER TABLE survey_responses ADD COLUMN user_agent text;
  END IF;

  -- Czas rozpoczęcia
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'survey_responses' AND column_name = 'started_at'
  ) THEN
    ALTER TABLE survey_responses ADD COLUMN started_at timestamptz;
  END IF;

  -- Czas ukończenia
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'survey_responses' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE survey_responses ADD COLUMN completed_at timestamptz;
  END IF;

  -- Status odpowiedzi
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'survey_responses' AND column_name = 'status'
  ) THEN
    ALTER TABLE survey_responses ADD COLUMN status text DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'abandoned'));
  END IF;

  -- Źródło odpowiedzi
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'survey_responses' AND column_name = 'source'
  ) THEN
    ALTER TABLE survey_responses ADD COLUMN source text DEFAULT 'direct';
  END IF;

  -- Referrer
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'survey_responses' AND column_name = 'referrer'
  ) THEN
    ALTER TABLE survey_responses ADD COLUMN referrer text;
  END IF;

  -- Język
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'survey_responses' AND column_name = 'language'
  ) THEN
    ALTER TABLE survey_responses ADD COLUMN language text DEFAULT 'pl';
  END IF;

  -- Telefon
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'survey_responses' AND column_name = 'phone'
  ) THEN
    ALTER TABLE survey_responses ADD COLUMN phone text;
  END IF;

  -- Dodatkowe metadane
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'survey_responses' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE survey_responses ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- =============================================
-- NOWE TABELE
-- =============================================

-- Tabela profili użytkowników
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  first_name text,
  last_name text,
  company text,
  website text,
  phone text,
  avatar_url text,
  bio text,
  timezone text DEFAULT 'Europe/Warsaw',
  language text DEFAULT 'pl',
  email_notifications boolean DEFAULT true,
  marketing_emails boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Tabela szablonów ankiet
CREATE TABLE IF NOT EXISTS survey_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text,
  questions jsonb DEFAULT '[]'::jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  preview_image text,
  is_public boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela analityki ankiet
CREATE TABLE IF NOT EXISTS survey_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid REFERENCES surveys(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  views integer DEFAULT 0,
  starts integer DEFAULT 0,
  completions integer DEFAULT 0,
  abandonment_rate numeric(5,2) DEFAULT 0,
  avg_completion_time interval,
  bounce_rate numeric(5,2) DEFAULT 0,
  conversion_rate numeric(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(survey_id, date)
);

-- Tabela udostępnień ankiet
CREATE TABLE IF NOT EXISTS survey_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid REFERENCES surveys(id) ON DELETE CASCADE NOT NULL,
  share_type text NOT NULL CHECK (share_type IN ('link', 'email', 'social', 'embed', 'qr')),
  share_url text,
  title text,
  description text,
  settings jsonb DEFAULT '{}'::jsonb,
  click_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela tagów
CREATE TABLE IF NOT EXISTS survey_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text DEFAULT '#6366f1',
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(name, user_id)
);

-- Tabela kampanii emailowych
CREATE TABLE IF NOT EXISTS email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid REFERENCES surveys(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  recipient_list jsonb DEFAULT '[]'::jsonb,
  sent_count integer DEFAULT 0,
  opened_count integer DEFAULT 0,
  clicked_count integer DEFAULT 0,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela logów webhooków
CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid REFERENCES surveys(id) ON DELETE CASCADE,
  webhook_url text NOT NULL,
  event_type text NOT NULL,
  payload jsonb,
  response_status integer,
  response_body text,
  error_message text,
  retry_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Tabela kluczy API
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  permissions jsonb DEFAULT '[]'::jsonb,
  last_used_at timestamptz,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela planów subskrypcji
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_monthly numeric(10,2),
  price_yearly numeric(10,2),
  features jsonb DEFAULT '[]'::jsonb,
  limits jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela subskrypcji użytkowników
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id uuid REFERENCES subscription_plans(id) ON DELETE SET NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired', 'past_due')),
  billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  stripe_subscription_id text,
  stripe_customer_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Tabela historii płatności
CREATE TABLE IF NOT EXISTS payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id uuid REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'PLN',
  status text NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  stripe_payment_intent_id text,
  stripe_invoice_id text,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Tabela logiki warunkowej ankiet
CREATE TABLE IF NOT EXISTS survey_logic (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid REFERENCES surveys(id) ON DELETE CASCADE NOT NULL,
  question_id text NOT NULL,
  condition_type text NOT NULL CHECK (condition_type IN ('show_if', 'hide_if', 'skip_to', 'end_if')),
  conditions jsonb NOT NULL,
  actions jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela eksportów odpowiedzi
CREATE TABLE IF NOT EXISTS response_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid REFERENCES surveys(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  export_type text NOT NULL CHECK (export_type IN ('csv', 'xlsx', 'json', 'pdf')),
  filters jsonb DEFAULT '{}'::jsonb,
  file_url text,
  file_size integer,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- WŁĄCZENIE RLS
-- =============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_logic ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_exports ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLITYKI RLS
-- =============================================

-- Polityki dla user_profiles
CREATE POLICY "Użytkownicy mogą zarządzać swoim profilem"
  ON user_profiles FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Polityki dla survey_templates
CREATE POLICY "Wszyscy mogą przeglądać publiczne szablony"
  ON survey_templates FOR SELECT TO authenticated
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Użytkownicy mogą tworzyć szablony"
  ON survey_templates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Twórcy mogą aktualizować swoje szablony"
  ON survey_templates FOR UPDATE TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Twórcy mogą usuwać swoje szablony"
  ON survey_templates FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

-- Polityki dla survey_analytics
CREATE POLICY "Właściciele ankiet mogą przeglądać analitykę"
  ON survey_analytics FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM surveys 
      WHERE surveys.id = survey_analytics.survey_id 
      AND surveys.user_id = auth.uid()
    )
  );

-- Polityki dla survey_shares
CREATE POLICY "Właściciele ankiet mogą zarządzać udostępnieniami"
  ON survey_shares FOR ALL TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Polityki dla survey_tags
CREATE POLICY "Użytkownicy mogą zarządzać swoimi tagami"
  ON survey_tags FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Polityki dla email_campaigns
CREATE POLICY "Użytkownicy mogą zarządzać swoimi kampaniami"
  ON email_campaigns FOR ALL TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Polityki dla webhook_logs
CREATE POLICY "Właściciele ankiet mogą przeglądać logi webhooków"
  ON webhook_logs FOR SELECT TO authenticated
  USING (
    survey_id IS NULL OR EXISTS (
      SELECT 1 FROM surveys 
      WHERE surveys.id = webhook_logs.survey_id 
      AND surveys.user_id = auth.uid()
    )
  );

-- Polityki dla api_keys
CREATE POLICY "Użytkownicy mogą zarządzać swoimi kluczami API"
  ON api_keys FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Polityki dla subscription_plans
CREATE POLICY "Wszyscy mogą przeglądać aktywne plany"
  ON subscription_plans FOR SELECT TO authenticated
  USING (is_active = true);

-- Polityki dla user_subscriptions
CREATE POLICY "Użytkownicy mogą przeglądać swoją subskrypcję"
  ON user_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Polityki dla payment_history
CREATE POLICY "Użytkownicy mogą przeglądać swoją historię płatności"
  ON payment_history FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Polityki dla survey_logic
CREATE POLICY "Właściciele ankiet mogą zarządzać logiką"
  ON survey_logic FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM surveys 
      WHERE surveys.id = survey_logic.survey_id 
      AND surveys.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM surveys 
      WHERE surveys.id = survey_logic.survey_id 
      AND surveys.user_id = auth.uid()
    )
  );

-- Polityki dla response_exports
CREATE POLICY "Użytkownicy mogą zarządzać swoimi eksportami"
  ON response_exports FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- INDEKSY
-- =============================================

-- Indeksy dla wydajności
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_templates_category ON survey_templates(category);
CREATE INDEX IF NOT EXISTS idx_survey_templates_is_public ON survey_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_survey_analytics_survey_id_date ON survey_analytics(survey_id, date);
CREATE INDEX IF NOT EXISTS idx_survey_shares_survey_id ON survey_shares(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_shares_share_type ON survey_shares(share_type);
CREATE INDEX IF NOT EXISTS idx_survey_tags_user_id ON survey_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_survey_id ON email_campaigns(survey_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_survey_id ON webhook_logs(survey_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);
CREATE INDEX IF NOT EXISTS idx_survey_logic_survey_id ON survey_logic(survey_id);
CREATE INDEX IF NOT EXISTS idx_response_exports_survey_id ON response_exports(survey_id);
CREATE INDEX IF NOT EXISTS idx_response_exports_user_id ON response_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_response_exports_status ON response_exports(status);

-- Indeksy dla survey_responses (dodatkowe)
CREATE INDEX IF NOT EXISTS idx_survey_responses_status ON survey_responses(status);
CREATE INDEX IF NOT EXISTS idx_survey_responses_source ON survey_responses(source);
CREATE INDEX IF NOT EXISTS idx_survey_responses_completed_at ON survey_responses(completed_at);
CREATE INDEX IF NOT EXISTS idx_survey_responses_ip_address ON survey_responses(ip_address);

-- Indeksy dla surveys (dodatkowe)
CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status);
CREATE INDEX IF NOT EXISTS idx_surveys_category ON surveys(category);
CREATE INDEX IF NOT EXISTS idx_surveys_slug ON surveys(slug);
CREATE INDEX IF NOT EXISTS idx_surveys_tags ON surveys USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_surveys_start_date ON surveys(start_date);
CREATE INDEX IF NOT EXISTS idx_surveys_end_date ON surveys(end_date);

-- =============================================
-- TRIGGERY
-- =============================================

-- Triggery dla updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_survey_templates_updated_at
  BEFORE UPDATE ON survey_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_survey_shares_updated_at
  BEFORE UPDATE ON survey_shares
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at
  BEFORE UPDATE ON email_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_survey_logic_updated_at
  BEFORE UPDATE ON survey_logic
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_response_exports_updated_at
  BEFORE UPDATE ON response_exports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNKCJE POMOCNICZE
-- =============================================

-- Funkcja do aktualizacji licznika odpowiedzi
CREATE OR REPLACE FUNCTION update_survey_response_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE surveys 
    SET response_count = response_count + 1 
    WHERE id = NEW.survey_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE surveys 
    SET response_count = response_count - 1 
    WHERE id = OLD.survey_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger dla licznika odpowiedzi
DROP TRIGGER IF EXISTS trigger_update_survey_response_count ON survey_responses;
CREATE TRIGGER trigger_update_survey_response_count
  AFTER INSERT OR DELETE ON survey_responses
  FOR EACH ROW EXECUTE FUNCTION update_survey_response_count();

-- Funkcja do generowania slug
CREATE OR REPLACE FUNCTION generate_survey_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug = lower(regexp_replace(NEW.title, '[^a-zA-Z0-9\s]', '', 'g'));
    NEW.slug = regexp_replace(NEW.slug, '\s+', '-', 'g');
    NEW.slug = NEW.slug || '-' || substr(NEW.id::text, 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger dla generowania slug
DROP TRIGGER IF EXISTS trigger_generate_survey_slug ON surveys;
CREATE TRIGGER trigger_generate_survey_slug
  BEFORE INSERT OR UPDATE ON surveys
  FOR EACH ROW EXECUTE FUNCTION generate_survey_slug();

-- =============================================
-- DANE POCZĄTKOWE
-- =============================================

-- Podstawowe plany subskrypcji
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, features, limits, sort_order)
VALUES 
  (
    'Darmowy',
    'Idealny do rozpoczęcia przygody z ankietami',
    0,
    0,
    '["Maksymalnie 3 ankiety", "100 odpowiedzi miesięcznie", "Podstawowe szablony", "Email support"]',
    '{"surveys": 3, "responses_per_month": 100, "questions_per_survey": 10}',
    1
  ),
  (
    'Pro',
    'Dla profesjonalistów i małych firm',
    49,
    490,
    '["Nieograniczone ankiety", "1000 odpowiedzi miesięcznie", "Wszystkie szablony", "Logika warunkowa", "Eksport danych", "Integracje", "Priority support"]',
    '{"surveys": -1, "responses_per_month": 1000, "questions_per_survey": 50}',
    2
  ),
  (
    'Business',
    'Dla większych organizacji',
    99,
    990,
    '["Wszystko z Pro", "5000 odpowiedzi miesięcznie", "Zaawansowana analityka", "White-label", "API dostęp", "Webhooks", "Dedicated support"]',
    '{"surveys": -1, "responses_per_month": 5000, "questions_per_survey": 100}',
    3
  )
ON CONFLICT DO NOTHING;

-- Podstawowe szablony ankiet
INSERT INTO survey_templates (name, description, category, questions, is_public)
VALUES 
  (
    'Ankieta Satysfakcji Klienta',
    'Szablon do badania satysfakcji klientów',
    'Biznes',
    '[
      {
        "id": "satisfaction",
        "type": "rating",
        "title": "Jak oceniasz nasze usługi?",
        "required": true
      },
      {
        "id": "recommendation",
        "type": "rating", 
        "title": "Czy poleciłbyś nas znajomym?",
        "required": true
      },
      {
        "id": "feedback",
        "type": "textarea",
        "title": "Co możemy poprawić?",
        "required": false
      }
    ]',
    true
  ),
  (
    'Ankieta Pracownicza',
    'Szablon do badania zaangażowania pracowników',
    'HR',
    '[
      {
        "id": "engagement",
        "type": "rating",
        "title": "Jak oceniasz swoje zaangażowanie w pracy?",
        "required": true
      },
      {
        "id": "satisfaction",
        "type": "rating",
        "title": "Jak oceniasz satysfakcję z pracy?", 
        "required": true
      },
      {
        "id": "suggestions",
        "type": "textarea",
        "title": "Jakie masz sugestie dotyczące poprawy środowiska pracy?",
        "required": false
      }
    ]',
    true
  )
ON CONFLICT DO NOTHING;