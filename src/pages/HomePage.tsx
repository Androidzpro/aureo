import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import Confetti from 'react-confetti'
import { Plus, ArrowUpRight, ArrowDownRight, X, Calendar, Lightbulb, ChevronRight, Trophy, TrendingUp, CreditCard, Target, Star, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/data'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatDate, analyzeFinances, TIPS, playSound, getCat, cn, checkAchievements, ACHIEVEMENTS } from '@/lib/data'

export default function HomePage() {
  const { user } = useAuthStore()
  const [txs, setTxs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showTxModal, setShowTxModal] = useState(false)
  const [txForm, setTxForm] = useState({ description: '', amount: '', type: 'expense' as string, category_id: '', date: new Date().toISOString().split('T')[0] })
  const [showConfetti, setShowConfetti] = useState(false)
  const [newAchievement, setNewAchievement] = useState<any>(null)
  const [tipIndex, setTipIndex] = useState(0)

  useEffect(() => { load() }, [user?.id])
  useEffect(() => { const i = setInterval(() => setTipIndex(p => (p + 1) % TIPS.length), 8000); return () => clearInterval(i) }, [])

  const load = async () => {
    if (!user?.id) return
    const { data } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(200)
    if (data) {
      setTxs(data)
      // Check achievements
      const achieved = checkAchievements(data)
      if (achieved.length > 0) {
        setNewAchievement(achieved[achieved.length - 1])
        setShowConfetti(true)
        playSound('achieve')
        setTimeout(() => { setShowConfetti(false); setNewAchievement(null) }, 4000)
      }
    }
    setLoading(false)
  }

  const analysis = useMemo(() => analyzeFinances(txs), [txs])

  const now = new Date()
  const monthTxs = useMemo(() => txs.filter(t => { const d = new Date(t.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }), [txs, now])
  const monthIncome = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const monthExpense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const addTx = async () => {
    if (!user?.id || !txForm.amount || !txForm.description) return
    await supabase.from('transactions').insert([{
      user_id: user.id, type: txForm.type, amount: parseFloat(txForm.amount),
      description: txForm.description, category_id: txForm.category_id || '',
      date: new Date(txForm.date).toISOString(),
    }])
    playSound('success')
    setShowTxModal(false)
    setTxForm({ description: '', amount: '', type: 'expense', category_id: '', date: new Date().toISOString().split('T')[0] })
    load()
  }

  const deleteTx = async (id: string) => {
    await supabase.from('transactions').delete().eq('id', id)
    playSound('delete')
    load()
  }

  const tip = TIPS[tipIndex]
  const achievements = checkAchievements(txs)

  // Expense breakdown
  const expenseBreakdown = useMemo(() => {
    const map: Record<string, number> = {}
    monthTxs.filter(t => t.type === 'expense').forEach(t => { const c = getCat(t.category_id); map[c.id] = (map[c.id] || 0) + t.amount })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, amount]) => ({ ...getCat(id), amount }))
  }, [monthTxs])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 relative">
      {/* Confetti */}
      {showConfetti && <Confetti recycle={false} numberOfPieces={200} gravity={0.15} />}

      {/* Achievement popup */}
      <AnimatePresence>
        {newAchievement && (
          <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
            <span className="text-3xl">{newAchievement.icon}</span>
            <div>
              <p className="font-bold text-sm">🏆 ¡Logro desbloqueado!</p>
              <p className="text-sm opacity-90">{newAchievement.title} — {newAchievement.desc}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Hola, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-gray-400 text-sm mt-0.5">{now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <Link to="/settings" className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
          <Settings size={18} className="text-gray-500" />
        </Link>
      </div>

      {/* Health Score Card */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
        className={cn('rounded-3xl p-6 text-white relative overflow-hidden',
          analysis.score >= 70 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : analysis.score >= 40 ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-red-500 to-rose-600')}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-12 translate-x-12" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={14} className="text-white/70" />
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Salud financiera</p>
            </div>
            <p className="text-5xl font-black">{analysis.score}%</p>
            <p className="text-white/70 text-sm mt-1">{analysis.healthLabel}</p>
          </div>
          <div className="text-right space-y-2">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2">
              <p className="text-white/60 text-[10px] uppercase">Ahorro</p>
              <p className="text-lg font-bold">{analysis.savingsRate.toFixed(0)}%</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2">
              <p className="text-white/60 text-[10px] uppercase">Gasto diario</p>
              <p className="text-lg font-bold">{formatCurrency(analysis.avgDaily)}</p>
            </div>
          </div>
        </div>
        <div className="mt-5 w-full bg-white/20 rounded-full h-2.5 relative z-10">
          <motion.div initial={{ width: 0 }} animate={{ width: `${analysis.score}%` }} transition={{ delay: 0.3, duration: 1.2, type: 'spring' }}
            className="h-2.5 rounded-full bg-white/80" />
        </div>
      </motion.div>

      {/* Tip card */}
      <AnimatePresence mode="wait">
        <motion.div key={tipIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3 cursor-pointer"
          onClick={() => setTipIndex(p => (p + 1) % TIPS.length)}>
          <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Lightbulb size={20} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-amber-800 text-sm">{tip.title}</p>
            <p className="text-xs text-amber-600 mt-0.5">{tip.desc}</p>
          </div>
          <div className="flex gap-0.5">
            {TIPS.slice(0, 5).map((_, i) => <div key={i} className={cn('w-1.5 h-1.5 rounded-full', i === tipIndex % 5 ? 'bg-amber-400' : 'bg-amber-200')} />)}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Summary Cards */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 card-hover shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center"><ArrowUpRight size={14} className="text-emerald-600" /></div>
          </div>
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Ingresos</p>
          <p className="text-base font-bold text-emerald-600">{formatCurrency(monthIncome)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 card-hover shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center"><ArrowDownRight size={14} className="text-red-600" /></div>
          </div>
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Gastos</p>
          <p className="text-base font-bold text-red-600">{formatCurrency(monthExpense)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 card-hover shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center"><TrendingUp size={14} className="text-indigo-600" /></div>
          </div>
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Balance</p>
          <p className={cn('text-base font-bold', monthIncome - monthExpense >= 0 ? 'text-indigo-600' : 'text-red-600')}>{formatCurrency(monthIncome - monthExpense)}</p>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex gap-3">
        <button onClick={() => { setShowTxModal(true); playSound('click') }}
          className="flex-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold h-14 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 text-base">
          <Plus size={20} /> Nuevo movimiento
        </button>
        <Link to="/calendar" className="w-14 h-14 bg-white border border-gray-100 rounded-2xl flex items-center justify-center card-hover shadow-sm">
          <Calendar size={20} className="text-gray-600" />
        </Link>
        <Link to="/reports" className="w-14 h-14 bg-white border border-gray-100 rounded-2xl flex items-center justify-center card-hover shadow-sm">
          <TrendingUp size={20} className="text-gray-600" />
        </Link>
      </motion.div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2"><Trophy size={18} className="text-amber-500" /> Logros</h2>
            <span className="text-xs text-gray-400">{achievements.length}/{ACHIEVEMENTS.length}</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {ACHIEVEMENTS.map(a => {
              const unlocked = achievements.find(ua => ua.id === a.id)
              return (
                <div key={a.id} className={cn('flex-shrink-0 w-20 py-3 rounded-2xl text-center transition-all',
                  unlocked ? 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 shadow-sm' : 'bg-gray-100 opacity-50')}>
                  <span className="text-2xl">{unlocked ? a.icon : '🔒'}</span>
                  <p className="text-[9px] font-bold mt-1 text-gray-700 leading-tight">{unlocked ? a.title : '???'}</p>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Expense Breakdown */}
      {expenseBreakdown.length > 0 && (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">Gastos del mes</h2>
            <Link to="/reports" className="text-xs text-indigo-600 font-semibold">Ver todo →</Link>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {expenseBreakdown.map((cat, i) => {
              const pct = monthExpense > 0 ? (cat.amount / monthExpense) * 100 : 0
              return (
                <div key={cat.id} className="flex items-center gap-3 p-3.5 hover:bg-gray-50/50 transition-colors">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: cat.color + '15' }}>
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-900">{cat.name}</p>
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(cat.amount)}</p>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.3 + i * 0.1 }}
                        className="h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 w-10 text-right">{pct.toFixed(0)}%</p>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Recent Transactions */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">Últimos movimientos</h2>
          <Link to="/transactions" className="text-xs text-indigo-600 font-semibold flex items-center gap-0.5">Ver todo <ChevronRight size={12} /></Link>
        </div>
        {loading ? <div className="text-center py-8 text-gray-300">Cargando...</div>
          : txs.length === 0 ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="text-5xl mb-4">💸</motion.div>
              <p className="text-gray-400 font-medium mb-1">Empieza a registrar tus movimientos</p>
              <p className="text-gray-300 text-sm mb-4">Controla cada peso que entra y sale</p>
              <button onClick={() => setShowTxModal(true)} className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200">
                Agregar ahora
              </button>
            </motion.div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <AnimatePresence>
                {txs.slice(0, 8).map((tx, i) => {
                  const cat = getCat(tx.category_id)
                  return (
                    <motion.div key={tx.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="flex items-center justify-between p-3.5 hover:bg-gray-50/50 transition-colors group">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg cursor-pointer" style={{ backgroundColor: cat.color + '15' }}>
                          {cat.icon}
                        </motion.div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{tx.description}</p>
                          <p className="text-[11px] text-gray-400">{cat.name} • {formatDate(tx.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-sm font-bold', tx.type === 'income' ? 'text-emerald-600' : 'text-red-600')}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                        <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }}
                          onClick={() => deleteTx(tx.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-50 rounded-lg">
                          <X size={14} className="text-red-400" />
                        </motion.button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
      </motion.div>

      {/* Transaction Modal */}
      <AnimatePresence>
        {showTxModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center" onClick={() => setShowTxModal(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-t-[2rem] lg:rounded-3xl w-full lg:max-w-md max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white/90 backdrop-blur-xl px-6 pt-5 pb-3 border-b border-gray-100 z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Nuevo movimiento</h3>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => setShowTxModal(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                    <X size={18} className="text-gray-400" />
                  </motion.button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {/* Type toggle */}
                <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
                  {[{ k: 'expense', l: '💸 Gasto', c: 'bg-red-500 text-white shadow-md' }, { k: 'income', l: '💰 Ingreso', c: 'bg-emerald-500 text-white shadow-md' }].map(t => (
                    <motion.button key={t.k} whileTap={{ scale: 0.95 }}
                      onClick={() => setTxForm({ ...txForm, type: t.k, category_id: '' })}
                      className={cn('flex-1 py-3 rounded-lg font-bold text-sm transition-all',
                        txForm.type === t.k ? t.c : 'text-gray-500 bg-transparent')}>{t.l}</motion.button>
                  ))}
                </div>

                <motion.input whileFocus={{ scale: 1.01 }}
                  value={txForm.description} onChange={e => setTxForm({ ...txForm, description: e.target.value })}
                  placeholder={txForm.type === 'expense' ? '¿En qué gastaste?' : '¿De dónde viene?'}
                  className="w-full h-12 rounded-xl border border-gray-200 px-4 text-sm focus:border-indigo-400 transition-colors" />

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span>
                  <motion.input whileFocus={{ scale: 1.01 }} type="number"
                    value={txForm.amount} onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full h-14 rounded-xl border border-gray-200 pl-10 pr-4 text-2xl font-black focus:border-indigo-400 transition-colors" />
                </div>

                {/* Category picker */}
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                    <Star size={12} /> Categoría
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {(txForm.type === 'expense' ? CATS.expenses : CATS.incomes).map(c => (
                      <motion.button key={c.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
                        onClick={() => setTxForm({ ...txForm, category_id: c.id })}
                        className={cn('flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all',
                          txForm.category_id === c.id ? 'bg-indigo-50 ring-2 ring-indigo-400 shadow-sm' : 'bg-gray-50 hover:bg-gray-100')}>
                        <span className="text-xl">{c.icon}</span>
                        <span className="text-[9px] font-medium text-gray-600 leading-tight text-center">{c.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Fecha</p>
                  <input type="date" value={txForm.date} onChange={e => setTxForm({ ...txForm, date: e.target.value })}
                    className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm" />
                </div>

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={addTx}
                  className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold h-14 rounded-2xl shadow-lg shadow-indigo-200 text-base">
                  Guardar movimiento
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function Settings() { return null }
