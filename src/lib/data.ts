import { createClient } from '@supabase/supabase-js'
import type { Category } from '@/types'

// Supabase config - loaded from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase configuration. Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  )
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})

// ===== MONEDAS =====
export const CURRENCIES: Record<string, { symbol: string; code: string; locale: string }> = {
  MXN: { symbol: '$', code: 'MXN', locale: 'es-MX' },
  USD: { symbol: '$', code: 'USD', locale: 'en-US' },
  EUR: { symbol: '€', code: 'EUR', locale: 'es-ES' },
  COP: { symbol: '$', code: 'COP', locale: 'es-CO' },
  PEN: { symbol: 'S/', code: 'PEN', locale: 'es-PE' },
  CLP: { symbol: '$', code: 'CLP', locale: 'es-CL' },
  ARS: { symbol: '$', code: 'ARS', locale: 'es-AR' },
  BRL: { symbol: 'R$', code: 'BRL', locale: 'pt-BR' },
}

export function formatCurrency(n: number, currency = 'MXN'): string {
  const c = CURRENCIES[currency] || CURRENCIES.MXN
  return new Intl.NumberFormat(c.locale, { style: 'currency', currency: c.code, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

export function formatDate(d: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' }).format(new Date(d))
}

export function formatDateFull(d: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d))
}

export function cn(...c: (string | boolean | undefined | null)[]) { return c.filter(Boolean).join(' ') }

// ===== CATEGORÍAS =====
export const CATS = [
  { id: 'food', name: 'Comida', emoji: '🍔', color: '#EF4444' },
  { id: 'transport', name: 'Transporte', emoji: '🚗', color: '#F59E0B' },
  { id: 'home', name: 'Vivienda', emoji: '🏠', color: '#8B5CF6' },
  { id: 'fun', name: 'Ocio', emoji: '🎮', color: '#EC4899' },
  { id: 'health', name: 'Salud', emoji: '💊', color: '#10B981' },
  { id: 'edu', name: 'Educación', emoji: '📚', color: '#3B82F6' },
  { id: 'clothes', name: 'Ropa', emoji: '👕', color: '#6366F1' },
  { id: 'services', name: 'Servicios', emoji: '⚡', color: '#64748B' },
  { id: 'subs', name: 'Suscripciones', emoji: '🔄', color: '#A855F7' },
  { id: 'restaurant', name: 'Restaurantes', emoji: '☕', color: '#F97316' },
  { id: 'super', name: 'Supermercado', emoji: '🛒', color: '#14B8A6' },
  { id: 'gas', name: 'Gasolina', emoji: '⛽', color: '#D97706' },
  { id: 'beauty', name: 'Belleza', emoji: '✨', color: '#E11D48' },
  { id: 'gifts', name: 'Regalos', emoji: '🎁', color: '#7C3AED' },
  { id: 'pets', name: 'Mascotas', emoji: '🐾', color: '#D946EF' },
  { id: 'other_expense', name: 'Otros Gastos', emoji: '📦', color: '#78716C' },
  { id: 'salary', name: 'Salario', emoji: '💼', color: '#10B981' },
  { id: 'freelance', name: 'Freelance', emoji: '💻', color: '#06B6D4' },
  { id: 'business', name: 'Negocio', emoji: '🏪', color: '#F59E0B' },
  { id: 'invest', name: 'Inversiones', emoji: '📈', color: '#8B5CF6' },
  { id: 'sales', name: 'Ventas', emoji: '🏷️', color: '#D97706' },
  { id: 'other_income', name: 'Otros Ingresos', emoji: '💰', color: '#64748B' },
]

export function getCat(id?: string) {
  return CATS.find(c => c.id === id) || { id: '', name: 'Sin categoría', emoji: '📦', color: '#64748B' }
}

// ===== SCORE FINANCIERO REAL =====
export function calcScore(txs: any[], debts: any[] = [], monthlyIncome?: number): number {
  const now = new Date()
  const m = txs.filter(t => { const d = new Date(t.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() })
  const income = m.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = m.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0
  const totalDebt = debts.filter(d => d.status === 'active').reduce((s, d) => s + (d.total_amount - d.paid_amount), 0)
  const debtRatio = income > 0 ? (totalDebt / income) * 100 : 0

  // Tendencia: comparar con mes anterior
  const pm = now.getMonth() === 0 ? 11 : now.getMonth() - 1
  const py = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  const lastMonth = txs.filter(t => { const d = new Date(t.date); return d.getMonth() === pm && d.getFullYear() === py })
  const lastExpense = lastMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const trend = lastExpense > 0 ? ((expense - lastExpense) / lastExpense) * 100 : 0

  let score = 50
  // Tasa de ahorro (hasta +25)
  if (savingsRate > 30) score += 25
  else if (savingsRate > 20) score += 15
  else if (savingsRate > 10) score += 5
  else if (savingsRate < 0) score -= 15
  // Ratio gasto/ingreso (hasta +10)
  if (income > 0 && expense < income * 0.7) score += 10
  else if (income > 0 && expense > income) score -= 10
  // Deuda/ingreso (hasta +10)
  if (debtRatio < 30) score += 10
  else if (debtRatio < 60) score += 0
  else if (debtRatio < 100) score -= 10
  else score -= 20
  // Tendencia mensual (hasta +5)
  if (trend < -10) score += 5
  else if (trend > 20) score -= 10
  // Consistencia de registro (hasta +5)
  if (txs.length > 10) score += 3
  if (txs.length > 50) score += 2

  return Math.min(Math.max(score, 0), 100)
}

// ===== COACH FINANCIERO INTELIGENTE =====
export interface Insight {
  type: 'info' | 'warning' | 'success' | 'alert'
  emoji: string
  title: string
  message: string
}

export function getInsights(txs: any[], debts: any[] = [], budgets: any[] = [], currency = 'MXN'): Insight[] {
  const now = new Date()
  const m = txs.filter(t => { const d = new Date(t.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() })
  const income = m.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = m.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = income - expense
  const savingsRate = income > 0 ? (balance / income) * 100 : 0
  const totalDebt = debts.filter(d => d.status === 'active').reduce((s, d) => s + (d.total_amount - d.paid_amount), 0)

  // Tendencia mensual
  const pm = now.getMonth() === 0 ? 11 : now.getMonth() - 1
  const py = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  const lastMonth = txs.filter(t => { const d = new Date(t.date); return d.getMonth() === pm && d.getFullYear() === py })
  const lastExpense = lastMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const insights: Insight[] = []

  if (txs.length === 0) {
    insights.push({ type: 'info', emoji: '👋', title: '¡Bienvenido a FlowFin!', message: 'Registra tu primer ingreso o gasto para que podamos ayudarte a mejorar tus finanzas.' })
    return insights
  }

  // 1. Balance negativo
  if (balance < 0) {
    insights.push({ type: 'alert', emoji: '🚨', title: 'Vas a cerrar el mes en negativo', message: `Has gastado ${formatCurrency(Math.abs(balance))} más de lo que ganaste. Si sigues así, terminarás el mes en números rojos.` })
  }

  // 2. Ahorro bajo
  if (income > 0 && savingsRate < 10 && savingsRate >= 0) {
    const needed = income * 0.2
    insights.push({ type: 'warning', emoji: '⚠️', title: 'Tu ahorro está muy bajo', message: `Solo ahorras ${savingsRate.toFixed(0)}% de tus ingresos. Necesitas al menos 20%. Intenta reducir ${formatCurrency(Math.max(0, needed - balance), currency)} en gastos.` })
  }

  // 3. Buen ahorro
  if (savingsRate >= 20) {
    insights.push({ type: 'success', emoji: '🎉', title: '¡Excelente tasa de ahorro!', message: `Estás ahorrando ${savingsRate.toFixed(0)}% de tus ingresos. ¡Vas por muy buen camino!` })
  }

  // 4. Gastos crecientes
  if (lastExpense > 0) {
    const change = ((expense - lastExpense) / lastExpense) * 100
    if (change > 20) {
      insights.push({ type: 'warning', emoji: '📈', title: 'Tus gastos están subiendo', message: `Gastaste ${change.toFixed(0)}% más que el mes pasado (${formatCurrency(lastExpense, currency)} → ${formatCurrency(expense, currency)}). Identifica en qué categoría estás gastando más.` })
    } else if (change < -10) {
      insights.push({ type: 'success', emoji: '📉', title: '¡Reduciste gastos!', message: `Bajaste ${Math.abs(change).toFixed(0)}% vs el mes pasado. ¡Excelente control financiero!` })
    }
  }

  // 5. Categoría dominante
  const catMap: Record<string, number> = {}
  m.filter(t => t.type === 'expense').forEach(t => { const c = getCat(t.category_id); catMap[c.name] = (catMap[c.name] || 0) + t.amount })
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]
  if (topCat) {
    const pct = expense > 0 ? (topCat[1] / expense) * 100 : 0
    if (pct > 40) {
      const saving = topCat[1] * 0.2
      insights.push({ type: 'warning', emoji: '🔍', title: `${topCat[0]} consume demasiado`, message: `${topCat[0]} representa el ${pct.toFixed(0)}% de tus gastos (${formatCurrency(topCat[1], currency)}). Si reduces un 20%, ahorrarías ${formatCurrency(saving, currency)} este mes.` })
    }
  }

  // 6. Comida alta
  const foodExpense = m.filter(t => t.type === 'expense' && ['food', 'restaurant', 'super'].includes(t.category_id || '')).reduce((s, t) => s + t.amount, 0)
  if (foodExpense > income * 0.35 && income > 0) {
    insights.push({ type: 'warning', emoji: '🍽️', title: 'Gasto en alimentación muy alto', message: `Destinas ${formatCurrency(foodExpense, currency)} a comida (${(foodExpense/income*100).toFixed(0)}% de ingresos). Cocinar en casa podría ahorrarte hasta 40%.` })
  }

  // 7. Suscripciones
  const subsExpense = m.filter(t => t.type === 'expense' && t.category_id === 'subs').reduce((s, t) => s + t.amount, 0)
  if (subsExpense > 500) {
    insights.push({ type: 'info', emoji: '🔄', title: 'Revisa tus suscripciones', message: `Pagas ${formatCurrency(subsExpense, currency)} en suscripciones este mes. ¿Realmente usas todas?` })
  }

  // 8. Deudas altas
  if (totalDebt > income && income > 0) {
    insights.push({ type: 'alert', emoji: '💳', title: 'Tu nivel de deuda es preocupante', message: `Tienes ${formatCurrency(totalDebt, currency)} en deudas activas, más de lo que ganas este mes. Prioriza pagar la deuda con mayor tasa de interés.` })
  }

  // 9. Deudas con interés alto
  const highInterestDebt = debts.filter(d => d.status === 'active' && d.interest_rate > 20)
  if (highInterestDebt.length > 0) {
    insights.push({ type: 'alert', emoji: '🔥', title: 'Tienes deudas con interés alto', message: `${highInterestDebt.length} deuda(s) con más del 20% de interés. Cada día que pasa, crecen. Paga primero estas.` })
  }

  // 10. Presupuestos excedidos
  budgets.forEach(b => {
    const catExpense = m.filter(t => t.type === 'expense' && t.category_id === b.category_id).reduce((s, t) => s + t.amount, 0)
    if (catExpense > b.amount) {
      const cat = getCat(b.category_id)
      insights.push({ type: 'alert', emoji: '⛔', title: `Presupuesto excedido: ${cat.name}`, message: `Llevas ${formatCurrency(catExpense, currency)} de ${formatCurrency(b.amount, currency)}. Te pasaste por ${formatCurrency(catExpense - b.amount, currency)}.` })
    } else if (catExpense > b.amount * 0.8) {
      const cat = getCat(b.category_id)
      const remaining = b.amount - catExpense
      insights.push({ type: 'warning', emoji: '⏰', title: `Casi agotas: ${cat.name}`, message: `Has usado ${formatCurrency(catExpense, currency)} de ${formatCurrency(b.amount, currency)}. Te quedan solo ${formatCurrency(remaining, currency)}.` })
    }
  })

  // 11. Sin registros recientes
  const lastTx = m.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
  if (lastTx) {
    const daysSince = Math.floor((now.getTime() - new Date(lastTx.date).getTime()) / 86400000)
    if (daysSince > 3) {
      insights.push({ type: 'info', emoji: '📝', title: 'Tienes movimientos sin registrar', message: `Tu último registro fue hace ${daysSince} días. Anota los pendientes para tener un panorama real.` })
    }
  }

  // 12. Proyección de fin de mes
  if (income > 0 && expense > 0) {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const daysElapsed = now.getDate()
    const dailyAvg = expense / Math.max(1, daysElapsed)
    const projectedExpense = dailyAvg * daysInMonth
    if (projectedExpense > income) {
      const dailyLimit = Math.max(0, (income - expense) / Math.max(1, daysInMonth - daysElapsed))
      insights.push({ type: 'alert', emoji: '📊', title: 'Proyección: cerrarás en negativo', message: `Al ritmo actual, gastarás ${formatCurrency(projectedExpense, currency)} este mes. Para no pasarte, limita tus gastos a ${formatCurrency(dailyLimit, currency)} por día de aquí al final del mes.` })
    }
  }

  return insights
}

// ===== SONIDOS (AudioContext reutilizado) =====
let _audioCtx: AudioContext | null = null
function getAudioCtx(): AudioContext {
  if (!_audioCtx) _audioCtx = new AudioContext()
  return _audioCtx
}

export const playSound = (type: 'success' | 'delete' | 'click') => {
  import('./sounds').then(m => m.playSound(type))
}
