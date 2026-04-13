import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ibgmvprphhdtxnlexkgz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliZ212cHJwaGhkdHhubGV4a2d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MzAyMTksImV4cCI6MjA5MTQwNjIxOX0.wDi6SST4rxDSfwNGj9pv4Ks4UD14bQEB4RdC6YMT2Aw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ===== CATEGORÍAS EMBEBIDAS (fallback) =====
export const DEFAULT_CATS = {
  income: [
    { id: 'salary', name: 'Salario', icon: 'briefcase', color: '#10B981' },
    { id: 'freelance', name: 'Freelance', icon: 'code', color: '#06B6D4' },
    { id: 'business', name: 'Negocio', icon: 'shopping-bag', color: '#F59E0B' },
    { id: 'invest', name: 'Inversiones', icon: 'trending-up', color: '#8B5CF6' },
    { id: 'sales', name: 'Ventas', icon: 'store', color: '#D97706' },
    { id: 'other_income', name: 'Otros Ingresos', icon: 'plus-circle', color: '#64748B' },
  ],
  expense: [
    { id: 'food', name: 'Alimentación', icon: 'utensils', color: '#EF4444' },
    { id: 'transport', name: 'Transporte', icon: 'car', color: '#F59E0B' },
    { id: 'home', name: 'Vivienda', icon: 'home', color: '#8B5CF6' },
    { id: 'fun', name: 'Entretenimiento', icon: 'gamepad-2', color: '#EC4899' },
    { id: 'health', name: 'Salud', icon: 'heart', color: '#10B981' },
    { id: 'edu', name: 'Educación', icon: 'graduation-cap', color: '#3B82F6' },
    { id: 'clothes', name: 'Ropa', icon: 'shirt', color: '#6366F1' },
    { id: 'services', name: 'Servicios', icon: 'zap', color: '#64748B' },
    { id: 'subs', name: 'Suscripciones', icon: 'refresh-cw', color: '#A855F7' },
    { id: 'restaurant', name: 'Restaurantes', icon: 'coffee', color: '#F97316' },
    { id: 'super', name: 'Supermercado', icon: 'shopping-cart', color: '#14B8A6' },
    { id: 'gas', name: 'Gasolina', icon: 'fuel', color: '#D97706' },
    { id: 'beauty', name: 'Belleza', icon: 'sparkles', color: '#E11D48' },
    { id: 'gifts', name: 'Regalos', icon: 'gift', color: '#7C3AED' },
    { id: 'debts', name: 'Deudas', icon: 'credit-card', color: '#DC2626' },
    { id: 'other_expense', name: 'Otros Gastos', icon: 'ellipsis', color: '#78716C' },
  ],
}

// Icon map (lucide icon names → emojis for display)
export const ICON_MAP: Record<string, string> = {
  briefcase: '💼', code: '💻', 'shopping-bag': '🏪', 'trending-up': '📈',
  store: '🏷️', 'plus-circle': '➕', utensils: '🍔', car: '🚗',
  home: '🏠', 'gamepad-2': '🎮', heart: '❤️', 'graduation-cap': '🎓',
  shirt: '👕', zap: '⚡', 'refresh-cw': '🔄', coffee: '☕',
  'shopping-cart': '🛒', fuel: '⛽', sparkles: '✨', gift: '🎁',
  'credit-card': '💳', ellipsis: '📦', wallet: '💰', target: '🎯',
  piggy: '🐷', trophy: '🏆', calendar: '📅', bell: '🔔',
  download: '📥', settings: '⚙️', logOut: '🚪', user: '👤',
}

export function getCat(id: string) {
  const all = [...DEFAULT_CATS.income, ...DEFAULT_CATS.expense]
  return all.find(c => c.id === id) || { name: 'Sin categoría', icon: 'tag', color: '#64748B' }
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

export function formatDate(d: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' }).format(new Date(d))
}

export function formatDateFull(d: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d))
}

export function cn(...c: (string | boolean | undefined | null)[]) { return c.filter(Boolean).join(' ') }

// Sound effects
export const playSound = (type: 'success' | 'delete' | 'click' | 'achieve') => {
  try {
    const ctx = new AudioContext()
    if (type === 'success') {
      [523.25, 659.25, 783.99].forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.frequency.setValueAtTime(f, ctx.currentTime + i * 0.1)
        g.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.1)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.15)
        o.start(ctx.currentTime + i * 0.1); o.stop(ctx.currentTime + i * 0.1 + 0.15)
      })
    } else if (type === 'delete') {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination); o.type = 'sine'
      o.frequency.setValueAtTime(400, ctx.currentTime); o.frequency.setValueAtTime(300, ctx.currentTime + 0.1)
      g.gain.setValueAtTime(0.06, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.2)
    } else if (type === 'click') {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.setValueAtTime(800, ctx.currentTime)
      g.gain.setValueAtTime(0.03, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.04)
    } else if (type === 'achieve') {
      [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.frequency.setValueAtTime(f, ctx.currentTime + i * 0.12)
        g.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.12)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.25)
        o.start(ctx.currentTime + i * 0.12); o.stop(ctx.currentTime + i * 0.12 + 0.25)
      })
    }
  } catch {}
}

// Financial analysis
export function analyzeFinances(txs: any[]) {
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0

  let score = 50
  if (savingsRate > 30) score += 25; else if (savingsRate > 20) score += 15; else if (savingsRate > 10) score += 5
  if (expense < income * 0.7) score += 15; else if (expense < income * 0.9) score += 5
  if (txs.length > 10) score += 5; if (txs.length > 50) score += 5
  score = Math.min(Math.max(score, 0), 100)

  const catMap: Record<string, number> = {}
  txs.filter(t => t.type === 'expense').forEach(t => { const c = getCat(t.category_id || ''); catMap[c.name] = (catMap[c.name] || 0) + t.amount })
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
  const days = txs.length > 0 ? Math.max(1, Math.ceil((Date.now() - new Date(txs[txs.length - 1].date).getTime()) / 86400000)) : 1
  const avgDaily = expense / days
  const healthLabel = score >= 80 ? '🟢 Excelente' : score >= 60 ? '🟡 Buena' : score >= 40 ? '🟠 Regular' : '🔴 Atención'

  return { score, healthLabel, savingsRate, topCat, avgDaily, income, expense, balance: income - expense }
}
