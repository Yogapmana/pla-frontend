import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Sparkles, Loader2, Eye, EyeOff, CheckCircle2, Brain, BookOpen, MessageSquare } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { login as loginApi, googleLogin as googleLoginApi } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'
import { useQueryClient } from '@tanstack/react-query'
import { GoogleLogin } from '@react-oauth/google'
import LanguageToggle from '@/components/common/LanguageToggle'

export default function Login() {
  const { t } = useTranslation()
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const login = useAuthStore((state) => state.login)
  const shouldReduceMotion = useReducedMotion()

  const registeredNotice = location.state?.registered
  const verifiedNotice = location.state?.verified
  const prefilledEmail = location.state?.email || ''

  const loginSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(t('auth.email_invalid')),
        password: z.string().min(8, t('auth.password_min')),
      }),
    [t],
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    // Always resolve against the latest schema so validation messages
    // follow the active language after a language switch.
    resolver: (values, context, options) =>
      zodResolver(loginSchema)(values, context, options),
    defaultValues: {
      email: prefilledEmail,
      password: '',
    },
  })

  const benefits = [
    { icon: Brain, label: t('auth.benefit_planner') },
    { icon: BookOpen, label: t('auth.benefit_modules') },
    { icon: MessageSquare, label: t('auth.benefit_tutor') },
  ]

  const onSubmit = async (data) => {
    setError(null)
    try {
      // Clear client state only (skipServer) so we do NOT revoke the
      // cookies that loginApi is about to set.
      await useAuthStore.getState().logout({ skipServer: true })
      queryClient.clear()
      const response = await loginApi(data.email, data.password)
      // Pass the response.streak payload through to the auth store
      // — when `is_new_day` is true, the store queues a
      // StreakCelebration modal that AppLayout will render.
      login(response.access_token, response.user, response.streak)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || t('auth.login_failed'))
    }
  }

  return (
    <div className="relative min-h-screen flex bg-neutral texture-grain">
      <div className="absolute left-4 top-4 z-20 sm:left-6 sm:top-5">
        <Link to="/" className="block">
          <img src="/horizontal-logo.png" alt="Synapsa Logo" className="h-16 sm:h-24 w-auto object-contain transition-transform hover:scale-105" />
        </Link>
      </div>
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-5">
        <LanguageToggle className="bg-surface/80 backdrop-blur-sm shadow-warm-xs ring-1 ring-border/50" />
      </div>

      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-surface via-neutral to-tertiary/5 items-center justify-center">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, rgb(var(--tertiary)) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-tertiary/[0.06] blur-3xl"
        />

        <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-md">
          <div className="w-40 h-40 mb-6 shrink-0">
            <img src="/logo.png" alt="Synapsa Logo" className="w-full h-full object-contain drop-shadow-lg" />
          </div>
          <p className="text-lg text-secondary mt-3 font-serif-content leading-relaxed">
            {t('auth.brand_tagline_before')}
            <span className="text-tertiary italic"> {t('auth.brand_tagline_highlight')} </span>
            {t('auth.brand_tagline_after')}
          </p>

          <div className="mt-12 w-full space-y-3 text-left">
            {benefits.map((item, i) => (
              <motion.div
                key={item.label}
                initial={shouldReduceMotion ? false : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
                className="flex items-center gap-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-tertiary/10 text-tertiary shrink-0">
                  <item.icon className="h-4 w-4" />
                </div>
                <span className="text-sm text-primary font-label">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-transparent p-6 sm:p-8">
        <motion.div
          className="w-full max-w-[440px]"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
        >
          <div className="bg-surface rounded-[2rem] p-8 md:p-10 shadow-warm-xl ring-1 ring-border-subtle/50 mt-12 lg:mt-0">
            <div className="mb-6">
              <h2 className="text-2xl font-display font-bold text-primary tracking-tight">
                {t('auth.login_title')}
              </h2>
              <p className="text-sm text-secondary mt-1.5">{t('auth.login_subtitle')}</p>
            </div>

            {registeredNotice && (
              <div className="flex items-start gap-2.5 p-3.5 text-sm text-success-fg bg-success-light rounded-xl border border-success/20 mb-5">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{t('auth.registered_notice')}</span>
              </div>
            )}

            {verifiedNotice && (
              <div className="flex items-start gap-2.5 p-3.5 text-sm text-success-fg bg-success-light rounded-xl border border-success/20 mb-5">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{t('auth.verified_notice')}</span>
              </div>
            )}

            {error && (
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                className="p-3.5 text-sm text-danger-fg bg-danger-light rounded-xl border border-danger/20 mb-5"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-label text-primary" htmlFor="email">{t('auth.email')}</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={cn(
                    'w-full rounded-xl border-none ring-1 ring-border-subtle bg-surface-1 px-4 py-3 text-sm text-primary placeholder:text-secondary/50 focus:ring-2 focus:ring-tertiary/30 focus:outline-none transition-shadow shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]',
                    errors.email && 'ring-2 ring-danger/40 focus:ring-danger/40'
                  )}
                  {...register('email')}
                />
                {errors.email && (
                  <p id="email-error" role="alert" className="text-danger text-sm">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-label text-primary" htmlFor="password">{t('auth.password')}</label>
                  <Link to="/forgot-password" className="text-xs text-tertiary hover:text-tertiary-light transition-colors">
                    {t('auth.forgot_password')}
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    className={cn(
                      'w-full rounded-xl border-none ring-1 ring-border-subtle bg-surface-1 px-4 py-3 pr-10 text-sm text-primary placeholder:text-secondary/50 focus:ring-2 focus:ring-tertiary/30 focus:outline-none transition-shadow shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]',
                      errors.password && 'ring-2 ring-danger/40 focus:ring-danger/40'
                    )}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? t('auth.hide_password') : t('auth.show_password')}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/70 hover:text-secondary transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" role="alert" className="text-danger text-sm">{errors.password.message}</p>
                )}
              </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-tertiary text-white rounded-xl px-6 py-3 font-semibold hover:bg-tertiary-light active:bg-tertiary-dark transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-label tracking-wide shadow-warm-sm hover:shadow-warm-md"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? t('auth.login_submitting') : t('auth.login_submit')}
            </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-surface px-3 text-secondary">{t('auth.or')}</span>
              </div>
            </div>

            <div className="flex justify-center mt-4">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  try {
                    setError(null)
                    await useAuthStore.getState().logout({ skipServer: true })
                    queryClient.clear()
                    const response = await googleLoginApi(credentialResponse.credential)
                    login(response.access_token, response.user, response.streak)
                    navigate('/dashboard')
                  } catch (err) {
                    setError(err.response?.data?.detail || t('auth.google_login_failed'))
                  }
                }}
                onError={() => {
                  setError(t('auth.google_login_cancelled'))
                }}
                shape="rectangular"
                theme="outline"
                size="large"
                width="320"
                text="signin_with"
                useOneTap={false}
              />
            </div>

            <p className="text-sm text-center text-secondary mt-6">
              {t('auth.no_account')}{' '}
              <Link to="/register" className="text-tertiary hover:text-tertiary-light font-semibold transition-colors">
                {t('auth.go_register')}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
