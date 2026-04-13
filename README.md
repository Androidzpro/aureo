# FlowFin 💸

> **Tu dinero, tu control.**

FlowFin es una aplicación web de gestión financiera personal diseñada para ayudarte a entender, controlar y mejorar tus finanzas. Pensada para cualquier persona que quiera saber a dónde va su dinero, reducir deudas, ahorrar más y tomar mejores decisiones financieras.

Sin suscripciones, sin complicaciones. Solo tú y tus finanzas, claras y simples.

---

## 🚀 Características principales

### 💰 Gestión de ingresos y gastos
Registra cada ingreso y gasto en segundos. Elige entre más de 20 categorías predefinidas —desde alimentación hasta inversiones— con una interfaz que parece una app nativa de tu teléfono.

### 💳 Seguimiento de deudas
Lleva el control de cuánto debes, a quién, con qué tasa de interés y cuánto has pagado. Visualiza tu progreso en tiempo real y celebra cada deuda que eliminas.

### 📋 Presupuestos mensuales
Define límites de gasto por categoría y recibe alertas cuando estés por superarlos. Nunca más te preguntes "¿en qué se me fue el sueldo?".

### 🎯 Metas de ahorro
Crea metas de ahorro personalizadas —vacaciones, un auto, un fondo de emergencia— y haz aportaciones parciales mientras ves tu progreso crecer.

### 📊 Reportes financieros
Visualiza tus finanzas con gráficas de barras, áreas y pastel. Filtra por fecha, categoría o tipo de movimiento. Exporta todo a CSV para tus propios análisis.

### 🤖 Coach financiero inteligente
FlowFin analiza tu comportamiento automáticamente y te da recomendaciones como:
- *"Estás gastando más del 40% en ocio"*
- *"Si reduces $500 en comida, ahorrarías $6,000 al año"*
- *"Tu tasa de ahorro está por debajo del mínimo recomendado"*
- *"⚠️ Tus gastos superaron tus ingresos este mes"*

---

## 🧠 Inteligencia financiera

FlowFin no solo registra — **entiende**. Un motor de análisis financiero evalúa constantemente tu comportamiento y genera insights accionables:

### Análisis automático
| Insight | Cuándo se activa |
|---------|-----------------|
| 🚨 **Balance negativo** | Cuando gastas más de lo que ganas |
| ⚠️ **Ahorro insuficiente** | Cuando ahorras menos del 10% de tus ingresos |
| 🎉 **Buen ahorro** | Cuando superas el 20% de ahorro |
| 📈 **Gastos crecientes** | Cuando tus gastos suben más del 20% vs el mes anterior |
| 📉 **Gastos decrecientes** | Cuando reduces gastos significativamente |
| 🔍 **Categoría dominante** | Cuando una sola categoría consume más del 40% de tus gastos |
| 🍽️ **Alerta de alimentación** | Cuando comida + restaurantes superan el 35% de tus ingresos |
| 🔄 **Suscripciones excesivas** | Cuando pagas más de $500/mes en suscripciones |
| 💳 **Deuda crítica** | Cuando tus deudas activas superan tus ingresos mensuales |
| ⛔ **Presupuesto excedido** | Cuando superas un límite de categoría |

### Score de salud financiera
Un puntaje de 0 a 100 que resume tu situación actual, calculado con base en:
- **Tasa de ahorro** (hasta +25 puntos)
- **Proporción gasto/ingreso** (hasta +15 puntos)
- **Consistencia de registro** (hasta +10 puntos)
- **Penalizaciones** por balance negativo o deudas altas

---

## 📱 Diseño y experiencia de usuario

### Mobile-first real
FlowFin está diseñado primero para pantallas pequeñas. Cada botón, cada formulario, cada navegación fue pensada para el pulgar:

- **Bottom navigation** con 5 tabs siempre al alcance
- **Botón flotante (FAB)** para agregar movimientos en 1 toque
- **Modales desde abajo** (sheet pattern) como en apps nativas
- **Inputs optimizados** que activan el teclado numérico correcto
- **Sin scroll horizontal**, sin zoom accidental

### Diseño tipo SaaS premium
Inspirado en las mejores apps fintech del mercado —1Money, Wallet by BudgetBakers, YNAB— con un diseño limpio que prioriza la información importante:

- **Paleta sobria**: fondo blanco, texto oscuro, acentos en indigo
- **Tarjetas con bordes sutiles**: información clara sin ruido visual
- **Gradientes solo donde importa**: la tarjeta de balance destaca sin distraer
- **Tipografía Inter**: legible en cualquier tamaño de pantalla

