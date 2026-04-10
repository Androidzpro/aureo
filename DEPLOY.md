# 🚀 Guía de Despliegue - Aureo

## Stack de Producción

- **Frontend:** Vercel → `https://aureo.vercel.app`
- **Backend:** Render → `https://aureo.onrender.com`
- **Base de datos:** Supabase → PostgreSQL gratuito (500MB)

---

## 📋 PASO 1: Subir a GitHub

```bash
# Inicializa git
git init

# Agrega todos los archivos
git add .

# Crea .env en la raíz con tus credenciales
# (ya está en .gitignore, NO se sube a GitHub)

# Primer commit
git commit -m "🚀 Initial commit - Aureo Financial Management"

# Crea el repo en GitHub y súbelo
git remote add origin https://github.com/TU-USUARIO/aureo.git
git branch -M main
git push -u origin main
```

---

## 🗄️ PASO 2: Configurar Supabase (ya lo tienes)

Tu proyecto Supabase está listo. Solo necesitas:

1. Ir a **Settings > Database**
2. Copiar la **Connection string** (modo URI)
3. La usarás en Render (Paso 3)

### ⚠️ IMPORTANTE: Connection Pooling

Para Render, usa el **Connection Pooler** (puerto 6543):

1. En **Settings > Database > Connection pooling**
2. Copia el **Host** del pooler
3. La URL se ve así:
   ```
   postgresql://postgres.[project-ref]:[password]@[pooler-host]:6543/postgres?sslmode=require
   ```

---

## 🔧 PASO 3: Desplegar Backend en Render

1. Ve a https://render.com
2. **Sign in** con GitHub
3. **New +** → **Web Service**
4. Conecta tu repo `aureo`
5. Configura:

| Campo | Valor |
|-------|-------|
| **Name** | `aureo-api` |
| **Root Directory** | `server` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Environment** | `Node` |
| **Plan** | **Free** |

6. **Agrega estas variables de entorno:**

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Tu connection string de Supabase |
| `JWT_SECRET` | Cualquier string largo y aleatorio |
| `JWT_EXPIRES_IN` | `7d` |
| `CLIENT_URL` | `https://aureo.vercel.app` |

7. Click en **Deploy Web Service**
8. Espera ~3 minutos
9. Copia la URL que te da Render (algo como: `https://aureo-api-xyz.onrender.com`)

---

## 🎨 PASO 4: Desplegar Frontend en Vercel

1. Ve a https://vercel.com
2. **Sign in** con GitHub
3. **Add New...** → **Project**
4. Importa tu repo `aureo`
5. Configura:

| Campo | Valor |
|-------|-------|
| **Framework Preset** | `Vite` |
| **Root Directory** | `client` |
| **Build Command** | `npm install && npm run build` |
| **Output Directory** | `dist` |

6. **Agrega esta variable de entorno:**

| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | `https://tu-api.onrender.com/api` |

7. Click en **Deploy**
8. Espera ~1 minuto
9. ¡Listo! Tu app está en `https://aureo.vercel.app`

---

## 🔗 PASO 5: Actualizar URL del backend

Después de tener ambas URLs:

1. Ve a **Render** → Settings → Environment Variables
2. Cambia `CLIENT_URL` a tu URL de Vercel
3. Ve a **Vercel** → Settings → Environment Variables
4. Asegúrate que `VITE_API_URL` apunta a tu URL de Render
5. **Redeploy** en ambos (automático al hacer push)

---

## 🌐 URLs Finales

| Servicio | URL |
|----------|-----|
| **Frontend** | `https://aureo.vercel.app` |
| **Backend API** | `https://aureo-api-xyz.onrender.com` |
| **API Health** | `https://aureo-api-xyz.onrender.com/api/health` |
| **Base de datos** | Supabase Cloud |

---

## ⚠️ Notas Importantes

### Render Free Tier
- El servidor se "duerme" después de 15 min sin uso
- La primera request tarda ~30 segundos en despertar
- Para uso personal, perfecto

### Vercel Free Tier
- Siempre activo, sin sleeping
- 100GB bandwidth/mes (suficiente para uso personal)

### Supabase Free Tier
- 500MB de base de datos
- 2GB de transferencia/mes
- Proyectos se pausan después de 7 días sin actividad (solo reactiva)

---

## 🔄 Actualizar tu app

Cada vez que hagas cambios:

```bash
git add .
git commit -m "descripción del cambio"
git push
```

**Automáticamente:**
- Vercel redeploys frontend (~1 min)
- Render redeploys backend (~2 min)

---

## 🎉 ¡Listo!

Tu app de gestión financiera personal está online, gratis, con HTTPS y dominio propio.
