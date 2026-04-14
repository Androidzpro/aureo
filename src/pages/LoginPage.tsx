import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/data'
import { useAuthStore } from '@/store/authStore'
import { FlowLogo } from '@/components/FlowLogo'
import { Eye, EyeOff, Loader2, AlertCircle, Check, Mail } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Ingresa un correo válido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, resendConfirmationEmail } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetError, setResetError] = useState('')
  const [resendError, setResendError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [showResendEmail, setShowResendEmail] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resendEmailInput, setResendEmailInput] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resendSent, setResendSent] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true)
      setError('')
      await login(data.email, data.password)
      navigate('/', { replace: true })
    } catch (e: any) {
      const msg = e?.message || ''
      if (msg.includes('confirmar') || msg.includes('Email not confirmed')) {
        setResendEmailInput(data.email)
        setShowResendEmail(true)
      } else {
        setError(msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = async () => {
    if (!resetEmail || !z.string().email().safeParse(resetEmail).success) return
    setResetLoading(true)
    setResetError('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      })
      if (error) {
        if (!error.message.includes('too many')) setResetSent(true)
        else setResetError('Demasiados intentos. Espera un momento.')
      } else { setResetSent(true) }
    } catch { setResetSent(true) }
    finally { setResetLoading(false) }
  }

  const handleResendEmail = async () => {
    if (!resendEmailInput || !z.string().email().safeParse(resendEmailInput).success) return
    setResendLoading(true)
    setResendError('')
    try {
      await resendConfirmationEmail(resendEmailInput)
      setResendSent(true)
    } catch (e: any) {
      if (e.message?.includes('ya fue confirmado')) {
        setShowResendEmail(false)
        setError('Este correo ya fue confirmado. Inicia sesión.')
      } else { setResendError(e.message || 'Error al reenviar el correo') }
    } finally { setResendLoading(false) }
  }

  if (showReset) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <FlowLogo size={36} className="justify-center" theme="dark" />
          </div>
          <div className="card p-8">
            {resetSent ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--primary-bg)' }}>
                  <Mail size={24} style={{ color: 'var(--primary)' }} />
                </div>
                <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Revisa tu correo</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                  Enviamos un enlace a <strong>{resetEmail}</strong>
                </p>
                <button onClick={() => { setShowReset(false); setResetSent(false) }} className="btn-secondary w-full">Volver al login</button>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--primary-bg)' }}>
                    <Mail size={24} style={{ color: 'var(--primary)' }} />
                  </div>
                  <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Recuperar contraseña</h2>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Ingresa tu correo y te enviaremos un enlace</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Correo electrónico</label>
                    <input value={resetEmail} onChange={e => setResetEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleReset()}
                      type="email" placeholder="tu@email.com" className="input" autoFocus />
                  </div>
                  {resetError && (
                    <div className="flex items-center gap-2 text-sm p-3 rounded-xl" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                      <AlertCircle size={14} /> {resetError}
                    </div>
                  )}
                  <button onClick={handleReset} disabled={resetLoading || !resetEmail} className="btn-primary w-full">
                    {resetLoading ? <><Loader2 size={16} className="animate-spin" /> Enviando...</> : 'Enviar enlace'}
                  </button>
                  <button onClick={() => { setShowReset(false); setResetSent(false); setResetError('') }} className="btn-ghost w-full">Cancelar</button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  if (showResendEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <FlowLogo size={36} className="justify-center" theme="dark" />
          </div>
          <div className="card p-8">
            {resendSent ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--primary-bg)' }}>
                  <Mail size={24} style={{ color: 'var(--primary)' }} />
                </div>
                <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Correo reenviado</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                  Enviamos un nuevo enlace a <strong>{resendEmailInput}</strong>
                </p>
                <button onClick={() => { setShowResendEmail(false); setResendSent(false) }} className="btn-secondary w-full">Volver al login</button>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--warning-bg)' }}>
                    <Mail size={24} style={{ color: 'var(--warning)' }} />
                  </div>
                  <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Confirma tu correo</h2>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Necesitas confirmar tu correo antes de iniciar sesión</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Correo electrónico</label>
                    <input value={resendEmailInput} onChange={e => setResendEmailInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleResendEmail()}
                      type="email" placeholder="tu@email.com" className="input" autoFocus />
                  </div>
                  {resendError && (
                    <div className="flex items-center gap-2 text-sm p-3 rounded-xl" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                      <AlertCircle size={14} /> {resendError}
                    </div>
                  )}
                  <button onClick={handleResendEmail} disabled={resendLoading || !resendEmailInput} className="btn-primary w-full">
                    {resendLoading ? <><Loader2 size={16} className="animate-spin" /> Enviando...</> : 'Reenviar enlace'}
                  </button>
                  <button onClick={() => { setShowResendEmail(false); setResendSent(false); setResendError('') }} className="btn-ghost w-full">Cancelar</button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: 'var(--bg)' }}>
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12"
        style={{ background: 'linear-gradient(135deg, #064E3B 0%, #059669 50%, #10B981 100%)' }}>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-md text-center">
          <FlowLogo size={56} variant="full" theme="light" className="justify-center mb-8" />
          <h1 className="text-4xl font-bold text-white mb-4">Tu dinero, bajo control</h1>
          <p className="text-lg text-white/70 leading-relaxed">
            Gestiona tus finanzas con inteligencia. FlowFin te ayuda a tomar mejores decisiones con tu dinero.
          </p>
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-white/50">
            {['Seguro', 'Gratuito', 'Inteligente'].map(t => (
              <div key={t} className="flex items-center gap-2"><Check size={14} className="text-emerald-300" /> {t}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <FlowLogo size={40} className="justify-center" theme="dark" />
          </div>

          <div className="card p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>Iniciar sesión</h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Ingresa tus credenciales para continuar</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Correo electrónico</label>
                <input type="email" placeholder="tu@email.com" className="input" {...register('email')} />
                {errors.email && <p className="text-xs mt-1.5" style={{ color: 'var(--danger)' }}>{errors.email.message}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Contraseña</label>
                  <button type="button" onClick={() => setShowReset(true)} className="text-xs font-semibold hover:underline" style={{ color: 'var(--primary)' }}>
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="input pr-12" {...register('password')} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'var(--text-muted)' }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs mt-1.5" style={{ color: 'var(--danger)' }}>{errors.password.message}</p>}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm p-3 rounded-xl" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                  <AlertCircle size={14} className="flex-shrink-0" /> <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={isLoading} className="btn-primary w-full">
                {isLoading ? <><Loader2 size={16} className="animate-spin" /> Entrando...</> : 'Entrar'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                ¿Primera vez aquí?{' '}
                <Link to="/register" className="font-bold hover:underline" style={{ color: 'var(--primary)' }}>Crea tu cuenta gratis</Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
            Al continuar, aceptas nuestros Términos de servicio y Política de privacidad
          </p>
        </motion.div>
      </div>
    </div>
  )
}
