-- =====================================================
-- FlowFin - Paso 2: Crear usuario CONFIRMADO
-- Ejecutar DESPUÉS de setup-db.sql
-- Email: santanacampo015@gmail.com
-- Password: TestFlowFin123
-- =====================================================

-- Función helper
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
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, recovery_sent_at, confirmation_sent_at,
    created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated', p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(), NOW(), NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    format('{"name":"%s"}', p_name)::jsonb,
    false, false
  ) RETURNING id INTO v_user_id;

  INSERT INTO profiles (id, name, email, onboarded, currency)
  VALUES (v_user_id, p_name, p_email, true, 'MXN');

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear usuario (seguro - no duplica)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'santanacampo015@gmail.com') THEN
    RAISE NOTICE 'El usuario ya existe.';
  ELSE
    PERFORM public.create_user_confirmed('santanacampo015@gmail.com', 'TestFlowFin123', 'Usuario Campo');
    RAISE NOTICE 'Usuario creado exitosamente!';
  END IF;
END $$;

-- =====================================================
-- Email: santanacampo015@gmail.com
-- Password: TestFlowFin123
-- =====================================================
