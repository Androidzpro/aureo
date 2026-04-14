-- =====================================================
-- FlowFin - Crear usuario CONFIRMADO
-- Email: santanacampo015@gmail.com
-- Password: TestFlowFin123
-- =====================================================
-- Copia TODO este bloque y pégalo en Supabase → SQL Editor → Run
-- =====================================================

-- 1. Crear la función helper (solo la primera vez)
CREATE OR REPLACE FUNCTION public.create_user_confirmed(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    confirmation_sent_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_sso_user,
    is_anonymous
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    format('{"name":"%s"}', p_name)::jsonb,
    false,
    false
  ) RETURNING id INTO v_user_id;

  -- Crear perfil automáticamente
  INSERT INTO profiles (id, name, email, onboarded, currency)
  VALUES (v_user_id, p_name, p_email, true, 'MXN');

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Crear el usuario (re-ejecutable, seguro)
DO $$
BEGIN
  -- Si ya existe, no hacer nada
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'santanacampo015@gmail.com') THEN
    RAISE NOTICE 'El usuario ya existe. No se hizo ningún cambio.';
  ELSE
    PERFORM public.create_user_confirmed(
      'santanacampo015@gmail.com',
      'TestFlowFin123',
      'Usuario Campo'
    );
    RAISE NOTICE 'Usuario creado exitosamente.';
  END IF;
END $$;

-- =====================================================
-- Credenciales de acceso:
-- Email: santanacampo015@gmail.com
-- Password: TestFlowFin123
-- Ya confirmado (no necesita email verification)
-- Perfil creado automáticamente (onboarded: true, currency: MXN)
-- =====================================================
