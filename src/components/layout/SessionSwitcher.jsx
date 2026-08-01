import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, Check, ChevronDown, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useAllSessions } from '@/hooks/useLearning'
import { useLearningStore } from '@/stores/learningStore'
import { cn } from '@/lib/utils'

const MAX_SESSIONS = 3

/**
 * Compact session context chip for the global Topbar.
 * Switch active learning path without competing with sidebar navigation.
 */
export default function SessionSwitcher({ className }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { activeSession, setActiveSession } = useLearningStore()
  const { data: allSessions = [], isLoading } = useAllSessions()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  const sessions = Array.isArray(allSessions) ? allSessions : []
  const hasSessions = sessions.length > 0
  const atLimit = sessions.length >= MAX_SESSIONS
  const label =
    activeSession?.topic ||
    t('session_switcher.select', 'Pilih sesi')

  useEffect(() => {
    if (!open) return undefined

    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!hasSessions && !isLoading) return null

  return (
    <div ref={rootRef} className={cn('relative shrink-0', className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('session_switcher.label', 'Sesi belajar aktif')}
        className={cn(
          'group flex max-w-[9.5rem] items-center gap-1.5 rounded-full border px-2 py-1.5 min-[380px]:max-w-[11rem] sm:max-w-[14rem] sm:gap-2 sm:px-3',
          'border-tertiary/20 bg-surface text-left shadow-warm-xs',
          'transition-all duration-150',
          'hover:border-tertiary/35 hover:bg-tertiary/[0.04] hover:shadow-warm-sm',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary/40',
          open && 'border-tertiary/40 bg-tertiary/[0.05]'
        )}
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-tertiary/10 text-tertiary">
          <BookOpen size={13} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[11px] font-semibold leading-tight text-primary sm:text-xs">
            {label}
          </span>
        </span>
        <ChevronDown
          size={14}
          className={cn(
            'shrink-0 text-secondary transition-transform duration-150',
            open && 'rotate-180 text-tertiary'
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            role="listbox"
            aria-label={t('session_switcher.list', 'Daftar sesi belajar')}
            className={cn(
              'absolute left-0 top-[calc(100%+8px)] z-50 w-[min(18rem,calc(100vw-2rem))] overflow-hidden',
              'rounded-xl border border-tertiary/15 bg-surface shadow-warm-lg'
            )}
          >
            <div className="border-b border-border/60 px-3 py-2">
              <p className="text-[10px] font-label uppercase tracking-widest text-secondary">
                {t('session_switcher.heading', 'Sesi belajar')}
              </p>
            </div>

            <div className="max-h-56 overflow-y-auto py-1">
              {sessions.map((session) => {
                const isActive = activeSession?.id === session.id
                return (
                  <button
                    key={session.id}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => {
                      setActiveSession(session)
                      queryClient.setQueryData(['active-session'], session)
                      setOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors',
                      isActive
                        ? 'bg-tertiary/[0.06] text-tertiary'
                        : 'text-secondary hover:bg-secondary/5 hover:text-primary'
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full',
                        isActive ? 'bg-tertiary/15 text-tertiary' : 'bg-secondary/10 text-secondary'
                      )}
                    >
                      {isActive ? <Check size={12} /> : <BookOpen size={12} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold leading-tight">
                        {session.topic || t('session_switcher.untitled', 'Sesi tanpa judul')}
                      </span>
                      <span className="mt-0.5 block text-[10px] font-label uppercase tracking-wider opacity-70">
                        {[session.level, session.language].filter(Boolean).join(' · ') || '—'}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="border-t border-border/60 bg-bg-secondary/40 p-2">
              <button
                type="button"
                disabled={atLimit}
                onClick={() => {
                  setOpen(false)
                  navigate('/onboarding?new=true')
                }}
                className={cn(
                  'flex w-full items-center justify-center gap-1.5 rounded-lg px-2.5 py-2',
                  'text-xs font-semibold text-tertiary transition-colors',
                  'hover:bg-tertiary/10',
                  'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent'
                )}
              >
                <Plus size={14} />
                {atLimit
                  ? t('session_switcher.limit_reached', 'Batas sesi tercapai')
                  : t('session_switcher.create_new', 'Buat sesi baru')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
