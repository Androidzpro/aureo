import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { CURRENCIES } from '@/lib/data'
import { useNavigate } from 'react-router-dom'

const steps = ['Bienvenida', 'Perfil', 'Finanzas']

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { profile, completeOnboarding } = useAuthStore()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    currency: 'MXN',
    monthly_income: '',
    income_type: 'fixed' as 'fixed' | 'variable',
    has_debts: false as boolean,
    goal_type: 'save' as 'save' | 'debt_control' | 'expense_control',
  })

  const handleComplete = async () => {
    setLoading(true)
    try {
      await completeOnboarding({
        currency: form.currency,
        monthly_income: parseFloat(form.monthly_income) || 0,
        income_type: form.income_type,
        has_debts: form.has_debts,
        goal_type: form.goal_type,
      })
      navigate('/')
    } catch (e) {
      console.error(e)
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                i < step ? 'bg-white text-indigo-600' : i === step ? 'bg-white text-indigo-600' : 'bg-white/30 text-white')}>
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className={cn('w-8 h-0.5', i < step ? 'bg-white' : 'bg-white/30')} />}
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="welcome" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center py-4">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-300/50">
                  <span className="text-4xl">💰</span>
                </div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">Bienvenido a FlowFin</h1>
                <p className="text-sm text-gray-500 mt-2">Tu asistente financiero inteligente</p>
                <div className="mt-6 space-y-3 text-left">
                  {[
                    { emoji: '📊', text: 'Controla ingresos y gastos' },
                    { emoji: '🧠', text: 'Recibe recomendaciones inteligentes' },
                    { emoji: '🎯', text: 'Alcanza tus metas de ahorro' },
                    { emoji: '💳', text: 'Elimina tus deudas estratégicamente' },
                  ].map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <span className="text-xl">{item.emoji}</span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="py-4 space-y-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tu perfil</h2>
                <p className="text-xs text-gray-500">Personaliza FlowFin para ti</p>

                <div>
                  <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Moneda</label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(CURRENCIES).slice(0, 8).map(([code, c]) => (
                      <button key={code} onClick={() => setForm({ ...form, currency: code })}
                        className={cn('py-2 rounded-xl text-xs font-medium transition-all',
                          form.currency === code ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-500')}>
                        {c.symbol} {code}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Ingreso mensual ({CURRENCIES[form.currency]?.symbol})</label>
                  <input type="number" value={form.monthly_income} onChange={e => setForm({ ...form, monthly_income: e.target.value })}
                    placeholder="Ej: 15000" className="w-full h-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                </div>

                <div>
                  <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Tipo de ingreso</label>
                  <div className="flex gap-2">
                    {[{ k: 'fixed', l: '💼 Fijo' }, { k: 'variable', l: '📊 Variable' }].map(t => (
                      <button key={t.k} onClick={() => setForm({ ...form, income_type: t.k as any })}
                        className={cn('flex-1 py-3 rounded-xl text-xs font-medium transition-all',
                          form.income_type === t.k ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-500')}>{t.l}</button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="finances" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="py-4 space-y-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tus finanzas</h2>
                <p className="text-xs text-gray-500">Ayúdanos a personalizar tu experiencia</p>

                <div>
                  <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">¿Tienes deudas?</label>
                  <div className="flex gap-2">
                    {[{ k: false, l: '🎉 No' }, { k: true, l: '💳 Sí' }].map(t => (
                      <button key={String(t.k)} onClick={() => setForm({ ...form, has_debts: t.k as boolean })}
                        className={cn('flex-1 py-3 rounded-xl text-xs font-medium transition-all',
                          form.has_debts === t.k ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-500')}>{t.l}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1.5">¿Cuál es tu objetivo principal?</label>
                  <div className="space-y-2">
                    {[
                      { k: 'save', l: '🎯 Ahorrar más', desc: 'Crear un fondo de emergencia' },
                      { k: 'debt_control', l: '💳 Salir de deudas', desc: 'Eliminar mis deudas' },
                      { k: 'expense_control', l: '📊 Controlar gastos', desc: 'Saber a dónde va mi dinero' },
                    ].map(t => (
                      <button key={t.k} onClick={() => setForm({ ...form, goal_type: t.k as any })}
                        className={cn('w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all',
                          form.goal_type === t.k ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-500' : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700')}>
                        <span className="text-xl">{t.l.split(' ')[0]}</span>
                        <div><p className="text-xs font-medium text-gray-900 dark:text-white">{t.l.split(' ').slice(1).join(' ')}</p><p className="text-[10px] text-gray-400">{t.desc}</p></div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-2 mt-6">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1 h-11 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl text-xs">
                <ChevronLeft size={16} /> Atrás
              </button>
            )}
            <button onClick={() => step < 2 ? setStep(s => s + 1) : handleComplete()} disabled={loading}
              className="flex-1 h-11 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-300/50 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : step < 2 ? <><span>Continuar</span><ChevronRight size={16} /></> : '¡Comenzar!'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
