import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://ibgmvprphhdtxnlexkgz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliZ212cHJwaGhkdHhubGV4a2d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MzAyMTksImV4cCI6MjA5MTQwNjIxOX0.wDi6SST4rxDSfwNGj9pv4Ks4UD14bQEB4RdC6YMT2Aw'
)

// CATEGORÍAS EMBEBIDAS (funciona sin tabla categories)
export const CATEGORIES = [
  // Gastos
  { id: 'cat_food', name: 'Alimentación', type: 'expense', color: '#EF4444', icon: '🍔' },
  { id: 'cat_transport', name: 'Transporte', type: 'expense', color: '#F59E0B', icon: '🚗' },
  { id: 'cat_home', name: 'Vivienda', type: 'expense', color: '#8B5CF6', icon: '🏠' },
  { id: 'cat_fun', name: 'Entretenimiento', type: 'expense', color: '#EC4899', icon: '🎮' },
  { id: 'cat_health', name: 'Salud', type: 'expense', color: '#10B981', icon: '💊' },
  { id: 'cat_education', name: 'Educación', type: 'expense', color: '#3B82F6', icon: '📚' },
  { id: 'cat_clothes', name: 'Ropa', type: 'expense', color: '#6366F1', icon: '👕' },
  { id: 'cat_services', name: 'Servicios', type: 'expense', color: '#64748B', icon: '⚡' },
  { id: 'cat_subs', name: 'Suscripciones', type: 'expense', color: '#A855F7', icon: '🔄' },
  { id: 'cat_restaurant', name: 'Restaurantes', type: 'expense', color: '#F97316', icon: '☕' },
  { id: 'cat_super', name: 'Supermercado', type: 'expense', color: '#14B8A6', icon: '🛒' },
  { id: 'cat_gas', name: 'Gasolina', type: 'expense', color: '#D97706', icon: '⛽' },
  { id: 'cat_beauty', name: 'Belleza', type: 'expense', color: '#E11D48', icon: '✨' },
  { id: 'cat_gifts', name: 'Regalos', type: 'expense', color: '#7C3AED', icon: '🎁' },
  { id: 'cat_pets', name: 'Mascotas', type: 'expense', color: '#D946EF', icon: '🐾' },
  { id: 'cat_other_exp', name: 'Otros', type: 'expense', color: '#78716C', icon: '📦' },
  // Ingresos
  { id: 'cat_salary', name: 'Salario', type: 'income', color: '#10B981', icon: '💼' },
  { id: 'cat_freelance', name: 'Freelance', type: 'income', color: '#06B6D4', icon: '💻' },
  { id: 'cat_business', name: 'Negocio', type: 'income', color: '#F59E0B', icon: '🏪' },
  { id: 'cat_invest', name: 'Inversiones', type: 'income', color: '#8B5CF6', icon: '📈' },
  { id: 'cat_sales', name: 'Ventas', type: 'income', color: '#D97706', icon: '🏷️' },
  { id: 'cat_other_inc', name: 'Otros', type: 'income', color: '#64748B', icon: '💰' },
]

export function getCategory(id: string) {
  return CATEGORIES.find(c => c.id === id) || { name: 'Sin categoría', color: '#64748B', icon: '📦' }
}

// CONSEJOS INTELIGENTES
export const FINANCIAL_TIPS = [
  { icon: '💡', title: 'Regla 50/30/20', desc: 'Destina 50% a necesidades, 30% a deseos y 20% a ahorro.' },
  { icon: '🎯', title: 'Fondo de emergencia', desc: 'Ahorra al menos 3 meses de gastos básicos.' },
  { icon: '🚫', title: 'Elimina deudas', desc: 'Paga primero las deudas con mayor tasa de interés.' },
  { icon: '📊', title: 'Revisa tus gastos', desc: 'Revisa tus gastos semanalmente para mantenerte al día.' },
  { icon: '💳', title: 'Evita gastos hormiga', desc: 'Los pequeños gastos diarios suman miles al año.' },
  { icon: '🏦', title: 'Ahorra primero', desc: 'Ahorra al recibir tu ingreso, no lo que sobra.' },
  { icon: '📱', title: 'Compara precios', desc: 'Antes de comprar, busca alternativas más económicas.' },
  { icon: '🔄', title: 'Cancela suscripciones', desc: 'Revisa y cancela las suscripciones que no uses.' },
  { icon: '🍳', title: 'Cocina en casa', desc: 'Preparar comida en casa puede ahorrarte hasta 40%.' },
  { icon: '📅', title: 'Presupuesto mensual', desc: 'Planifica tus gastos antes de que llegue el mes.' },
]

// SONIDOS (Web Audio API)
export const sounds = {
  success: () => {
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(523.25, ctx.currentTime)
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3)
    } catch {}
  },
  delete: () => {
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(400, ctx.currentTime)
      osc.frequency.setValueAtTime(300, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2)
    } catch {}
  },
  click: () => {
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(800, ctx.currentTime)
      gain.gain.setValueAtTime(0.05, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.05)
    } catch {}
  },
}

// UTILIDADES
export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

export function formatDate(d: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' }).format(new Date(d))
}

export function formatDateFull(d: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d))
}

export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

// ANÁLISIS INTELIGENTE
export function analyzeFinances(transactions: any[]): {
  score: number; health: string; tips: typeof FINANCIAL_TIPS; savingsRate: number; topCategory: string; avgDaily: number;
} {
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0
  
  // Score calculation
  let score = 50
  if (savingsRate > 30) score += 25
  else if (savingsRate > 20) score += 15
  else if (savingsRate > 10) score += 5
  if (expenses < income * 0.7) score += 15
  else if (expenses < income * 0.9) score += 5
  if (transactions.length > 10) score += 5
  score = Math.min(Math.max(score, 0), 100)

  // Top category
  const catMap: Record<string, number> = {}
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const cat = getCategory(t.category_id || '')
    catMap[cat.name] = (catMap[cat.name] || 0) + t.amount
  })
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

  // Avg daily
  const days = transactions.length > 0 ? Math.max(1, Math.ceil((Date.now() - new Date(transactions[transactions.length - 1].date).getTime()) / 86400000)) : 1
  const avgDaily = expenses / days

  // Health
  const health = score >= 80 ? '🟢 Excelente' : score >= 60 ? '🟡 Buena' : score >= 40 ? '🟠 Regular' : '🔴 Necesita atención'

  // Tips (pick 3 relevant)
  const tips = FINANCIAL_TIPS.sort(() => 0.5 - Math.random()).slice(0, 3)

  return { score, health, tips, savingsRate, topCategory: topCat, avgDaily }
}
