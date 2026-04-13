import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ibgmvprphhdtxnlexkgz.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliZ212cHJwaGhkdHhubGV4a2d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MzAyMTksImV4cCI6MjA5MTQwNjIxOX0.wDi6SST4rxDSfwNGj9pv4Ks4UD14bQEB4RdC6YMT2Aw'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ===== CATEGORÍAS =====
export const CATEGORIES = [
  { id: 'salary', name: 'Salario', type: 'income', icon: 'briefcase', emoji: '💼', color: '#10B981' },
  { id: 'freelance', name: 'Freelance', type: 'income', icon: 'code', emoji: '💻', color: '#06B6D4' },
  { id: 'business', name: 'Negocio', type: 'income', icon: 'shopping-bag', emoji: '🏪', color: '#F59E0B' },
  { id: 'invest', name: 'Inversiones', type: 'income', icon: 'trending-up', emoji: '📈', color: '#8B5CF6' },
  { id: 'sales', name: 'Ventas', type: 'income', icon: 'store', emoji: '🏷️', color: '#D97706' },
  { id: 'other_income', name: 'Otros Ingresos', type: 'income', icon: 'plus-circle', emoji: '💰', color: '#64748B' },
  { id: 'food', name: 'Alimentación', type: 'expense', icon: 'utensils', emoji: '🍔', color: '#EF4444' },
  { id: 'transport', name: 'Transporte', type: 'expense', icon: 'car', emoji: '🚗', color: '#F59E0B' },
  { id: 'home', name: 'Vivienda', type: 'expense', icon: 'home', emoji: '🏠', color: '#8B5CF6' },
  { id: 'fun', name: 'Entretenimiento', type: 'expense', icon: 'gamepad-2', emoji: '🎮', color: '#EC4899' },
  { id: 'health', name: 'Salud', type: 'expense', icon: 'heart', emoji: '💊', color: '#10B981' },
  { id: 'edu', name: 'Educación', type: 'expense', icon: 'graduation-cap', emoji: '📚', color: '#3B82F6' },
  { id: 'clothes', name: 'Ropa', type: 'expense', icon: 'shirt', emoji: '👕', color: '#6366F1' },
  { id: 'services', name: 'Servicios', type: 'expense', icon: 'zap', emoji: '⚡', color: '#64748B' },
  { id: 'subs', name: 'Suscripciones', type: 'expense', icon: 'refresh-cw', emoji: '🔄', color: '#A855F7' },
  { id: 'restaurant', name: 'Restaurantes', type: 'expense', icon: 'coffee', emoji: '☕', color: '#F97316' },
  { id: 'super', name: 'Supermercado', type: 'expense', icon: 'shopping-cart', emoji: '🛒', color: '#14B8A6' },
  { id: 'gas', name: 'Gasolina', type: 'expense', icon: 'fuel', emoji: '⛽', color: '#D97706' },
  { id: 'beauty', name: 'Belleza', type: 'expense', icon: 'sparkles', emoji: '✨', color: '#E11D48' },
  { id: 'gifts', name: 'Regalos', type: 'expense', icon: 'gift', emoji: '🎁', color: '#7C3AED' },
  { id: 'pets', name: 'Mascotas', type: 'expense', icon: 'dog', emoji: '🐾', color: '#D946EF' },
  { id: 'debts_cat', name: 'Deudas', type: 'expense', icon: 'credit-card', emoji: '💳', color: '#DC2626' },
  { id: 'other_expense', name: 'Otros Gastos', type: 'expense', icon: 'ellipsis', emoji: '📦', color: '#78716C' },
]

export function getCat(id: string) {
  return CATEGORIES.find(c => c.id === id) || { id: '', name: 'Sin categoría', type: 'expense', icon: 'tag', emoji: '📦', color: '#64748B' }
}

// ===== FORMATO =====
export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

export function formatDate(d: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' }).format(new Date(d))
}

export function formatDateFull(d: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d))
}

export function cn(...c: (string | boolean | undefined | null)[]) { return c.filter(Boolean).join(' ') }

// ===== COACH FINANCIERO INTELIGENTE =====
export interface FinancialInsight {
  type: 'info' | 'warning' | 'success' | 'alert'
  icon: string
  title: string
  message: string
  action?: string
}

