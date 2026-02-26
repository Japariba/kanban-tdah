-- Monetização: perfis com status de assinatura (Feature Gating)
-- Stripe: stripe_customer_id; status/tier para bloquear por funcionalidade

CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  stripe_customer_id text UNIQUE,
  subscription_status text NOT NULL DEFAULT 'free' CHECK (subscription_status IN ('free', 'pro', 'past_due', 'canceled')),
  plan_tier text NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Permite que o próprio usuário atualize (ex.: após checkout para salvar stripe_customer_id)
-- Webhooks Stripe devem usar service_role para atualizar subscription_status/plan_tier
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Trigger: criar perfil automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- Backfill: usuários existentes antes do trigger passam a ter perfil free
INSERT INTO public.profiles (id, subscription_status, plan_tier)
  SELECT id, 'free', 'free' FROM auth.users
  ON CONFLICT (id) DO NOTHING;