### Modo oscuro
Soporte completo para dark mode. Toda la interfaz se adapta automáticamente a la preferencia de tu dispositivo.

---

## 🧮 Lógica financiera

### Balance del mes
```
Balance = Ingresos del mes − Gastos del mes
```
Se calcula filtrando todas las transacciones del mes actual por tipo y realizando la resta. El resultado se muestra en verde si es positivo, rojo si es negativo.

### Tasa de ahorro
```
Tasa de ahorro = ((Ingresos − Gastos) / Ingresos) × 100
```
El porcentaje de tus ingresos que no se convierte en gasto. Una tasa saludable está entre 20% y 30%.

### Progreso de deuda
```
Progreso = (Monto pagado / Monto total) × 100
Restante = Monto total − Monto pagado
```
Cada pago registrado actualiza el monto pagado y recalcula el porcentaje. Cuando el pagado ≥ total, la deuda se marca como "pagada".

### Progreso de meta
```
Progreso = (Monto actual / Meta objetivo) × 100
Faltante = Meta objetivo − Monto actual
```
Cada aportación incrementa el monto actual. Al llegar al 100%, la meta se celebra con una notificación visual.

### Score de salud financiera
```
Score base: 50 puntos
+ 25 pts si tasa de ahorro > 30%
+ 15 pts si tasa de ahorro > 20%
+  5 pts si tasa de ahorro > 10%
− 15 pts si tasa de ahorro < 0%
+ 10 pts si gastos < 70% de ingresos
− 10 pts si gastos > ingresos
+  5 pts si tiene más de 10 registros
Resultado: clamp(0, score, 100)
```

---

## 📊 Reportes

### Gráficas disponibles

| Tipo | Qué muestra | Cuándo usarla |
|------|-------------|---------------|
| **Barras** | Ingresos vs Gastos mes a mes | Comparar directamente cuánto entra vs cuánto sale |
| **Áreas** | Evolución de ingresos y gastos en el tiempo | Ver tendencias y patrones estacionales |
| **Pastel (Donut)** | Distribución de gastos por categoría | Identificar en qué se va la mayor parte del dinero |

### Filtros
- **Por fecha**: selecciona cualquier rango de fechas
- **Por tipo**: solo ingresos, solo gastos, o ambos
- **Por categoría**: filtra por una categoría específica

### Exportación
Un click para descargar un archivo **CSV** con todos tus movimientos, listo para abrir en Excel, Google Sheets o cualquier herramienta de análisis.

---

## ⚙️ Tecnologías usadas

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| **Frontend** | React 18 + TypeScript | Type safety, ecosistema maduro |
| **Build tool** | Vite 5 | HMR instantáneo, bundle optimizado |
| **Estilos** | TailwindCSS 3 | Utility-first, responsive por defecto |
| **Animaciones** | Framer Motion | Animaciones fluidas tipo app nativa |
| **Estado local** | Zustand + Persist | Simple, ligero, con persistencia |
| **Formularios** | React Hook Form + Zod | Validación robusta y performante |
| **Gráficas** | Recharts | Basado en D3, ligero, declarativo |
| **Backend/DB** | Supabase (PostgreSQL) | BaaS gratuito, auth incluida, API REST automática |
| **Deploy** | Vercel | Zero-config, CDN global, HTTPS automático |

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────┐
│              FlowFin (Vercel)               │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │          Frontend (React)           │   │
│  │                                     │   │
│  │  src/                               │   │
│  │  ├── components/   ← UI reutilizable│   │
│  │  ├── pages/        ← Vistas/rutas   │   │
│  │  ├── store/        ← Estado global  │   │
│  │  ├── contexts/     ← Auth context   │   │
│  │  └── lib/          ← Utilidades     │   │
│  └──────────────┬──────────────────────┘   │
│                 │ API REST                 │
└─────────────────┼──────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│          Supabase (PostgreSQL)              │
│                                             │
│  Tables:                                    │
│  ├── users         ← Usuarios y auth       │
│  └── transactions  ← Movimientos financieros│
│                                             │
│  Local Storage:                             │
│  ├── deudas        ← Tracking de deudas     │
│  └── metas         ← Metas de ahorro        │
└─────────────────────────────────────────────┘
```

### Separación de responsabilidades
- **Frontend**: Toda la lógica de UI, validación, cálculos y presentación
- **Supabase**: Autenticación, persistencia de transacciones y usuarios
- **LocalStorage**: Datos temporales (deudas, metas) para velocidad y offline básico

---

## 📦 Instalación

### Requisitos
- [Node.js](https://nodejs.org/) v18 o superior
- [npm](https://npmjs.com/) v9 o superior
- Cuenta gratuita en [Supabase](https://supabase.com)

### Paso a paso

**1. Clona el repositorio**
```bash
git clone https://github.com/tu-usuario/flowfin.git
cd flowfin
```

**2. Instala dependencias**
```bash
npm install
```

**3. Configura Supabase**
- Crea un proyecto gratuito en [supabase.com](https://supabase.com)
- Ve a **SQL Editor** y ejecuta el siguiente script:

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT NOT NULL,
  category_id TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own data" ON transactions
  FOR ALL USING (auth.uid() = user_id);
```

