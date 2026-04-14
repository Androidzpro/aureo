import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { FlowLogo } from '@/components/FlowLogo'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

type Status = 'loading' | 'verified' | 'error' | 'redirecting'

/**
 * AuthCallbackPage — Handles email confirmation and password recovery links.
 *
 * With PKCE flow + detectSessionInUrl: true, Supabase already exchanges the tokens
 * automatically during getSession() (called by loadSession before this component mounts).
 * So we just need to check if the user is authenticated and redirect.
 *
 * URL patterns from Supabase emails:
 *   - Confirmation: /auth/callback?type=signup#access_token=...&refresh_token=...
 *   - Recovery:     /auth/callback?type=recovery#access_token=...&refresh_token=...
 *   - Magic Link:   /auth/callback?type=magiclink#access_token=...&refresh_token=...
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<Status>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    // loadSession() already ran before routes were rendered.
    // PKCE tokens were exchanged by Supabase during getSession().
    // Profile was fetched and stored in Zustand.
    // Just check the store state and redirect.

    const { profile, isAuthenticated } = useAuthStore.getState()

    if (profile && isAuthenticated) {
      setStatus('verified')

      // Determine destination based on callback type
      const type = searchParams.get('type')

      if (type === 'recovery') {
        // Password recovery: redirect to reset page
        const timer = setTimeout(() => {
          setStatus('redirecting')
          navigate('/reset-password', { replace: true })
        }, 1200)
        return () => clearTimeout(timer)
      }

      // Signup / magiclink / default: redirect to dashboard or onboarding
      const destination = profile.onboarded ? '/' : '/onboarding'
      const timer = setTimeout(() => {
        setStatus('redirecting')
        navigate(destination, { replace: true })
      }, 1200)
      return () => clearTimeout(timer)
    }

    // Not authenticated — link may be expired or invalid
    const type = searchParams.get('type')

    if (type === 'signup' || type === 'magiclink') {
      setStatus('error')
      setMessage(
        'No pudimos verificar tu cuenta. El enlace puede haber expirado o ya fue usado. ' +
        'Solicita uno nuevo desde el login.'
      )
    } else if (type === 'recovery') {
      setStatus('error')
      setMessage(
        'El enlace de recuperación expiró. Solicita uno nuevo desde el login.'
      )
    } else {
      // No type param or unknown — go to login
      navigate('/login', { replace: true })
    }
  }, [navigate, searchParams])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <FlowLogo size={32} className="justify-center" theme="light" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 size={28} className="text-indigo-600 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Verificando tu cuenta</h2>
              <p className="text-sm text-gray-500">
                Estamos confirmando tu correo electrónico...
              </p>
            </>
          )}

          {status === 'verified' && (
            <>
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">¡Cuenta confirmada!</h2>
              <p className="text-sm text-gray-500 mb-4">
                Tu correo fue confirmado exitosamente.
              </p>
              <p className="text-sm text-gray-400">Redirigiendo...</p>
            </>
          )}

          {status === 'redirecting' && (
            <>
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 size={28} className="text-indigo-600 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Redirigiendo...</h2>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={28} className="text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Enlace no válido</h2>
              <p className="text-sm text-gray-500 mb-6">{message}</p>
              <button
                onClick={() => navigate('/login', { replace: true })}
                className="btn-primary w-full"
              >
                Volver al login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
