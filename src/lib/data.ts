import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ibgmvprphhdtxnlexkgz.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliZ212cHJwaGhkdHhubGV4a2d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MzAyMTksImV4cCI6MjA5MTQwNjIxOX0.wDi6SST4rxDSfwNGj9pv4Ks4UD14bQEB4RdC6YMT2Aw'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

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

// ===== FORMATO =====
export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

export function formatDate(d: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' }).format(new Date(d))
}

export function cn(...c: (string | boolean | undefined | null)[]) { return c.filter(Boolean).join(' ') }

// ===== SONIDOS =====
export const playSound = (type: 'success' | 'delete' | 'click') => {
  try {
    const ctx = new AudioContext()
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    if (type === 'success') {
      o.frequency.setValueAtTime(523, ctx.currentTime); o.frequency.setValueAtTime(659, ctx.currentTime + 0.1)
      g.gain.setValueAtTime(0.08, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.25)
    } else if (type === 'delete') {
      o.type = 'sine'; o.frequency.setValueAtTime(400, ctx.currentTime); o.frequency.setValueAtTime(300, ctx.currentTime + 0.1)
      g.gain.setValueAtTime(0.06, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.2)
    } else {
      o.frequency.setValueAtTime(800, ctx.currentTime)
      g.gain.setValueAtTime(0.03, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.04)
    }
  } catch {}
}

// ===== HEALTH SCORE =====
export function calcScore(txs: any[]): number {
  const now = new Date()
  const m = txs.filter(t => { const d = new Date(t.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() })
  const income = m.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = m.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const rate = income > 0 ? ((income - expense) / income) * 100 : 0
  let score = 50
  if (rate > 30) score += 25; else if (rate > 20) score += 15; else if (rate > 10) score += 5; else if (rate < 0) score -= 15
  if (expense < income * 0.7) score += 10; else if (expense > income) score -= 10
  if (txs.length > 10) score += 5
  return Math.min(Math.max(score, 0), 100)
}

// ===== COACH FINANCIERO =====
export interface Insight { type: 'info' | 'warning' | 'success' | 'alert'; emoji: string; title: string; message: string }

export function getInsights(txs: any[]): Insight[] {
  const now = new Date()
  const m = txs.filter(t => { const d = new Date(t.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() })
  const income = m.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = m.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = income - expense
  const rate = income > 0 ? (balance / income) * 100 : 0

  const insights: Insight[] = []
  if (txs.length === 0) {
    insights.push({ type: 'info', emoji: '👋', title: '¡Bienvenido!', message: 'Registra tu primer ingreso o gasto para comenzar a mejorar tus finanzas.' })
    return insights
  }
  if (balance < 0) insights.push({ type: 'alert', emoji: '🚨', title: 'Gastas más de lo que ganas', message: `Este mes gastaste ${formatCurrency(Math.abs(balance))} de más. Elimina gastos innecesarios.` })
  if (income > 0 && rate < 10 && rate >= 0) insights.push({ type: 'warning', emoji: '⚠️', title: 'Ahorro muy bajo', message: `Solo ahorras ${rate.toFixed(0)}%. Necesitas al menos 20%.` })
  if (rate >= 20) insights.push({ type: 'success', emoji: '🎉', title: '¡Excelente ahorro!', message: `Ahorras ${rate.toFixed(0)}% de tus ingresos. ¡Sigue así!` })

  const catMap: Record<string, number> = {}
  m.filter(t => t.type === 'expense').forEach(t => { const c = getCat(t.category_id); catMap[c.name] = (catMap[c.name] || 0) + t.amount })
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]
  if (topCat) {
    const pct = expense > 0 ? (topCat[1] / expense) * 100 : 0
    if (pct > 40) insights.push({ type: 'warning', emoji: '🔍', title: `${topCat[0]} consume mucho`, message: `${topCat[0]} es ${pct.toFixed(0)}% de tus gastos. Reducirlo 20% te ahorraría ${formatCurrency(topCat[1] * 0.2)}.` })
  }

  const foodExp = m.filter(t => t.type === 'expense' && ['food', 'restaurant', 'super'].includes(t.category_id || '')).reduce((s, t) => s + t.amount, 0)
  if (foodExp > income * 0.35 && income > 0) insights.push({ type: 'warning', emoji: '🍽️', title: 'Gasto en comida alto', message: `Destinas ${formatCurrency(foodExp)} a comida. Cocinar en casa ahorra hasta 40%.` })

  return insights
}