export function getFinancialInsights(txs: any[], budgets: any[] = [], debts: any[] = []): FinancialInsight[] {
  const now = new Date()
  const thisMonth = txs.filter(t => { const d = new Date(t.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() })
  const lastMonth = txs.filter(t => { const d = new Date(t.date); const lm = now.getMonth() === 0 ? 11 : now.getMonth() - 1; const ly = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear(); return d.getMonth() === lm && d.getFullYear() === ly })

  const income = thisMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = thisMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = income - expense
  const savingsRate = income > 0 ? (balance / income) * 100 : 0

  const lastIncome = lastMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const lastExpense = lastMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const insights: FinancialInsight[] = []

  // 1. Balance general
  if (income === 0 && expense === 0 && txs.length === 0) {
    insights.push({ type: 'info', icon: '👋', title: '¡Bienvenido a FlowFin!', message: 'Empieza registrando tu primer ingreso o gasto para que podamos ayudarte a mejorar tus finanzas.' })
    return insights
  }

  // 2. Balance negativo
  if (balance < 0) {
    insights.push({ type: 'alert', icon: '🚨', title: 'Gastos superan ingresos', message: `Este mes gastaste ${formatCurrency(Math.abs(balance))} más de lo que ganaste. Revisa tus gastos y elimina los innecesarios.` })
  }

  // 3. Tasa de ahorro baja
  if (income > 0 && savingsRate < 10 && savingsRate >= 0) {
    const needed = income * 0.2
    insights.push({ type: 'warning', icon: '⚠️', title: 'Ahorro muy bajo', message: `Solo estás ahorrando ${savingsRate.toFixed(0)}% de tus ingresos. Para estar sano, necesitas ahorrar al menos 20%. Intenta reducir ${formatCurrency(needed - balance)} en gastos este mes.` })
  }

  // 4. Buena tasa de ahorro
  if (savingsRate >= 20) {
    insights.push({ type: 'success', icon: '🎉', title: '¡Excelente ahorro!', message: `Estás ahorrando ${savingsRate.toFixed(0)}% de tus ingresos. ¡Vas por buen camino!` })
  }

  // 5. Comparativa con mes anterior
  if (lastExpense > 0) {
    const change = ((expense - lastExpense) / lastExpense) * 100
    if (change > 20) {
      insights.push({ type: 'warning', icon: '📈', title: 'Gastos aumentaron', message: `Tus gastos subieron ${change.toFixed(0)}% vs el mes pasado (${formatCurrency(lastExpense)} → ${formatCurrency(expense)}). ¿Identifica en qué categoría gastaste más?` })
    } else if (change < -10) {
      insights.push({ type: 'success', icon: '📉', title: '¡Reduciste gastos!', message: `Bajaste ${Math.abs(change).toFixed(0)}% vs el mes pasado. ¡Sigue así!` })
    }
  }

  // 6. Categoría dominante
  const catMap: Record<string, number> = {}
  thisMonth.filter(t => t.type === 'expense').forEach(t => { const c = getCat(t.category_id); catMap[c.name] = (catMap[c.name] || 0) + t.amount })
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]
  if (topCat) {
    const pct = expense > 0 ? (topCat[1] / expense) * 100 : 0
    if (pct > 40) {
      const saving = topCat[1] * 0.2
      insights.push({ type: 'warning', icon: '🔍', title: `${topCat[0]} consume mucho`, message: `${topCat[0]} representa ${pct.toFixed(0)}% de tus gastos (${formatCurrency(topCat[1])}). Si reduces un 20%, ahorrarías ${formatCurrency(saving)} este mes.` })
    }
  }

  // 7. Restaurantes + Supermercado alto
  const foodExpense = thisMonth.filter(t => t.type === 'expense' && ['food', 'restaurant', 'super'].includes(t.category_id)).reduce((s, t) => s + t.amount, 0)
  if (foodExpense > income * 0.35 && income > 0) {
    insights.push({ type: 'warning', icon: '🍽️', title: 'Gasto en comida alto', message: `Destinas ${formatCurrency(foodExpense)} a comida (${(foodExpense/income*100).toFixed(0)}% de ingresos). Cocinar en casa podría ahorrarte hasta 40%.` })
  }

  // 8. Suscripciones
  const subsExpense = thisMonth.filter(t => t.type === 'expense' && t.category_id === 'subs').reduce((s, t) => s + t.amount, 0)
  if (subsExpense > 500) {
    insights.push({ type: 'info', icon: '🔄', title: 'Revisa tus suscripciones', message: `Pagas ${formatCurrency(subsExpense)} en suscripciones este mes. ¿Realmente usas todas?` })
  }

  // 9. Deudas
  const totalDebt = debts.filter(d => d.status === 'active').reduce((s, d) => s + (d.total - d.paid), 0)
  if (totalDebt > income && income > 0) {
    insights.push({ type: 'alert', icon: '💳', title: 'Deudas altas', message: `Tienes ${formatCurrency(totalDebt)} en deudas, más de lo que ganas este mes. Prioriza pagar la deuda con mayor interés.` })
  }

  // 10. Presupuesto excedido
  budgets.forEach(b => {
    const catExpense = thisMonth.filter(t => t.type === 'expense' && t.category_id === b.category_id).reduce((s, t) => s + t.amount, 0)
    if (catExpense > b.amount) {
      const cat = getCat(b.category_id)
      insights.push({ type: 'alert', icon: '⛔', title: `Presupuesto excedido: ${cat.name}`, message: `Llevas ${formatCurrency(catExpense)} de ${formatCurrency(b.amount)}. Te pasaste por ${formatCurrency(catExpense - b.amount)}.` })
    } else if (catExpense > b.amount * 0.8) {
      const cat = getCat(b.category_id)
      const remaining = b.amount - catExpense
      insights.push({ type: 'warning', icon: '⏰', title: `Casi agotas: ${cat.name}`, message: `Has usado ${formatCurrency(catExpense)} de ${formatCurrency(b.amount)}. Te quedan ${formatCurrency(remaining)}.` })
    }
  })

  // 11. Sin gastos registrados hace tiempo
  const lastExpenseDate = thisMonth.filter(t => t.type === 'expense').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
  if (lastExpenseDate) {
    const daysSince = Math.floor((now.getTime() - new Date(lastExpenseDate.date).getTime()) / 86400000)
    if (daysSince > 3) {
      insights.push({ type: 'info', icon: '📝', title: 'Registra tus gastos', message: `Tu último gasto fue hace ${daysSince} días. Registra los pendientes para tener un panorama completo.` })
    }
  }

  // 12. Ingreso vs egreso general
  if (income > 0 && expense === 0) {
    insights.push({ type: 'info', icon: '💡', title: 'Solo tienes ingresos', message: 'Registra tus gastos para saber cuánto estás ahorrando realmente.' })
  }

  return insights
}

