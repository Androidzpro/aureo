import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://ibgmvprphhdtxnlexkgz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliZ212cHJwaGhkdHhubGV4a2d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MzAyMTksImV4cCI6MjA5MTQwNjIxOX0.wDi6SST4rxDSfwNGj9pv4Ks4UD14bQEB4RdC6YMT2Aw'
)

// ===== CATEGORÍAS CON EMOJIS =====
export const CATS = {
  expenses: [
    { id: 'food', name: 'Comida', icon: '🍔', color: '#EF4444' },
    { id: 'transport', name: 'Transporte', icon: '🚗', color: '#F59E0B' },
    { id: 'home', name: 'Vivienda', icon: '🏠', color: '#8B5CF6' },
    { id: 'fun', name: 'Entretenimiento', icon: '🎮', color: '#EC4899' },
    { id: 'health', name: 'Salud', icon: '💊', color: '#10B981' },
    { id: 'edu', name: 'Educación', icon: '📚', color: '#3B82F6' },
    { id: 'clothes', name: 'Ropa', icon: '👕', color: '#6366F1' },
    { id: 'services', name: 'Servicios', icon: '⚡', color: '#64748B' },
    { id: 'subs', name: 'Suscripciones', icon: '🔄', color: '#A855F7' },
    { id: 'restaurant', name: 'Restaurantes', icon: '☕', color: '#F97316' },
    { id: 'super', name: 'Supermercado', icon: '🛒', color: '#14B8A6' },
    { id: 'gas', name: 'Gasolina', icon: '⛽', color: '#D97706' },
    { id: 'beauty', name: 'Belleza', icon: '✨', color: '#E11D48' },
    { id: 'gifts', name: 'Regalos', icon: '🎁', color: '#7C3AED' },
    { id: 'pets', name: 'Mascotas', icon: '🐾', color: '#D946EF' },
    { id: 'debts', name: 'Deudas', icon: '💳', color: '#DC2626' },
    { id: 'other_exp', name: 'Otros', icon: '📦', color: '#78716C' },
  ],
  incomes: [
    { id: 'salary', name: 'Salario', icon: '💼', color: '#10B981' },
    { id: 'freelance', name: 'Freelance', icon: '💻', color: '#06B6D4' },
    { id: 'business', name: 'Negocio', icon: '🏪', color: '#F59E0B' },
    { id: 'invest', name: 'Inversiones', icon: '📈', color: '#8B5CF6' },
    { id: 'sales', name: 'Ventas', icon: '🏷️', color: '#D97706' },
    { id: 'other_inc', name: 'Otros', icon: '💰', color: '#64748B' },
  ],
}

export function getCat(id: string) {
  const all = [...CATS.expenses, ...CATS.incomes]
  return all.find(c => c.id === id) || { name: 'Sin categoría', icon: '📦', color: '#64748B' }
}

// ===== TIPS INTELIGENTES =====
export const TIPS = [
  { icon: '💡', title: 'Regla 50/30/20', desc: '50% necesidades, 30% deseos, 20% ahorro.' },
  { icon: '🎯', title: 'Fondo de emergencia', desc: 'Ahorra 3-6 meses de gastos básicos.' },
  { icon: '🚫', title: 'Elimina deudas caras', desc: 'Paga primero las deudas con mayor interés.' },
  { icon: '📊', title: 'Revisa semanalmente', desc: '5 min semanales te ahorran miles al año.' },
  { icon: '💸', title: 'Gastos hormiga', desc: 'Un café diario de $50 = $18,250 al año.' },
  { icon: '🏦', title: 'Ahorra primero', desc: 'Separa el ahorro al recibir, no al final.' },
  { icon: '🔄', title: 'Cancela lo que no usas', desc: 'Revisa suscripciones mensuales.' },
  { icon: '🍳', title: 'Cocina en casa', desc: 'Ahorra hasta 40% vs comer fuera.' },
  { icon: '📅', title: 'Presupuesto mensual', desc: 'Planifica antes de que llegue el mes.' },
  { icon: '🎓', title: 'Educa tu dinero', desc: 'Aprende sobre inversiones cada mes.' },
  { icon: '🏆', title: 'Celebra logros', desc: 'Cada deuda pagada es una victoria.' },
  { icon: '📱', title: 'Compara antes de comprar', desc: 'Busca alternativas más baratas.' },
]

