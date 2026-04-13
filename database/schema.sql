-- ==========================================
-- FlowFin v5 - Database Schema Completo
-- Ejecutar en Supabase SQL Editor
-- ==========================================

-- 1. Trigger: crear perfil automáticamente al registrarse con Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, currency, onboarded)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'),
    NEW.email,
    'MXN',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. Tabla de perfiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  currency TEXT DEFAULT 'MXN',
  monthly_income DECIMAL(15,2),
  income_type TEXT DEFAULT 'fixed',
  has_debts BOOLEAN DEFAULT false,
  goal_type TEXT DEFAULT 'save',
  onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de transacciones
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  category_id TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de presupuestos
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  alert_threshold INTEGER DEFAULT 80,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id, month, year)
);

-- 5. Tabla de deudas
CREATE TABLE IF NOT EXISTS public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL CHECK (total_amount > 0),
  paid_amount DECIMAL(15,2) DEFAULT 0,
  interest_rate DECIMAL(5,2) DEFAULT 0,
  creditor TEXT,
  min_payment DECIMAL(15,2),
  due_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paid', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Pagos de deudas
CREATE TABLE IF NOT EXISTS public.debt_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Metas de ahorro
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL CHECK (target_amount > 0),
  current_amount DECIMAL(15,2) DEFAULT 0,
  deadline DATE,
  emoji TEXT DEFAULT '🎯',
  color TEXT DEFAULT '#6366F1',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Aportaciones a metas
CREATE TABLE IF NOT EXISTS public.goal_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_contributions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users see own profile" ON public.profiles;
CREATE POLICY "Users see own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users manage own transactions" ON public.transactions;
CREATE POLICY "Users manage own transactions" ON public.transactions
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own budgets" ON public.budgets;
CREATE POLICY "Users manage own budgets" ON public.budgets
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own debts" ON public.debts;
CREATE POLICY "Users manage own debts" ON public.debts
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own debt payments" ON public.debt_payments;
CREATE POLICY "Users manage own debt payments" ON public.debt_payments
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own goals" ON public.savings_goals;
CREATE POLICY "Users manage own goals" ON public.savings_goals
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own goal contributions" ON public.goal_contributions;
CREATE POLICY "Users manage own goal contributions" ON public.goal_contributions
  FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- TRIGGERS updated_at
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_debts_updated_at ON public.debts;
CREATE TRIGGER update_debts_updated_at BEFORE UPDATE ON public.debts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_savings_goals_updated_at ON public.savings_goals;
CREATE TRIGGER update_savings_goals_updated_at BEFORE UPDATE ON public.savings_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
