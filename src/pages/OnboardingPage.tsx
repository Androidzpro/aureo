import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { CURRENCIES, cn, formatCurrency } from '@/lib/data'
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

  // Validación por paso
  const canProceed = (): boolean => {
    if (step === 0) return true
    if (step === 1) return form.monthly_income !== '' && parseFloat(form.monthly_income) >= 0
    return true // step 2: goal_type siempre tiene valor por defecto
  }

  const handleNext = () => {
    if (!canProceed()) return
    if (step < 2) setStep(s => s + 1)
  }

  const handleComplete = async () => {
    if (!canProceed()) return
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
      console.error('Onboarding error:', e)
    } finally { setLoading(false) }
  }

  const goalMessages: Record<string, { title: string; message: string }> = {
    save: { title: 'Fondo de emergencia', message: 'Te ayudaremos a crear un colchón financiero de al menos 3 meses de gastos.' },
    debt_control: { title: 'Libertad financiera', message: 'Te daremos un plan para eliminar tus deudas de la más cara a la más barata.' },
    expense_control: { title: 'Claridad total', message: 'Cada peso que gastes quedará registrado para que sepas exactamente a dónde va.' },
  }

  const selectedGoal = goalMessages[form.goal_type]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md relative z-10">
        {/* Progress bar */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <motion.div
                initial={false}
                animate={{ scale: i === step ? 1.1 : 1 }}
                className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                  i < step ? 'bg-white text-indigo-600' : i === step ? 'bg-white text-indigo-600 shadow-lg' : 'bg-white/30 text-white')}
              >
                {i < step ? <Check size={14} /> : i + 1}
              </motion.div>
              {i < steps.length - 1 && (
                <div className={cn('w-8 h-0.5 rounded-full transition-all duration-300', i < step ? 'bg-white' : 'bg-white/30')} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl border border-white/20 dark:border-gray-800">
          <AnimatePresence mode="wait">
            {/* ===== STEP 0: BIENVENIDA ===== */}
            {step === 0 && (
              <motion.div key="welcome" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <div className="text-center py-2">
                  <motion.div
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', delay: 0.1, stiffness: 200 }}
                    className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-300/50"
                  >
                    <span className="text-4xl">💰</span>
                  </motion.div>
                  <h1 className="text-2xl font-black text-gray-900 dark:text-white">Bienvenido a FlowFin</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Tu asistente financiero inteligente</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Hola {profile?.name || 'Usuario'}, en 3 pasos tendrás todo listo</p>
                </div>

                <div className="mt-5 space-y-2.5">
                  {[
                    { emoji: '📊', text: 'Controla ingresos y gastos', desc: 'Registra cada movimiento fácilmente' },
                    { emoji: '🧠', text: 'Recibe recomendaciones inteligentes', desc: 'Insights basados en tu comportamiento' },
                    { emoji: '🎯', text: 'Alcanza tus metas de ahorro', desc: 'Define objetivos y míralos crecer' },
                    { emoji: '💳', text: 'Elimina tus deudas', desc: 'Plan estratégico con seguimiento' },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.08 }}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center text-lg flex-shrink-0 shadow-sm">
                        {item.emoji}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">{item.text}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ===== STEP 1: PERFIL ===== */}
            {step === 1 && (
              <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <div className="text-center mb-4">
                  <div className="w-12 h-12 mx-auto mb-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">👤</span>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tu perfil</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Personaliza FlowFin para ti</p>
                </div>

                <div className="space-y-4">
                  {/* Moneda */}
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-[0.04em] block mb-2">
                      💱 Moneda principal
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {Object.entries(CURRENCIES).map(([code, c]) => (
                        <motion.button
                          key={code}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setForm({ ...form, currency: code })}
                          className={cn('py-2.5 rounded-xl text-center transition-all duration-200',
                            form.currency === code
                              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500 shadow-sm'
                              : 'bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700')}
                        >
                          <p className="text-sm font-bold">{c.symbol}</p>
                          <p className="text-[9px] opacity-70">{code}</p>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Ingreso mensual */}
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-[0.04em] block mb-2">
                      💵 Ingreso mensual ({CURRENCIES[form.currency]?.symbol})
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">{CURRENCIES[form.currency]?.symbol}</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={form.monthly_income}
                        onChange={e => setForm({ ...form, monthly_income: e.target.value })}
                        placeholder="0"
                        className="w-full h-14 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 text-2xl font-black text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                    {form.monthly_income && parseFloat(form.monthly_income) > 0 && (
                      <p className="text-[10px] text-gray-400 mt-1.5">
                        ≈ {formatCurrency(parseFloat(form.monthly_income) / 4, form.currency)} por semana
                      </p>
                    )}
                  </div>

                  {/* Tipo de ingreso */}
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-[0.04em] block mb-2">
                      📋 Tipo de ingreso
                    </label>
                    <div className="flex gap-2">
                      {[
                        { k: 'fixed' as const, l: '💼 Fijo', desc: 'Mismo monto cada mes' },
                        { k: 'variable' as const, l: '📊 Variable', desc: 'Monto cambia cada mes' },
                      ].map(t => (
                        <motion.button
                          key={t.k}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setForm({ ...form, income_type: t.k })}
                          className={cn('flex-1 p-3 rounded-xl text-left transition-all duration-200',
                            form.income_type === t.k
                              ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-500'
                              : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700')}
                        >
                          <p className="text-xs font-semibold text-gray-900 dark:text-white">{t.l}</p>
                          <p className="text-[9px] text-gray-400 mt-0.5">{t.desc}</p>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ===== STEP 2: FINANZAS ===== */}
            {step === 2 && (
              <motion.div key="finances" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <div className="text-center mb-4">
                  <div className="w-12 h-12 mx-auto mb-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">💡</span>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tus finanzas</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Ayúdanos a personalizar tu experiencia</p>
                </div>

                <div className="space-y-4">
                  {/* Deudas */}
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-[0.04em] block mb-2">
                      💳 ¿Tienes deudas actualmente?
                    </label>
                    <div className="flex gap-2">
                      {[
                        { k: false, l: '🎉 No, estoy libre', active: 'bg-emerald-50 dark:bg-emerald-900/30 ring-2 ring-emerald-500' },
                        { k: true, l: '💳 Sí, tengo deudas', active: 'bg-amber-50 dark:bg-amber-900/30 ring-2 ring-amber-500' },
                      ].map(t => (
                        <motion.button
                          key={String(t.k)}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setForm({ ...form, has_debts: t.k as boolean })}
                          className={cn('flex-1 py-3.5 rounded-xl text-xs font-semibold transition-all duration-200',
                            form.has_debts === t.k
                              ? t.active
                              : 'bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700')}
                        >
                          {t.l}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Objetivo */}
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-[0.04em] block mb-2">
                      🎯 ¿Cuál es tu objetivo principal?
                    </label>
                    <div className="space-y-2">
                      {[
                        { k: 'save' as const, emoji: '🎯', title: 'Ahorrar más', desc: 'Crear un fondo de emergencia y alcanzar metas' },
                        { k: 'debt_control' as const, emoji: '💳', title: 'Salir de deudas', desc: 'Eliminar mis deudas con un plan estratégico' },
                        { k: 'expense_control' as const, emoji: '📊', title: 'Controlar gastos', desc: 'Saber exactamente a dónde va mi dinero' },
                      ].map(t => (
                        <motion.button
                          key={t.k}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setForm({ ...form, goal_type: t.k })}
                          className={cn('w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all duration-200',
                            form.goal_type === t.k
                              ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-500 shadow-sm'
                              : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700')}
                        >
                          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0',
                            form.goal_type === t.k ? 'bg-white dark:bg-indigo-800' : 'bg-white dark:bg-gray-700')}>
                            {t.emoji}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-900 dark:text-white">{t.title}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">{t.desc}</p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Preview message */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={form.goal_type}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-xl p-3.5"
                    >
                      <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Tu experiencia incluirá</p>
                      <p className="text-xs font-medium text-gray-900 dark:text-white mt-1">{selectedGoal.title}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{selectedGoal.message}</p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-2 mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
            {step > 0 && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1 h-11 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl text-xs"
              >
                <ChevronLeft size={14} /> Atrás
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={step < 2 ? handleNext : handleComplete}
              disabled={loading || !canProceed()}
              className="flex-1 h-11 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-300/50 dark:shadow-indigo-900/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : step < 2 ? (
                <><span>Continuar</span><ChevronRight size={16} /></>
              ) : (
                '🚀 ¡Comenzar!'
              )}
            </motion.button>
          </div>

          {/* Skip hint */}
          {step === 0 && (
            <p className="text-center text-[10px] text-gray-400 dark:text-gray-500 mt-3">Solo te tomará 30 segundos</p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
