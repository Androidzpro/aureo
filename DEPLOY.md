# 🚀 Guía de Despliegue - FlowFin

## Stack de Producción

- **Frontend:** Vercel → `https://fortuna-zeta-seven.vercel.app`
- **Auth:** Supabase Auth (email + password)
- **Email:** Brevo SMTP (vía Supabase)
- **Base de datos:** Supabase → PostgreSQL gratuito (500MB)

---

## 🔐 PASO 1: Configurar Supabase Auth

### 1.1 Ir al Dashboard de Supabase
- Ve a https://supabase.com/dashboard
- Selecciona tu proyecto: `ibgmvprphhdtxnlexkgz`

### 1.2 Configurar Email Auth
1. Ve a **Authentication → Providers → Email**
2. Asegúrate que esté **Enabled**
3. Configura:

| Campo | Valor |
|-------|-------|
| **Enable Email Auth** | ✅ ON |
| **Enable email confirmations** | ✅ ON (requiere confirmación) |
| **Secure email change** | ✅ ON |
| **Double confirm** | ❌ OFF (solo una confirmación) |

### 1.3 Configurar URLs de redirección
1. Ve a **Authentication → URL Configuration**
2. Configura:

| Campo | Valor |
|-------|-------|
| **Site URL** | `https://fortuna-zeta-seven.vercel.app` |
| **Redirect URLs** | `https://fortuna-zeta-seven.vercel.app/**` |

> ⚠️ **IMPORTANTE:** El patrón `/**` permite cualquier ruta en tu dominio. Sin esto, los links de confirmación y recuperación fallarán con `access_denied`.

### 1.4 Configurar el template de emails
1. Ve a **Authentication → Email Templates**
2. Para cada template (**Confirm signup**, **Reset password**, etc.):

**Template: Confirm signup**
- Subject: `Confirma tu cuenta en FlowFin`
- Body:
```html
<h2>¡Bienvenido a FlowFin! 💸</h2>
<p>Haz clic en el botón para confirmar tu correo y activar tu cuenta:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar mi cuenta</a></p>
<p>Si no creaste esta cuenta, ignora este correo.</p>
<p>El enlace expira en 24 horas.</p>
```

**Template: Reset password**
- Subject: `Restablece tu contraseña de FlowFin`
- Body:
```html
<h2>Restablecer contraseña 🔒</h2>
<p>Recibimos una solicitud para restablecer tu contraseña. Haz clic abajo:</p>
<p><a href="{{ .ConfirmationURL }}">Restablecer contraseña</a></p>
<p>Si no solicitaste esto, ignora este correo. Tu contraseña seguirá igual.</p>
<p>El enlace expira en 1 hora.</p>
```

---

## 📧 PASO 2: Configurar Brevo SMTP

### 2.1 Crear cuenta en Brevo
1. Ve a https://www.brevo.com/
2. Crea una cuenta gratuita (hasta 300 emails/día gratis)
3. Verifica tu dominio (recomendado) o usa el email por defecto

### 2.2 Obtener credenciales SMTP
1. En Brevo, ve a **SMTP & API → SMTP**
2. Encuentra las credenciales:

| Campo | Ejemplo |
|-------|---------|
| **SMTP Server** | `smtp-relay.brevo.com` |
| **Port** | `587` (TLS) o `465` (SSL) |
| **Login** | Tu email de Brevo |
| **Password** | Tu contraseña SMTP (no la de tu cuenta) |

### 2.3 Configurar SMTP en Supabase
1. Ve a **Settings → Email** (o **Authentication → Email Settings**)
2. Sección **SMTP Settings**
3. Selecciona **Custom SMTP**
4. Configura:

| Campo | Valor |
|-------|-------|
| **Sender email** | `noreply@tudominio.com` (o tu email de Brevo) |
| **Sender name** | `FlowFin` |
| **Host** | `smtp-relay.brevo.com` |
| **Port** | `587` |
| **Username** | Tu login SMTP de Brevo |
| **Password** | Tu password SMTP de Brevo |

5. Click **Send test email** para verificar
6. **Save**

> ⚠️ **IMPORTANTE:** Si el test falla:
> - Verifica que el puerto sea 587 (no 465)
> - Verifica que la contraseña sea la **SMTP** (no la de la cuenta Brevo)
> - En Brevo, verifica que tu cuenta tenga acceso SMTP activo

### 2.4 Buenas prácticas con Brevo
- **Verifica tu dominio** en Brevo para mejorar deliverability (SPF, DKIM, DMARC)
- **No envíes más de 300 emails/día** en el plan gratuito
- **Usa un sender name reconocible**: "FlowFin" no "noreply"
- **Monitorea bounce rate** en el dashboard de Brevo

---

## 🗄️ PASO 3: Configurar Base de Datos

