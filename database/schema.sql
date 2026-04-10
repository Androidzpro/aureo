-- ============================================
-- FlowFin - Esquema de Base de Datos
-- ============================================

-- Tabla: Usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: Cuentas (salarios, trabajos, etc.)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'checking', -- checking, savings, cash, credit
  balance DECIMAL(15,2) DEFAULT 0,
  color TEXT DEFAULT '#6366F1',
  icon TEXT DEFAULT 'wallet',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: Categorías de gastos
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'expense', -- expense, income
  color TEXT DEFAULT '#6366F1',
  icon TEXT DEFAULT 'tag',
  monthly_limit DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: Transacciones
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- income, expense, transfer
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  notes TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_recurring BOOLEAN DEFAULT false,
  recurrence_type TEXT, -- daily, weekly, monthly, yearly
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: Presupuestos (topes mensuales)
CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  period TEXT DEFAULT 'monthly', -- weekly, monthly, yearly
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category_id, month, year)
);

-- Tabla: Deudas
CREATE TABLE IF NOT EXISTS debts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  interest_rate DECIMAL(5,2) DEFAULT 0,
  min_payment DECIMAL(15,2),
  due_date TIMESTAMP WITH TIME ZONE,
  creditor TEXT,
  status TEXT DEFAULT 'active', -- active, paid, cancelled
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: Pagos de deudas
CREATE TABLE IF NOT EXISTS debt_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  debt_id UUID REFERENCES debts(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: Metas de ahorro
CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) DEFAULT 0,
  deadline TIMESTAMP WITH TIME ZONE,
  color TEXT DEFAULT '#6366F1',
  icon TEXT DEFAULT 'target',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Anyone can read users" ON users FOR SELECT USING (true);
CREATE POLICY "Anyone can create users" ON users FOR INSERT WITH CHECK (true);

CREATE POLICY "Users manage own accounts" ON accounts FOR ALL USING (true);
CREATE POLICY "Users manage own categories" ON categories FOR ALL USING (true);
CREATE POLICY "Users manage own transactions" ON transactions FOR ALL USING (true);
CREATE POLICY "Users manage own budgets" ON budgets FOR ALL USING (true);
CREATE POLICY "Users manage own debts" ON debts FOR ALL USING (true);
CREATE POLICY "Users manage own debt payments" ON debt_payments FOR ALL USING (true);
CREATE POLICY "Users manage own savings goals" ON savings_goals FOR ALL USING (true);

-- Insertar categorías por defecto
INSERT INTO categories (name, type, color, icon) VALUES
  ('Alimentación', 'expense', '#EF4444', 'utensils'),
  ('Transporte', 'expense', '#F59E0B', 'car'),
  ('Vivienda', 'expense', '#8B5CF6', 'home'),
  ('Entretenimiento', 'expense', '#EC4899', 'gamepad'),
  ('Salud', 'expense', '#10B981', 'heart'),
  ('Educación', 'expense', '#3B82F6', 'graduation-cap'),
  ('Ropa', 'expense', '#6366F1', 'shirt'),
  ('Servicios', 'expense', '#64748B', 'zap'),
  ('Suscripciones', 'expense', '#A855F7', 'refresh-cw'),
  ('Otros gastos', 'expense', '#78716C', 'more-horizontal'),
  ('Salario', 'income', '#10B981', 'briefcase'),
  ('Freelance', 'income', '#06B6D4', 'code'),
  ('Negocio', 'income', '#F59E0B', 'shopping-bag'),
  ('Inversiones', 'income', '#8B5CF6', 'trending-up'),
  ('Otros ingresos', 'income', '#64748B', 'plus-circle');