**4. Configura las credenciales**
Copia las credenciales de tu proyecto Supabase:
- Ve a **Settings → API**
- Copia la **Project URL** y la **anon public key**
- Abre `src/lib/data.ts` y reemplaza las constantes `SUPABASE_URL` y `SUPABASE_ANON_KEY`

**5. Ejecuta en desarrollo**
```bash
npm run dev
```
Abre http://localhost:5173 en tu navegador.

**6. Compila para producción**
```bash
npm run build
npm run preview
```

### Deploy en Vercel
```bash
npm i -g vercel
vercel --prod
```

---

## 🔐 Seguridad

### Autenticación
- Registro y login con contraseñas hasheadas usando **bcrypt** (10 rounds)
- Sesión persistente en el dispositivo del usuario con **Zustand Persist**
- Sin tokens JWT expuestos — la sesión se maneja localmente

### Protección de datos
- **Row Level Security (RLS)** en PostgreSQL: cada usuario solo ve sus propios datos
- Sin datos sensibles expuestos en el frontend
- Las contraseñas nunca se envían en texto plano

### Buenas prácticas
- Validación de formularios con **Zod** en el cliente
- Sanitización de inputs antes de enviar a la base de datos
- Sin dependencias con vulnerabilidades conocidas críticas

---

## 🚧 Roadmap

### Q3 2025
- [ ] **Modo oscuro automático** — detectar preferencia del sistema
- [ ] **Cuentas múltiples** — banco, efectivo, tarjeta, inversión
- [ ] **Transferencias entre cuentas** — mover dinero sin duplicar
- [ ] **Transacciones recurrentes** — suscripciones y pagos automáticos
- [ ] **Backups automáticos** — exportación programada

### Q4 2025
- [ ] **IA financiera avanzada** — predicción de gastos futuros, detección de anomalías
- [ ] **Presupuestos inteligentes** — que se ajusten solos según tu historial
- [ ] **Metas con plazo** — cálculo de cuánto ahorrar por semana/mes para llegar a tiempo
- [ ] **Notificaciones push** — alertas en tiempo real desde el navegador

### Q1 2026
- [ ] **Integración bancaria** — conectar cuentas bancarias reales (open banking)
- [ ] **Sincronización multi-dispositivo** — deudas y metas en la nube
- [ ] **App móvil nativa** — React Native o Capacitor para iOS y Android
- [ ] **Compartir presupuesto** — finanzas familiares o de pareja

### Q2 2026
- [ ] **Inversiones** — seguimiento de portafolio, rendimiento
- [ ] **Escenarios** — "¿qué pasa si reduzco X gasto un 20%?"
- [ ] **Modo coach premium** — recomendaciones personalizadas con IA
- [ ] **API pública** — para desarrolladores y integraciones

---

## 💡 Propuesta de valor

### ¿Por qué FlowFin y no otra app?

| | FlowFin | Otras apps |
|---|---------|------------|
| **Precio** | 100% gratis | $5–15/mes |
| **Conexión bancaria** | No requerida | Obligatoria en muchos casos |
| **Privacidad** | Tus datos, tus reglas | Venden datos de consumo |
| **Complejidad** | 30 segundos para empezar | Horas de configuración |
| **Inteligencia** | Insights automáticos | Solo registra, no analiza |
| **Offline** | Funciona sin internet | Requiere conexión constante |
| **Deudas** | Tracking completo con historial | Básico o inexistente |
| **Metas** | Con aportaciones parciales | Solo el monto final |

### La diferencia FlowFin

> *"Las apps financieras te obligan a conectar tu banco, te cobran suscripción y te muestran gráficas bonitas que no te dicen qué hacer. FlowFin es diferente: no necesita tu banco, es gratis, y te dice exactamente qué está mal con tu dinero y cómo arreglarlo."*

**FlowFin no es un tracker. Es tu coach financiero personal.**

---

## 📄 Licencia

MIT License. Haz lo que quieras con el código.

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Abre un issue o un pull request.

---

**Hecho con ❤️ para que más personas tengan el control de su dinero.**
