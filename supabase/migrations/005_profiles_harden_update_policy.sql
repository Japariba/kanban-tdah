-- Harden: impedir escalonamento de plano pelo cliente
-- Usuário autenticado pode atualizar apenas campos "seguros" (ex.: stripe_customer_id).
-- plan_tier e subscription_status devem ser atualizados por backend com service_role.

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND plan_tier = (
      SELECT p.plan_tier
      FROM public.profiles p
      WHERE p.id = auth.uid()
    )
    AND subscription_status = (
      SELECT p.subscription_status
      FROM public.profiles p
      WHERE p.id = auth.uid()
    )
  );
