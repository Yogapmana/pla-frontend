import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import {
  User,
  Mail,
  Clock3,
  Download,
  Trash2,
  Settings2,
  BookOpen,
  Bell,
  Shield,
  CheckCircle2,
  Loader2,
  Pencil,
  X,
  Languages,
  CircleDot,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PageHeader from '@/components/common/PageHeader'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  deleteAccount,
  updateLanguagePreference,
  updateProfile,
} from '@/api/auth'
import { getQuizHistory } from '@/api/quiz'
import { deleteSession, getSession, getTopics } from '@/api/learning'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useLearningStore } from '@/stores/learningStore'
import { useAllSessions } from '@/hooks/useLearning'
import i18n from '@/i18n'

/* Phase 5.7 — Settings simplified & polished.
 *
 * Interactive tabs:
 *  - Profil: editable username + language preference
 *  - Belajar: list of sessions with per-item delete
 *  - Notifikasi: functional email/push toggles (persisted locally)
 *  - Data: export + confirmed delete account
 */

const NOTIF_STORAGE_KEY = 'pla_notification_prefs'

function readNotifPrefs() {
  if (typeof window === 'undefined') return { email: true, push: false }
  try {
    const raw = window.localStorage.getItem(NOTIF_STORAGE_KEY)
    if (!raw) return { email: true, push: false }
    const parsed = JSON.parse(raw)
    return {
      email: typeof parsed.email === 'boolean' ? parsed.email : true,
      push: typeof parsed.push === 'boolean' ? parsed.push : false,
    }
  } catch {
    return { email: true, push: false }
  }
}

function writeNotifPrefs(prefs) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(prefs))
}

function getSections(t) {
  return [
    { id: 'profil', label: t('settings.profile', 'Profil'), icon: User, eyebrow: t('settings.account', 'Akun') + ' · 01' },
    { id: 'belajar', label: t('settings.learning', 'Belajar'), icon: BookOpen, eyebrow: t('settings.preferences', 'Preferensi') + ' · 02' },
    { id: 'notifikasi', label: t('settings.notifications', 'Notifikasi'), icon: Bell, eyebrow: t('settings.communication', 'Komunikasi') + ' · 03' },
    { id: 'data', label: t('settings.data', 'Data'), icon: Shield, eyebrow: t('settings.account', 'Akun') + ' · 04' },
  ]
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 1, 0.3, 1] },
  },
}

/* ─── Reusable atoms ────────────────────────────────────────────── */

function ProfileAvatar({ initial }) {
  return (
    <div className="relative shrink-0">
      <div className="absolute inset-0 bg-tertiary/20 blur-2xl rounded-full" />
      <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-tertiary/10 border-2 border-tertiary/25 text-tertiary text-2xl font-display font-black shadow-warm-md">
        {initial}
      </div>
    </div>
  )
}

function FieldRow({ icon: Icon, label, value, muted = false, action }) {
  return (
    <div className="flex items-start gap-3.5 rounded-xl border border-border/60 bg-bg-secondary/40 p-4">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tertiary/10 text-tertiary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-label uppercase tracking-widest text-secondary">
          {label}
        </p>
        <p
          className={cn(
            'truncate text-sm font-semibold mt-0.5',
            muted ? 'text-secondary' : 'text-primary'
          )}
        >
          {value}
        </p>
      </div>
      {action}
    </div>
  )
}

function SettingSwitch({ icon: Icon, label, description, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-start sm:items-center justify-between gap-3 sm:gap-4 rounded-xl border border-border/60 bg-bg-secondary/40 p-3.5 sm:p-4 transition-colors hover:border-tertiary/25">
      <div className="flex min-w-0 items-start sm:items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tertiary/10 text-tertiary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary leading-snug">{label}</p>
          <p className="mt-0.5 text-xs text-secondary leading-relaxed">{description}</p>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="shrink-0 mt-0.5 sm:mt-0"
        aria-label={label}
      />
    </label>
  )
}

