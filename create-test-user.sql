-- =====================================================
-- FlowFin - Crear usuario de prueba confirmado
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =====================================================
-- Esto crea un usuario YA confirmado (sin necesidad de email)
-- con Supabase Auth + perfil completo
-- =====================================================

-- NOTA: Supabase no permite INSERT directo en auth.users.
-- Para crear un usuario de prueba confirmado, ejecuta esto
-- en el SQL Editor de Supabase:

SELECT create_user_with_profile(
  'test@flowfin.com',
  'TestUser123',
  'Usuario Test'
);

-- =====================================================
-- Si la función no existe, ejecuta este bloque completo:
-- =====================================================

-- 1. Crear la función helper (una sola vez)
CREATE OR REPLACE FUNCTION create_user_with_profile(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Crear usuario en auth.users
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
    '{"provider":"email","providers":["email"]}',
    format('{"name":"%s"}', p_name)::jsonb,
    false,
    false
  ) RETURNING id INTO v_user_id;

  -- Crear perfil
  INSERT INTO profiles (id, name, email, onboarded, currency)
  VALUES (v_user_id, p_name, p_email, true, 'MXN');

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ejecutar para crear el usuario
SELECT create_user_with_profile(
  'test@flowfin.com',
  'TestUser123',
  'Usuario Test'
);

-- =====================================================
-- Credenciales de acceso:
-- Email: test@flowfin.com
-- Password: TestUser123
-- =====================================================
