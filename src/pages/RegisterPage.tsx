import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'
import { FlowLogo } from '@/components/FlowLogo'
import { Eye, EyeOff, Loader2, AlertCircle, Check, Mail } from 'lucide-react'

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Ingresa un correo válido'),
  password: z.string().min(8, 'Mínimo 8 caracteres').regex(/[A-Z]/, 'Debe incluir una mayúscula').regex(/[0-9]/, 'Debe incluir un número'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: 'Las contraseñas no coinciden', path: ['confirmPassword'] })

type RegisterFormData = z.infer<typeof registerSchema>

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met ? <Check size={12} style={{ color: 'var(--success)' }} /> : <span className="w-3 h-3 rounded-full" style={{ background: 'var(--bg-hover)' }} />}
      <span style={{ color: met ? 'var(--success)' : 'var(--text-muted)' }}>{text}</span>
    </div>
  )
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register: reg } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmSent, setConfirmSent] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const passwordValue = watch('password', '')
  const requirements = [
    { met: passwordValue.length >= 8, text: 'Mínimo 8 caracteres' },
    { met: /[A-Z]/.test(passwordValue), text: 'Una letra mayúscula' },
    { met: /[0-9]/.test(passwordValue), text: 'Un número' },
  ]
  const allMet = requirements.every(r => r.met)

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true)
      setError('')
      const result = await reg(data.name, data.email, data.password)
      if (result.needsVerification) {
        setRegisteredEmail(data.email)
        setConfirmSent(true)
      } else {
        navigate('/', { replace: true })
      }
    } catch (e: any) {
      if (e?.message?.includes('ya está registrado')) setError('Este correo ya está registrado. Intenta iniciar sesión.')
      else if (e?.message?.includes('contraseña')) setError(e.message)
      else setError(e?.message || 'Error al crear la cuenta. Intenta de nuevo.')
    } finally { setIsLoading(false) }
  }

  if (confirmSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-8"><FlowLogo size={36} className="justify-center" theme="dark" /></div>
          <div className="card p-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--primary-bg)' }}>
              <Mail size={28} style={{ color: 'var(--primary)' }} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>¡Casi listo!</h2>
            <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Enviamos un enlace de confirmación a</p>
            <p className="text-sm font-bold mb-6" style={{ color: 'var(--text)' }}>{registeredEmail}</p>
            <div className="rounded-xl p-4 mb-6 text-left text-sm" style={{ background: 'var(--primary-bg)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--primary)' }}>
              📧 <strong>Importante:</strong> Debes confirmar tu correo antes de poder iniciar sesión.
              <br />Haz clic en el enlace del correo y serás redirigido automáticamente a FlowFin.
            </div>
            <div className="rounded-xl p-4 mb-6 text-left text-sm" style={{ background: 'var(--warning-bg)', border: '1px solid rgba(245,158,11,0.2)', color: 'var(--warning)' }}>
              ⚠️ <strong>¿No ves el correo?</strong> Revisa spam. El enlace expira en 24 horas.
            </div>
            <div className="space-y-3">
              <button onClick={() => setConfirmSent(false)} className="btn-secondary w-full">Corregir correo</button>
              <button onClick={() => navigate('/login')} className="btn-ghost w-full">Ir al login</button>
            </div>
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
          <h1 className="text-4xl font-bold text-white mb-4">Empieza a controlar tu dinero</h1>
          <p className="text-lg text-white/70 leading-relaxed">Crea tu cuenta gratis y descubre cómo FlowFin puede ayudarte.</p>
          <div className="mt-8 space-y-3 text-left max-w-xs mx-auto">
            {['Registro en 30 segundos', 'Sin tarjeta de crédito', 'Tus datos están seguros'].map(t => (
              <div key={t} className="flex items-center gap-2 text-sm text-white/60"><Check size={14} className="text-emerald-300" /> {t}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8"><FlowLogo size={40} className="justify-center" theme="dark" /></div>
          <div className="card p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>Crear cuenta</h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Completa tus datos para registrarte</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nombre</label>
                <input type="text" placeholder="Tu nombre" className="input" {...register('name')} />
                {errors.name && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.name.message}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Correo electrónico</label>
                <input type="email" placeholder="tu@email.com" className="input" {...register('email')} />
                {errors.email && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.email.message}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Contraseña</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} placeholder="Mínimo 8 caracteres" className="input pr-12" {...register('password')} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="mt-2 space-y-1.5">
                  {requirements.map((req, i) => <PasswordRequirement key={i} met={req.met} text={req.text} />)}
                </div>
                {errors.password && <p className="text-xs mt-1.5" style={{ color: 'var(--danger)' }}>{errors.password.message}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Confirmar contraseña</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} placeholder="Repite tu contraseña" className="input pr-12" {...register('confirmPassword')} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs mt-1.5" style={{ color: 'var(--danger)' }}>{errors.confirmPassword.message}</p>}
              </div>
              {error && (
                <div className="flex items-center gap-2 text-sm p-3 rounded-xl" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                  <AlertCircle size={14} className="flex-shrink-0" /> {error}
                </div>
              )}
              <button type="submit" disabled={isLoading || !allMet} className="btn-primary w-full">
                {isLoading ? <><Loader2 size={16} className="animate-spin" /> Creando cuenta...</> : 'Crear cuenta'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" className="font-bold hover:underline" style={{ color: 'var(--primary)' }}>Inicia sesión</Link>
              </p>
            </div>
          </div>
          <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
            Al registrarte, aceptas nuestros Términos de servicio y Política de privacidad
          </p>
        </motion.div>
      </div>
    </div>
  )
}
