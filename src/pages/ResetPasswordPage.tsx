import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/data'
import { useAuthStore } from '@/store/authStore'
import { FlowLogo } from '@/components/FlowLogo'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Shield } from 'lucide-react'

const resetSchema = z.object({
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe incluir una mayúscula')
    .regex(/[0-9]/, 'Debe incluir un número'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type ResetFormData = z.infer<typeof resetSchema>

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)
  const [noSession, setNoSession] = useState(false)
  const passwordValue = watch('password', '')

  const requirements = [
    { met: passwordValue.length >= 8, text: 'Mínimo 8 caracteres' },
    { met: /[A-Z]/.test(passwordValue), text: 'Una letra mayúscula' },
    { met: /[0-9]/.test(passwordValue), text: 'Un número' },
  ]

  const allMet = requirements.every(r => r.met)

  // Check if user has a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setNoSession(true)
      }
    }
    checkSession()
  }, [])

  const onSubmit = async (data: ResetFormData) => {
    try {
      setIsLoading(true)
      setError('')

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Sesión de recuperación expirada. Solicita un nuevo enlace.')
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: data.password })
      if (updateError) throw updateError

      setSuccess(true)
      setTimeout(() => navigate('/login', { replace: true }), 3000)
    } catch (e: any) {
      console.error('Password reset error:', e)
      if (e.message?.includes('expired') || e.message?.includes('invalid')) {
        setError('El enlace ha expirado. Solicita uno nuevo desde el login.')
      } else {
        setError(e.message || 'Error al actualizar la contraseña.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (noSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <FlowLogo size={32} className="justify-center" theme="light" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
            <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} className="text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Enlace expirado</h2>
            <p className="text-sm text-gray-500 mb-6">
              El enlace de recuperación ha expirado. Solicita uno nuevo desde el login.
            </p>
            <button onClick={() => navigate('/login', { replace: true })} className="btn-primary w-full">
              Volver al login
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <FlowLogo size={32} className="justify-center" theme="light" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Contraseña actualizada</h2>
            <p className="text-sm text-gray-500 mb-4">
              Tu contraseña ha sido actualizada exitosamente.
            </p>
            <p className="text-sm text-gray-400">
              Redirigiendo al login...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <FlowLogo size={32} className="justify-center" theme="light" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield size={24} className="text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Nueva contraseña</h2>
            <p className="text-sm text-gray-500">
              Ingresa tu nueva contraseña
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Nueva contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input pr-12"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="mt-2 space-y-1.5">
                {requirements.map((req, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {req.met ? (
                      <CheckCircle2 size={12} className="text-emerald-500" />
                    ) : (
                      <AlertCircle size={12} className="text-gray-300" />
                    )}
                    <span className={req.met ? 'text-emerald-600' : 'text-gray-400'}>{req.text}</span>
                  </div>
                ))}
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 mt-1.5">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Confirmar contraseña</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input pr-12"
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-600 mt-1.5">{errors.confirmPassword.message}</p>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2.5 rounded-lg">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !allMet}
              className="btn-primary w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Actualizando...
                </>
              ) : (
                'Actualizar contraseña'
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="btn-ghost w-full"
            >
              Cancelar
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