function SectionCard({ eyebrow, title, subtitle, children, footer }) {
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="card-base p-4 sm:p-6 md:p-7 relative overflow-hidden min-w-0"
    >
      <div className="relative">
        <div className="mb-1">
          <span className="eyebrow !text-[10px]">{eyebrow}</span>
        </div>
        <h2 className="text-xl font-display font-bold text-primary leading-tight tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-secondary mt-1.5 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}

        <div className="mt-6 space-y-3">{children}</div>

        {footer && <div className="mt-6 pt-5 border-t border-border/60">{footer}</div>}
      </div>
    </motion.section>
  )
}

function statusLabel(status, t) {
  const map = {
    active: t('settings.session_status_active', 'Aktif'),
    ready: t('settings.session_status_ready', 'Siap'),
    processing: t('settings.session_status_processing', 'Memproses'),
  }
  return map[status] || status || '—'
}

function statusTone(status) {
  if (status === 'active' || status === 'ready') return 'text-success bg-success/10 border-success/20'
  if (status === 'processing') return 'text-warning bg-warning/10 border-warning/20'
  return 'text-secondary bg-secondary/10 border-border/60'
}

/* ─── Main ───────────────────────────────────────────────────────── */

export default function Settings() {
  const { t, i18n: i18nInstance } = useTranslation()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)
  const logout = useAuthStore((state) => state.logout)
  const activeSession = useLearningStore((state) => state.activeSession)
  const setActiveSession = useLearningStore((state) => state.setActiveSession)

  const { data: sessions = [], isLoading: sessionsLoading, refetch: refetchSessions } = useAllSessions()

  const [isExporting, setIsExporting] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)
  const [deletingSessionId, setDeletingSessionId] = useState(null)
  const [activeSection, setActiveSection] = useState('profil')
  const [exportSuccess, setExportSuccess] = useState(false)

  // Username edit
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [usernameDraft, setUsernameDraft] = useState(user?.username || '')
  const [isSavingUsername, setIsSavingUsername] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const [usernameSaved, setUsernameSaved] = useState(false)

  // Language
  const [isSavingLanguage, setIsSavingLanguage] = useState(false)
  const currentLang = (user?.language_preference || i18nInstance.language || 'id').startsWith('en')
    ? 'en'
    : 'id'

  // Notifications — fully interactive local state with persistence
  const initialNotif = useMemo(() => readNotifPrefs(), [])
  const [emailNotif, setEmailNotif] = useState(initialNotif.email)
  const [pushNotif, setPushNotif] = useState(initialNotif.push)

  useEffect(() => {
    setUsernameDraft(user?.username || '')
  }, [user?.username])

  useEffect(() => {
    writeNotifPrefs({ email: emailNotif, push: pushNotif })
  }, [emailNotif, pushNotif])

  const profileInitial = useMemo(
    () => (user?.username?.[0] || 'U').toUpperCase(),
    [user]
  )

  const sessionSummary = useMemo(() => {
    const session = activeSession || {}
    return {
      id: session.id || session.session_id || null,
      topic: session.topic || session.title || session.subject || '—',
      duration: session.duration_weeks
        ? t('settings.weeks', { count: session.duration_weeks, defaultValue: `${session.duration_weeks} minggu` })
        : session.duration || '—',
      level: session.level || '—',
    }
  }, [activeSession, t])

  const sortedSessions = useMemo(() => {
    if (!Array.isArray(sessions)) return []
    return [...sessions].sort((a, b) => {
      const da = a?.created_at ? new Date(a.created_at).getTime() : 0
      const db = b?.created_at ? new Date(b.created_at).getTime() : 0
      return db - da
    })
  }, [sessions])

  const exportProgress = useCallback(async () => {
    setIsExporting(true)
    setExportSuccess(false)
    try {
      const sessionId = sessionSummary.id
      const payload = {
        exported_at: new Date().toISOString(),
        user,
        active_session: activeSession,
        sessions: sortedSessions,
      }
      if (sessionId) {
        const [session, topics, quizHistory] = await Promise.all([
          getSession(sessionId),
          getTopics(sessionId),
          getQuizHistory(sessionId),
        ])
        payload.session_details = session
        payload.topics = topics
        payload.quiz_history = quizHistory
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `pla-progress-${format(new Date(), 'yyyy-MM-dd')}.json`
      link.click()
      URL.revokeObjectURL(url)
      setExportSuccess(true)
      setTimeout(() => setExportSuccess(false), 2500)
    } finally {
      setIsExporting(false)
    }
  }, [activeSession, sessionSummary.id, sortedSessions, user])

  const handleSaveUsername = useCallback(async () => {
    const next = usernameDraft.trim()
    setUsernameError('')
    if (!next) {
      setUsernameError(t('settings.username_required', 'Username tidak boleh kosong'))
      return
    }
    if (next.length < 2) {
      setUsernameError(t('settings.username_too_short', 'Username minimal 2 karakter'))
      return
    }
    if (next === user?.username) {
      setIsEditingUsername(false)
      return
    }

    setIsSavingUsername(true)
    try {
      const updated = await updateProfile({ username: next })
      updateUser({ username: updated.username })
      setIsEditingUsername(false)
      setUsernameSaved(true)
      setTimeout(() => setUsernameSaved(false), 2000)
    } catch (err) {
      const detail = err?.response?.data?.detail
      setUsernameError(
        typeof detail === 'string'
          ? detail
          : t('settings.username_save_failed', 'Gagal menyimpan username')
      )
    } finally {
      setIsSavingUsername(false)
    }
  }, [t, updateUser, user?.username, usernameDraft])

  const handleCancelUsername = useCallback(() => {
    setUsernameDraft(user?.username || '')
    setUsernameError('')
    setIsEditingUsername(false)
  }, [user?.username])

  const handleLanguageChange = useCallback(
    async (lang) => {
      if (!lang || lang === currentLang) return
      setIsSavingLanguage(true)
      try {
        await i18n.changeLanguage(lang)
        try {
          const updated = await updateLanguagePreference(lang)
          updateUser({ language_preference: updated.language_preference || lang })
        } catch {
          // UI language already switched; backend sync is best-effort
          updateUser({ language_preference: lang })
        }
      } finally {
        setIsSavingLanguage(false)
      }
    },
    [currentLang, updateUser]
  )

  const handleDeleteSession = useCallback(
    async (sessionId) => {
      if (!sessionId) return
      setDeletingSessionId(sessionId)
      try {
        await deleteSession(sessionId)
        if (activeSession?.id === sessionId) {
          setActiveSession(null)
        }
        await queryClient.invalidateQueries({ queryKey: ['sessions'] })
        await queryClient.invalidateQueries({ queryKey: ['active-session'] })
        await refetchSessions()
      } finally {
        setDeletingSessionId(null)
      }
    },
    [activeSession?.id, queryClient, refetchSessions, setActiveSession]
  )

  const handleDeleteAccount = useCallback(async () => {
    setIsDeletingAccount(true)
    try {
      await deleteAccount()
      logout()
      window.location.replace('/login')
    } catch {
      setIsDeletingAccount(false)
      setDeleteAccountOpen(false)
    }
  }, [logout])

  const username = user?.username || 'Pengguna'
  const email = user?.email || '—'
  const sections = getSections(t)

  return (
    <div className="mx-auto w-full max-w-5xl relative min-w-0">
      <span
        aria-hidden="true"
        className="absolute -top-2 -right-2 deco-num deco-num-secondary hidden md:block"
      >
        ✦
      </span>

      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <Settings2 className="h-3.5 w-3.5" />
            {t('settings.title', 'Pengaturan')}
          </span>
        }
        title={t('settings.title', 'Settings')}
        subtitle={t('settings.desc', 'Kelola profil, preferensi belajar, tampilan, dan data progresmu.')}
      />

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:gap-6">
        {/* Desktop nav rail */}
        <nav className="hidden lg:flex flex-col gap-1 w-56 shrink-0">
          <div className="mb-3">
            <span className="eyebrow !text-[10px]">{t('settings.section', 'Bagian')}</span>
          </div>
          {sections.map((section) => {
            const Icon = section.icon
            const isActive = activeSection === section.id
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'group relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left',
                  isActive
                    ? 'bg-tertiary/[0.08] text-tertiary'
                    : 'text-secondary hover:bg-bg-secondary/60 hover:text-primary'
                )}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-tertiary"
                  />
                )}
                <Icon
                  size={16}
                  className={cn(
                    'shrink-0',
                    isActive ? 'text-tertiary' : 'text-secondary/70 group-hover:text-primary'
                  )}
                />
                <span className="font-label">{section.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Mobile horizontal nav — full width row above content */}
        <div className="lg:hidden -mx-1 flex gap-2 overflow-x-auto overscroll-x-contain pb-1 scrollbar-none">
          {sections.map((section) => {
            const Icon = section.icon
            const isActive = activeSection === section.id
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors font-label shrink-0',
                  isActive
                    ? 'bg-tertiary/[0.08] text-tertiary border border-tertiary/20'
                    : 'text-secondary hover:bg-bg-secondary/60 hover:text-primary border border-border/60'
                )}
              >
                <Icon size={14} />
                {section.label}
              </button>
            )
          })}
        </div>

        {/* Sections */}
        <div className="w-full flex-1 space-y-5 min-w-0">
          {activeSection === 'profil' && (
            <SectionCard
              eyebrow={sections[0].eyebrow}
              title={t('settings.profile', 'Profil')}
              subtitle={t('settings.profile_desc', 'Informasi akun yang terhubung dengan Synapsa.')}
              footer={
                usernameSaved ? (
                  <div className="flex items-center gap-2 text-xs text-success font-label">
                    <CheckCircle2 className="size-3.5" />
                    {t('settings.username_saved', 'Username disimpan')}
                  </div>
                ) : null
              }
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <ProfileAvatar initial={profileInitial} />
                <div className="flex-1 space-y-2.5 min-w-0">
                  {/* Editable username */}
                  <div className="rounded-xl border border-border/60 bg-bg-secondary/40 p-4">
                    <div className="flex items-start gap-3.5">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tertiary/10 text-tertiary">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-label uppercase tracking-widest text-secondary">
                          {t('settings.username', 'Username')}
                        </p>
                        {isEditingUsername ? (
                          <div className="mt-2 space-y-2">
                            <Input
                              value={usernameDraft}
                              onChange={(e) => setUsernameDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveUsername()
                                if (e.key === 'Escape') handleCancelUsername()
                              }}
                              autoFocus
                              maxLength={100}
                              className="h-9 rounded-lg border-border bg-surface text-sm"
                              aria-label={t('settings.username', 'Username')}
                            />
                            {usernameError && (
                              <p className="text-xs text-danger">{usernameError}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={handleSaveUsername}
                                disabled={isSavingUsername}
                                className="h-8 rounded-lg bg-tertiary hover:bg-tertiary-light text-white font-label gap-1.5"
                              >
                                {isSavingUsername ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                )}
                                {t('settings.save', 'Simpan')}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={handleCancelUsername}
                                disabled={isSavingUsername}
                                className="h-8 rounded-lg font-label gap-1.5"
                              >
                                <X className="h-3.5 w-3.5" />
                                {t('settings.cancel', 'Batal')}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-0.5 flex items-center justify-between gap-3">
                            <p className="truncate text-sm font-semibold text-primary">{username}</p>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setUsernameDraft(username)
                                setUsernameError('')
                                setIsEditingUsername(true)
                              }}
                              className="h-8 shrink-0 rounded-lg font-label gap-1.5"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              {t('settings.edit', 'Edit')}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <FieldRow icon={Mail} label={t('settings.email', 'Email')} value={email} muted />

                  {/* Language preference */}
                  <div className="rounded-xl border border-border/60 bg-bg-secondary/40 p-4">
                    <div className="flex items-start gap-3.5">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tertiary/10 text-tertiary">
                        <Languages className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-2.5">
                        <div>
                          <p className="text-[10px] font-label uppercase tracking-widest text-secondary">
                            {t('settings.language', 'Pengaturan Bahasa')}
                          </p>
                          <p className="text-xs text-secondary mt-0.5">
                            {t('settings.language_desc', 'Bahasa antarmuka aplikasi')}
                          </p>
                        </div>
                        <Select
                          value={currentLang}
                          onValueChange={handleLanguageChange}
                          disabled={isSavingLanguage}
                        >
                          <SelectTrigger className="h-9 w-full max-w-xs rounded-lg border-border bg-surface text-sm text-primary shadow-warm-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-surface border-border shadow-warm-md z-[80]">
                            <SelectItem value="id">Bahasa Indonesia</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="rounded-lg border border-border/50 bg-surface/60 px-3 py-2.5">
                          <p className="text-xs leading-relaxed text-secondary">
                            {t(
                              'settings.language_note',
                              'Catatan: Perubahan bahasa hanya berlaku untuk antarmuka dan modul yang akan dibuat. Modul yang sudah digenerate sebelumnya tidak akan berubah bahasa.'
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {activeSection === 'belajar' && (
            <SectionCard
              eyebrow={sections[1].eyebrow}
              title={t('settings.learning', 'Belajar')}
              subtitle={t('settings.learning_desc', 'Kelola semua sesi belajar aktif dan sebelumnya.')}
            >
              {sessionsLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-secondary font-label">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('settings.loading_sessions', 'Memuat sesi...')}
                </div>
              ) : sortedSessions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/70 bg-bg-secondary/30 px-4 py-10 text-center">
                  <BookOpen className="mx-auto mb-3 h-8 w-8 text-secondary/50" />
                  <p className="text-sm font-semibold text-primary">
                    {t('settings.no_sessions_title', 'Belum ada sesi belajar')}
                  </p>
                  <p className="mt-1 text-xs text-secondary max-w-sm mx-auto">
                    {t(
                      'settings.no_sessions_desc',
                      'Mulai sesi baru dari onboarding untuk membuat kurikulum personal.'
                    )}
                  </p>
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {sortedSessions.map((session) => {
                    const isActive = activeSession?.id === session.id
                    const isDeleting = deletingSessionId === session.id
                    const created = session.created_at
                      ? format(new Date(session.created_at), 'dd MMM yyyy')
                      : '—'
                    return (
                      <li
                        key={session.id}
                        className={cn(
                          'group flex items-start gap-2.5 sm:gap-3 rounded-xl border bg-bg-secondary/40 p-3.5 sm:p-4 transition-colors min-w-0',
                          isActive
                            ? 'border-tertiary/30 bg-tertiary/[0.04]'
                            : 'border-border/60 hover:border-tertiary/25'
                        )}
                      >
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tertiary/10 text-tertiary">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="break-words text-sm font-semibold text-primary">
                              {session.topic || t('settings.untitled_session', 'Sesi tanpa judul')}
                            </p>
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-label uppercase tracking-wider',
                                statusTone(session.status)
                              )}
                            >
                              <CircleDot className="h-2.5 w-2.5" />
                              {statusLabel(session.status, t)}
                            </span>
                            {isActive && (
                              <span className="rounded-full bg-tertiary/10 px-2 py-0.5 text-[10px] font-label uppercase tracking-wider text-tertiary">
                                {t('settings.current_session', 'Sesi saat ini')}
                              </span>
                            )}
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-secondary font-label">
                            <span className="inline-flex items-center gap-1">
                              <Clock3 className="h-3 w-3" />
                              {session.duration_weeks
                                ? t('settings.weeks', {
                                    count: session.duration_weeks,
                                    defaultValue: `${session.duration_weeks} minggu`,
                                  })
                                : '—'}
                            </span>
                            <span>{session.level || '—'}</span>
                            <span>{created}</span>
                          </div>
                        </div>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              type="button"
                              disabled={isDeleting}
                              aria-label={t('settings.delete_session', 'Hapus sesi')}
                              className={cn(
                                'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-secondary/60',
                                'opacity-70 transition-all hover:bg-danger/[0.08] hover:text-danger hover:opacity-100',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40',
                                'disabled:pointer-events-none disabled:opacity-40',
                                'sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100'
                              )}
                            >
                              {isDeleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {t('settings.delete_session_title', 'Hapus sesi belajar?')}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t(
                                  'settings.delete_session_desc',
                                  'Sesi “{{topic}}” dan progres terkait akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.',
                                  { topic: session.topic || '—' }
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl">
                                {t('settings.cancel', 'Batal')}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteSession(session.id)}
                                className="rounded-xl bg-danger hover:bg-danger/90 text-white"
                              >
                                {t('settings.delete', 'Hapus')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </li>
                    )
                  })}
                </ul>
              )}
            </SectionCard>
          )}

          {activeSection === 'notifikasi' && (
            <SectionCard
              eyebrow={sections[2].eyebrow}
              title={t('settings.notifications', 'Notifikasi')}
              subtitle={t('settings.notifications_desc', 'Atur bagaimana Synapsa menghubungimu.')}
            >
              <SettingSwitch
                icon={Mail}
                label={t('settings.email_notif', 'Email notifikasi')}
                description={t('settings.email_notif_desc', 'Terima update progres via email')}
                checked={emailNotif}
                onChange={setEmailNotif}
              />
              <SettingSwitch
                icon={Bell}
                label={t('settings.push_notif', 'Push notifikasi')}
                description={t('settings.push_notif_desc', 'Terima notifikasi di browser')}
                checked={pushNotif}
                onChange={setPushNotif}
              />
              <p className="text-xs text-secondary font-label pt-1">
                {t(
                  'settings.notif_prefs_hint',
                  'Preferensi disimpan di perangkat ini.'
                )}
              </p>
            </SectionCard>
          )}

          {activeSection === 'data' && (
            <SectionCard
              eyebrow={sections[3].eyebrow}
              title={t('settings.data', 'Data')}
              subtitle={t('settings.data_desc', 'Ekspor progresmu atau kelola akun.')}
              footer={
                <div>
                  <h3 className="text-[10px] font-label uppercase tracking-widest text-danger mb-3">
                    {t('settings.danger_zone', 'Zona Berbahaya')}
                  </h3>
                  <AlertDialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="rounded-xl font-label gap-2 border-danger/30 text-danger hover:bg-danger/[0.04] hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                        {t('settings.delete_account', 'Hapus Akun')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t('settings.delete_account_title', 'Hapus akun?')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t(
                            'settings.delete_account_desc',
                            'Apakah kamu yakin? Tindakan ini tidak dapat dibatalkan. Semua data akun, sesi belajar, dan progres akan dihapus permanen.'
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel
                          className="rounded-xl"
                          disabled={isDeletingAccount}
                        >
                          {t('settings.cancel', 'Batal')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => {
                            e.preventDefault()
                            handleDeleteAccount()
                          }}
                          disabled={isDeletingAccount}
                          className="rounded-xl bg-danger hover:bg-danger/90 text-white gap-2"
                        >
                          {isDeletingAccount ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              {t('settings.deleting', 'Menghapus...')}
                            </>
                          ) : (
                            t('settings.confirm_delete', 'Ya, hapus akun')
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              }
            >
              <Button
                onClick={exportProgress}
                disabled={isExporting}
                className="rounded-xl bg-tertiary hover:bg-tertiary-light text-white font-label gap-2 shadow-warm-md"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : exportSuccess ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isExporting
                  ? t('settings.exporting', 'Mengekspor...')
                  : exportSuccess
                  ? t('settings.saved', 'Tersimpan!')
                  : t('settings.export_progress', 'Export Progress')}
              </Button>
              <p className="text-xs text-secondary font-label">
                {t('settings.export_desc', 'Mengunduh seluruh data sesi, topik, dan riwayat kuis dalam format JSON.')}
              </p>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  )
}
