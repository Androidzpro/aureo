-- =====================================================
-- FlowFin - Paso 1: Crear tablas + trigger + políticas
-- Ejecutar PRIMERO este bloque en SQL Editor
-- =====================================================

-- 1. Tabla profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MXN',
  monthly_income NUMERIC,
  income_type TEXT DEFAULT 'fixed' CHECK (income_type IN ('fixed', 'variable')),
  has_debts BOOLEAN DEFAULT false,
  goal_type TEXT DEFAULT 'save' CHECK (goal_type IN ('save', 'debt_control', 'expense_control')),
  onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(15,2) NOT NULL,
  description TEXT NOT NULL,
  category_id TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 4. Políticas (usamos DO para idempotencia)
DO $$
BEGIN
  -- profiles policies
  BEGIN
    EXECUTE 'CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id)';
  EXCEPTION WHEN OTHERS THEN END;
  BEGIN
    EXECUTE 'CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id)';
  EXCEPTION WHEN OTHERS THEN END;
  BEGIN
    EXECUTE 'CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id)';
  EXCEPTION WHEN OTHERS THEN END;

  -- transactions policies
  BEGIN
    EXECUTE 'CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id)';
  EXCEPTION WHEN OTHERS THEN END;
  BEGIN
    EXECUTE 'CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id)';
  EXCEPTION WHEN OTHERS THEN END;
  BEGIN
    EXECUTE 'CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id)';
  EXCEPTION WHEN OTHERS THEN END;
  BEGIN
    EXECUTE 'CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id)';
  EXCEPTION WHEN OTHERS THEN END;
END $$;

-- 5. Trigger para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Índice
CREATE INDEX IF NOT EXISTS idx_transactions_user_date
  ON transactions (user_id, date DESC);

-- =====================================================
-- Verifica que las tablas existen:
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- =====================================================