### 3.1 Crear tabla `profiles` en Supabase

Ve a **SQL Editor** y ejecuta:

```sql
-- Tabla de perfiles de usuario
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

-- Tabla de transacciones
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

-- Habilitar Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Políticas RLS para transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para crear perfil automáticamente
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

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Índice para queries por fecha
CREATE INDEX IF NOT EXISTS idx_transactions_user_date
  ON transactions (user_id, date DESC);
```

---

## 🌐 PASO 4: Configurar Variables de Entorno

### 4.1 Local (desarrollo)
Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://ibgmvprphhdtxnlexkgz.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### 4.2 Vercel (producción)
1. Ve a tu proyecto en Vercel
2. **Settings → Environment Variables**
3. Agrega:

| Variable | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://ibgmvprphhdtxnlexkgz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Tu anon key de Supabase |

4. **Redeploy** para aplicar los cambios

> ⚠️ **NUNCA** subas el `.env` a Git. Ya está en `.gitignore`.

---

## 📦 PASO 5: Desplegar en Vercel

### 5.1 Subir a GitHub (si no lo has hecho)
```bash
git add .
git commit -m "feat: production-ready auth system"
git push origin main
```

### 5.2 Conectar repo a Vercel
1. Ve a https://vercel.com
2. **Add New... → Project**
3. Importa tu repo `fortuna`
4. Configura:

| Campo | Valor |
|-------|-------|
| **Framework Preset** | `Vite` |
| **Root Directory** | `./` (raíz del proyecto) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

5. Agrega las variables de entorno (Paso 4.2)
6. Click en **Deploy**

### 5.3 Verificar el deploy
- Abre `https://fortuna-zeta-seven.vercel.app`
- Intenta registrarte con un email real
- Deberías recibir el correo de confirmación
- Haz clic en el link → debes ser redirigido al dashboard

---

## ✅ PASO 6: Checklist de Verificación

### Auth Flow
- [ ] Registro con email + contraseña funciona
- [ ] Correo de confirmación llega (revisar spam)
- [ ] Clic en link de confirmación redirige al dashboard
- [ ] Login funciona después de confirmar email
- [ ] "Olvidé mi contraseña" envía email de recuperación
- [ ] Link de recuperación lleva a página de nueva contraseña
- [ ] Nueva contraseña se guarda y puedo hacer login
- [ ] Logout funciona correctamente

### Seguridad
- [ ] RLS policies están activas en Supabase
- [ ] No se exponen datos de otros usuarios
- [ ] Contraseñas requieren mínimo 8 chars + mayúscula + número
- [ ] Sesiones expiran correctamente
- [ ] Tokens se refrescan automáticamente

### UX
- [ ] Pantalla de "Revisa tu correo" aparece tras registro
- [ ] Mensajes de error son claros y en español
- [ ] Loaders aparecen durante operaciones asíncronas
- [ ] Redirecciones funcionan sin parpadeos

---

## 🐛 Errores Comunes y Soluciones

### `otp_expired`
**Causa:** El link del correo expiró (24h para confirmación, 1h para recovery).
**Solución:** El usuario debe solicitar un nuevo link desde el login.

### `access_denied`
**Causa:** Las Redirect URLs no están configuradas correctamente en Supabase.
**Solución:** Ve a **Authentication → URL Configuration** y agrega `https://fortuna-zeta-seven.vercel.app/**`

### El correo de confirmación no llega
**Causas posibles:**
1. SMTP no configurado en Supabase → Configura Brevo (Paso 2)
2. Email en spam → Indicar al usuario que revise spam
3. Dominio no verificado en Brevo → Verificar dominio en Brevo

### Después de confirmar email, no redirige
**Causa:** Falta la ruta `/auth/callback` en el frontend.
**Solución:** Ya implementada en `AuthCallbackPage.tsx`. Verifica que esté en `App.tsx`.

### `session_not_found` al hacer logout
**Causa:** La sesión ya expiró o fue eliminada.
**Solución:** El auth store maneja esto gracefully. No es un error crítico.

### Profile no se crea tras el registro
**Causa:** El trigger `handle_new_user` no existe o falló.
**Solución:** Ejecuta el SQL del Paso 3.1 nuevamente.

---

## 🔄 Actualizar la app

Cada vez que hagas cambios:

```bash
git add .
git commit -m "descripción del cambio"
git push
```

Vercel redeploya automáticamente (~1 min).

---

## 🎉 ¡Listo!

Tu sistema de autenticación fintech está en producción con:
- ✅ Supabase Auth con email confirmation
- ✅ Brevo SMTP para envío de correos
- ✅ Recuperación de contraseña funcional
- ✅ Sesiones persistentes con refresh automático
- ✅ UX profesional con feedback visual
- ✅ Row Level Security para protección de datos