// ===== HEALTH SCORE =====
export function calcHealthScore(txs: any[], debts: any[] = []): number {
  const now = new Date()
  const m = txs.filter(t => { const d = new Date(t.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() })
  const income = m.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = m.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0
  const totalDebt = debts.filter(d => d.status === 'active').reduce((s, d) => s + (d.total - d.paid), 0)
  const debtRatio = income > 0 ? (totalDebt / income) * 100 : 0

  let score = 50
  if (savingsRate > 30) score += 20; else if (savingsRate > 20) score += 15; else if (savingsRate > 10) score += 5; else if (savingsRate < 0) score -= 15
  if (debtRatio < 30) score += 10; else if (debtRatio < 60) score += 0; else score -= 10
  if (expense < income * 0.7) score += 10; else if (expense > income) score -= 10
  if (txs.length > 10) score += 5; if (txs.length > 50) score += 5
  if (txs.length > 0 && income === 0) score -= 10

  return Math.min(Math.max(score, 0), 100)
}

// ===== SONIDOS =====
export const playSound = (type: 'success' | 'delete' | 'click') => {
  try {
    const ctx = new AudioContext()
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    if (type === 'success') { o.frequency.setValueAtTime(523, ctx.currentTime); o.frequency.setValueAtTime(659, ctx.currentTime + 0.1); g.gain.setValueAtTime(0.08, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25); o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.25) }
    else if (type === 'delete') { o.type = 'sine'; o.frequency.setValueAtTime(400, ctx.currentTime); o.frequency.setValueAtTime(300, ctx.currentTime + 0.1); g.gain.setValueAtTime(0.06, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2); o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.2) }
    else { o.frequency.setValueAtTime(800, ctx.currentTime); g.gain.setValueAtTime(0.03, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04); o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.04) }
  } catch {}
}
