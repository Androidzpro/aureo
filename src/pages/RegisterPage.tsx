import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { FlowLogo } from '@/components/FlowLogo'
import { Eye, EyeOff, Loader2, AlertCircle, Check, X, Mail } from 'lucide-react'

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Ingresa un correo válido'),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe incluir una mayúscula')
    .regex(/[0-9]/, 'Debe incluir un número'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met ? <Check size={12} className="text-emerald-500" /> : <X size={12} className="text-gray-300" />}
      <span className={met ? 'text-emerald-600' : 'text-gray-400'}>{text}</span>
    </div>
  )
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register: reg } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmSent, setConfirmSent] = useState(false)

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
      await reg(data.name, data.email, data.password)
      // Always show confirmation screen - Supabase requires email verification
      setConfirmSent(true)
    } catch (e: any) {
      if (e?.message?.includes('already registered')) {
        setError('Este correo ya está registrado')
      } else {
        setError('Error al crear la cuenta. Intenta de nuevo.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (confirmSent) {
    const userEmail = watch('email') || ''
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <FlowLogo size={32} className="justify-center" theme="light" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={28} className="text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Revisa tu correo</h2>
            <p className="text-sm text-gray-500 mb-6">
              Enviamos un enlace de confirmación a <strong className="text-gray-900">{userEmail}</strong>.
              Haz clic en el enlace para activar tu cuenta y poder iniciar sesión.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs text-amber-700 leading-relaxed">
                ⚠️ <strong>Importante:</strong> No podrás iniciar sesión hasta confirmar tu correo.
                Si no ves el correo, revisa spam o solicita uno nuevo.
              </p>
            </div>

            <div className="space-y-3">
              <button onClick={() => { setConfirmSent(false); setPassword('') }} className="btn-secondary w-full">
                Corregir correo
              </button>
              <button onClick={() => navigate('/login')} className="btn-ghost w-full">
                Ir al login
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-md text-center">
          <FlowLogo size={48} variant="full" theme="light" className="justify-center mb-8" />
          <h1 className="text-4xl font-bold text-white mb-4">Empieza a controlar tu dinero</h1>
          <p className="text-lg text-gray-300 leading-relaxed">
            Crea tu cuenta gratis y descubre cómo FlowFin puede ayudarte a tomar mejores decisiones financieras.
          </p>
          <div className="mt-8 space-y-3 text-left max-w-xs mx-auto">
            {['Registro en 30 segundos', 'Sin tarjeta de crédito', 'Tus datos están seguros'].map((text, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
                <Check size={14} className="text-emerald-500" /> {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <FlowLogo size={36} className="justify-center" theme="light" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Crear cuenta</h2>
              <p className="text-sm text-gray-500 mt-1">Completa tus datos para registrarte</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">Nombre</label>
                <input type="text" placeholder="Tu nombre" className="input" {...register('name')} />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">Correo electrónico</label>
                <input type="email" placeholder="tu@email.com" className="input" {...register('email')} />
                {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    className="input pr-12"
                    {...register('password')}
                    onChange={e => { setPassword(e.target.value); register('password').onChange(e) }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {/* Password requirements */}
                <div className="mt-2 space-y-1.5">
                  {requirements.map((req, i) => (
                    <PasswordRequirement key={i} met={req.met} text={req.text} />
                  ))}
                </div>
                {errors.password && <p className="text-xs text-red-600 mt-1.5">{errors.password.message}</p>}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">Confirmar contraseña</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repite tu contraseña"
                    className={cn('input pr-12', errors.confirmPassword && 'border-red-300 focus:border-red-500 focus:ring-red-500/20')}
                    {...register('confirmPassword')}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-600 mt-1.5">{errors.confirmPassword.message}</p>}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2.5 rounded-lg">
                  <AlertCircle size={14} className="flex-shrink-0" /> {error}
                </div>
              )}

              <button type="submit" disabled={isLoading || !allMet} className="btn-primary w-full">
                {isLoading ? <><Loader2 size={16} className="animate-spin" /> Creando cuenta...</> : 'Crear cuenta'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                  Iniciar sesión
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Al registrarte, aceptas nuestros Términos de servicio y Política de privacidad
          </p>
        </motion.div>
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}