// ===== SONIDOS (Web Audio API) =====
export const playSound = (type: 'success' | 'delete' | 'click' | 'achieve') => {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    
    if (type === 'success') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime)
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1)
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2)
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4)
    } else if (type === 'delete') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(400, ctx.currentTime)
      osc.frequency.setValueAtTime(300, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2)
    } else if (type === 'click') {
      osc.frequency.setValueAtTime(800, ctx.currentTime)
      gain.gain.setValueAtTime(0.04, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.05)
    } else if (type === 'achieve') {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15)
        g.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.15)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.3)
        o.start(ctx.currentTime + i * 0.15); o.stop(ctx.currentTime + i * 0.15 + 0.3)
      })
    }
  } catch {}
}

// ===== UTILIDADES =====
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

// ===== ANÁLISIS FINANCIERO INTELIGENTE =====
export function analyzeFinances(txs: any[]) {
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0
  
  let score = 50
  if (savingsRate > 30) score += 25
  else if (savingsRate > 20) score += 15
  else if (savingsRate > 10) score += 5
  if (expense < income * 0.7) score += 15
  else if (expense < income * 0.9) score += 5
  if (txs.length > 10) score += 5
  if (txs.length > 50) score += 5
  score = Math.min(Math.max(score, 0), 100)

  const catMap: Record<string, number> = {}
  txs.filter(t => t.type === 'expense').forEach(t => {
    const c = getCat(t.category_id || '')
    catMap[c.name] = (catMap[c.name] || 0) + t.amount
  })
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
  const days = txs.length > 0 ? Math.max(1, Math.ceil((Date.now() - new Date(txs[txs.length - 1].date).getTime()) / 86400000)) : 1
  const avgDaily = expense / days

  const healthLabel = score >= 80 ? '🟢 Excelente' : score >= 60 ? '🟡 Buena' : score >= 40 ? '🟠 Regular' : '🔴 Atención'
  
  const relevantTips = TIPS.sort(() => 0.5 - Math.random()).slice(0, 3)

  return { score, healthLabel, relevantTips, savingsRate, topCat, avgDaily, income, expense, balance: income - expense }
}

// ===== LOGROS =====
export const ACHIEVEMENTS = [
  { id: 'first_tx', icon: '🎉', title: 'Primer paso', desc: 'Registra tu primer movimiento', check: (txs: any[]) => txs.length >= 1 },
  { id: 'ten_tx', icon: '🔟', title: 'Constante', desc: 'Registra 10 movimientos', check: (txs: any[]) => txs.length >= 10 },
  { id: 'fifty_tx', icon: '📊', title: 'Organizado', desc: 'Registra 50 movimientos', check: (txs: any[]) => txs.length >= 50 },
  { id: 'saver', icon: '💚', title: 'Ahorrador', desc: 'Ahorra más del 20% este mes', check: (txs: any[]) => {
    const now = new Date(); const m = txs.filter(t => { const d = new Date(t.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() })
    const inc = m.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const exp = m.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return inc > 0 && (inc - exp) / inc > 0.2
  }},
  { id: 'no_spend', icon: '🏅', title: 'Día sin gastos', desc: 'Un día sin ningún gasto', check: (txs: any[]) => {
    const today = new Date().toDateString()
    return !txs.some(t => t.type === 'expense' && new Date(t.date).toDateString() === today)
  }},
  { id: 'diversified', icon: '🌈', title: 'Diversificado', desc: 'Usa 5+ categorías diferentes', check: (txs: any[]) => new Set(txs.map(t => t.category_id)).size >= 5 },
]

export function checkAchievements(txs: any[]): typeof ACHIEVEMENTS {
  return ACHIEVEMENTS.filter(a => a.check(txs))
}
