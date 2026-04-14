import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { X, ArrowUpRight, ArrowDownRight, Plus, Search, Pencil, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/data'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, getCat, playSound } from '@/lib/data'
import { ConfirmDialog, EmptyState } from '@/components/UI'
import type { Transaction } from '@/types'

export default function TransactionsPage() {
  const [searchParams] = useSearchParams()
  const { profile } = useAuthStore()
  const [txs, setTxs] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(searchParams.get('add') === 'true')
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [form, setForm] = useState({ description: '', amount: '', type: 'expense' as string, category_id: '', date: new Date().toISOString().split('T')[0] })
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [smartMessage, setSmartMessage] = useState('')

  useEffect(() => { load() }, [profile?.id])
  useEffect(() => { if (searchParams.get('add') === 'true') setShowAdd(true) }, [searchParams])

  const load = async () => {
    if (!profile?.id) return
    const { data } = await supabase.from('transactions').select('*').eq('user_id', profile.id).order('date', { ascending: false })
    if (data) setTxs(data)
    setLoading(false)
  }

  const generateSmartFeedback = (tx: { type: string; amount: number; category_id: string; description: string }): string => {
    const now = new Date()
    const thisMonth = txs.filter(t => { const d = new Date(t.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() })
    if (tx.type === 'expense') {
      const monthExpenses = thisMonth.filter(t => t.type === 'expense')
      const avg = monthExpenses.length > 0 ? monthExpenses.reduce((s, t) => s + t.amount, 0) / monthExpenses.length : 0
      const cat = getCat(tx.category_id ?? undefined)
      if (avg > 0 && tx.amount > avg * 2) return `⚠️ Este gasto (${formatCurrency(tx.amount, profile?.currency)} ${cat.emoji}) es el doble de tu promedio. ¿Es necesario?`
      if (tx.amount < 100) return `✅ Pequeño gasto registrado. Hasta las compras chicas suman, ¡bien por anotarlas!`
      return `✅ Gasto de ${formatCurrency(tx.amount, profile?.currency)} ${cat.emoji} registrado.`
    }
    const monthIncomes = thisMonth.filter(t => t.type === 'income')
    if (monthIncomes.length === 0) return `💰 ¡Primer ingreso del mes! Excelente que lo registras.`
    return `✅ Ingreso registrado. ¡Sigue así!`
  }

  const filtered = useMemo(() => txs.filter(t => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false
    if (search) {
      const c = getCat(t.category_id ?? undefined)
      return t.description.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase())
    }
    return true
  }), [txs, search, typeFilter])

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {}
    filtered.forEach(t => {
      const d = new Date(t.date)
      const key = d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
      ;(map[key] = map[key] || []).push(t)
    })
    return map
  }, [filtered])

  const openAdd = useCallback(() => {
    setForm({ description: '', amount: '', type: 'expense', category_id: '', date: new Date().toISOString().split('T')[0] })
    setEditing(null)
    setShowAdd(true)
  }, [])

  const openEdit = useCallback((tx: any) => {
    setForm({ description: tx.description, amount: String(tx.amount), type: tx.type, category_id: tx.category_id || '', date: tx.date })
    setEditing(tx)
    setShowAdd(true)
  }, [])

  const saveTx = async () => {
    if (!profile?.id || !form.amount || !form.description || !form.category_id) return
    const amount = parseFloat(form.amount)
    if (amount <= 0) return
    setSaving(true)
    try {
      if (editing) {
        await supabase.from('transactions').update({ type: form.type, amount, description: form.description, category_id: form.category_id, date: new Date(form.date).toISOString() }).eq('id', editing.id)
      } else {
        await supabase.from('transactions').insert([{ user_id: profile.id, type: form.type, amount, description: form.description, category_id: form.category_id, date: new Date(form.date).toISOString() }])
      }
      playSound('success')
      const msg = generateSmartFeedback({ type: form.type, amount, category_id: form.category_id, description: form.description })
      setSmartMessage(msg)
      setSaving(false)
      setShowAdd(false)
      setEditing(null)
      setForm({ description: '', amount: '', type: 'expense', category_id: '', date: new Date().toISOString().split('T')[0] })
      setJustSaved(true)
      setTimeout(() => { setJustSaved(false); setSmartMessage('') }, 4000)
      load()
    } catch { setSaving(false) }
  }

  const deleteTx = async (id: string) => {
    await supabase.from('transactions').delete().eq('id', id)
    setConfirmDelete(null); load()
  }

  const expenseCats = [
    { id: 'food', name: 'Comida', emoji: '🍔' }, { id: 'transport', name: 'Transporte', emoji: '🚗' },
    { id: 'home', name: 'Vivienda', emoji: '🏠' }, { id: 'fun', name: 'Ocio', emoji: '🎮' },
    { id: 'health', name: 'Salud', emoji: '💊' }, { id: 'super', name: 'Super', emoji: '🛒' },
    { id: 'gas', name: 'Gasolina', emoji: '⛽' }, { id: 'other_expense', name: 'Otros', emoji: '📦' },
  ]
  const incomeCats = [
    { id: 'salary', name: 'Salario', emoji: '💼' }, { id: 'freelance', name: 'Freelance', emoji: '💻' },
    { id: 'business', name: 'Negocio', emoji: '🏪' }, { id: 'invest', name: 'Inversión', emoji: '📈' },
    { id: 'other_income', name: 'Otros', emoji: '💰' },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title" style={{ color: 'var(--text)' }}>Movimientos</h1>
          <p className="text-caption">{justSaved ? '✅ Guardado' : `${filtered.length} registro${filtered.length !== 1 ? 's' : ''}`}</p>
        </div>
        <button onClick={openAdd} className="btn-icon shadow-md" style={{ background: 'var(--primary)', color: 'white' }}>
          <Plus size={20} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
            className="input pl-9" style={{ height: '42px', fontSize: '13px' }} />
        </div>
        {(['all', 'income', 'expense'] as const).map(f => (
          <button key={f} onClick={() => setTypeFilter(f)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
            style={{
              background: typeFilter === f ? 'var(--primary)' : 'var(--bg-card)',
              color: typeFilter === f ? 'white' : 'var(--text-muted)',
              border: typeFilter === f ? 'none' : '1px solid var(--border)',
            }}>
            {f === 'all' ? 'Todos' : f === 'income' ? '↑' : '↓'}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => (
          <div key={i} className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 skeleton-circle" /><div className="flex-1 space-y-2"><div className="h-3 skeleton w-24" /><div className="h-2 skeleton w-16" /></div>
          </div>
        ))}</div>
      ) : filtered.length === 0 ? (
        search || typeFilter !== 'all'
          ? <EmptyState emoji="🔍" title="Sin resultados" message="No encontramos movimientos con esos filtros" />
          : <EmptyState emoji="📋" title="Sin movimientos aún" message="Toca el botón + para registrar tu primer gasto o ingreso" action={openAdd} actionLabel="Agregar" />
      ) : (
        Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <p className="text-[11px] font-bold px-1 mb-1.5" style={{ color: 'var(--text-muted)' }}>{date}</p>
            <div className="card divide-y divide-[var(--border)]">
              {items.map(tx => {
                const cat = getCat(tx.category_id ?? undefined)
                return (
                  <div key={tx.id} className="flex items-center justify-between px-4 py-3.5 hover:bg-[var(--bg-hover)] transition-colors group">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base flex-shrink-0 group-hover:scale-110 transition-transform duration-200"
                        style={{ backgroundColor: cat.color + '18' }}>{cat.emoji}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{tx.description}</p>
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{cat.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <span className="text-sm font-bold tabular-nums"
                        style={{ color: tx.type === 'income' ? 'var(--success)' : 'var(--text)' }}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, profile?.currency)}
                      </span>
                      <button onClick={() => openEdit(tx)} className="btn-icon opacity-0 group-hover:opacity-100 transition-opacity" style={{ width: '32px', height: '32px', minWidth: '32px' }}>
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => setConfirmDelete(tx.id)} className="btn-icon opacity-0 group-hover:opacity-100 transition-opacity" style={{ width: '32px', height: '32px', minWidth: '32px', color: 'var(--danger)' }}>
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
            onClick={() => { setShowAdd(false); setEditing(null) }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full max-w-lg rounded-t-3xl max-h-[92vh] overflow-y-auto"
              style={{ background: 'var(--bg-card)' }}
              onClick={e => e.stopPropagation()}>
              {justSaved ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-16 px-6">
                  <CheckCircle2 size={48} style={{ color: 'var(--success)' }} className="mb-4" />
                  <p className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>{editing ? 'Actualizado' : 'Guardado'}</p>
                  {smartMessage && (
                    <div className="rounded-xl p-4 text-center text-sm max-w-sm"
                      style={{ background: 'var(--primary-bg)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--text-secondary)' }}>
                      {smartMessage}
                    </div>
                  )}
                </motion.div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                    <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>{editing ? 'Editar movimiento' : '¿En qué fue?'}</h3>
                    <button onClick={() => { setShowAdd(false); setEditing(null) }} className="btn-icon"><X size={16} /></button>
                  </div>
                  <div className="p-5 space-y-4">
                    {/* Type toggle */}
                    <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-hover)' }}>
                      {[{ k: 'expense', l: '💸 Gasto' }, { k: 'income', l: '💰 Ingreso' }].map(t => (
                        <button key={t.k} onClick={() => setForm({ ...form, type: t.k, category_id: '' })}
                          className="flex-1 py-2.5 rounded-lg text-xs font-bold transition-all"
                          style={{
                            background: form.type === t.k ? 'var(--bg-card)' : 'transparent',
                            color: form.type === t.k ? 'var(--text)' : 'var(--text-muted)',
                            boxShadow: form.type === t.k ? 'var(--shadow-sm)' : 'none',
                          }}>{t.l}</button>
                      ))}
                    </div>

                    <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder={form.type === 'expense' ? '¿En qué gastaste?' : '¿De dónde viene?'}
                      autoFocus className="input" />

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-lg" style={{ color: 'var(--text-muted)' }}>$</span>
                      <input type="number" inputMode="decimal" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                        placeholder="0" className="input pl-10"
                        style={{ height: '56px', fontSize: '24px', fontWeight: 800, color: 'var(--text)' }} />
                    </div>

                    <div>
                      <p className="text-[11px] font-bold mb-2" style={{ color: form.category_id ? 'var(--success)' : 'var(--text-muted)' }}>
                        {form.category_id ? '✅ Categoría seleccionada' : 'Elige una categoría'}
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {(form.type === 'expense' ? expenseCats : incomeCats).map(c => (
                          <button key={c.id} onClick={() => setForm({ ...form, category_id: c.id })}
                            className="flex flex-col items-center gap-0.5 p-3 rounded-xl transition-all"
                            style={{
                              background: form.category_id === c.id ? 'var(--primary-bg)' : 'var(--bg-hover)',
                              border: form.category_id === c.id ? '2px solid var(--primary)' : '2px solid transparent',
                              transform: form.category_id === c.id ? 'scale(0.95)' : 'scale(1)',
                            }}>
                            <span className="text-xl">{c.emoji}</span>
                            <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{c.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input" />

                    <button onClick={saveTx} disabled={saving || !form.description || !form.amount || !form.category_id} className="btn-primary w-full">
                      {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Guardar'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog open={!!confirmDelete} title="Eliminar movimiento" message="Esta acción no se puede deshacer" danger confirmLabel="Eliminar"
        onConfirm={() => confirmDelete && deleteTx(confirmDelete)} onCancel={() => setConfirmDelete(null)} />
    </motion.div>
  )
}
