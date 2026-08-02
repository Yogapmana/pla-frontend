import React from 'react'
import {
  BookOpen,
  HelpCircle,
  MessageSquare,
  ChevronRight,
  Inbox,
  ArrowRight,
  Clock,
  Star,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

/**
 * RecentActivity — full activity feed (quiz, reading, topic, chat, assessment).
 */

const TYPE_CONFIG = {
  topic: {
    icon: BookOpen,
    colorClass: 'text-success-fg',
    bgClass: 'bg-success-light',
    defaultLabel: 'Selesai',
    labelKey: 'dashboard.done',
  },
  quiz: {
    icon: HelpCircle,
    colorClass: 'text-info-fg',
    bgClass: 'bg-info-light',
    defaultLabel: 'Kuis',
    labelKey: 'dashboard.quiz',
  },
  chat: {
    icon: MessageSquare,
    colorClass: 'text-warning-fg',
    bgClass: 'bg-warning-light',
    defaultLabel: 'Chat',
    labelKey: 'dashboard.chat',
  },
  reading: {
    icon: Clock,
    colorClass: 'text-tertiary',
    bgClass: 'bg-tertiary/10',
    defaultLabel: 'Membaca',
    labelKey: 'dashboard.reading',
  },
  assessment: {
    icon: Star,
    colorClass: 'text-warning-fg',
    bgClass: 'bg-warning-light',
    defaultLabel: 'Penilaian',
    labelKey: 'dashboard.assessment',
  },
}

function getScoreConfig(score) {
  if (score == null) return null
  if (score >= 90) return { label: 'quiz.excellent', defaultLabel: 'Sangat Baik', class: 'pill-success' }
  if (score >= 75) return { label: 'quiz.good', defaultLabel: 'Baik', class: 'pill-info' }
  if (score >= 60) return { label: 'quiz.fair', defaultLabel: 'Cukup', class: 'pill-warning' }
  return { label: 'quiz.needs_review', defaultLabel: 'Perlu Review', class: 'pill-danger' }
}

/** Relative time in ID/EN-friendly short form. */
function formatRelativeTime(iso, t) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const diffMs = Date.now() - date.getTime()
  const sec = Math.floor(diffMs / 1000)
  if (sec < 60) return t('dashboard.time_just_now', 'Baru saja')
  const min = Math.floor(sec / 60)
  if (min < 60) return t('dashboard.time_mins_ago', { n: min, defaultValue: `${min} mnt lalu` })
  const hr = Math.floor(min / 60)
  if (hr < 24) return t('dashboard.time_hours_ago', { n: hr, defaultValue: `${hr} jam lalu` })
  const day = Math.floor(hr / 24)
  if (day < 7) return t('dashboard.time_days_ago', { n: day, defaultValue: `${day} hari lalu` })
  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function RecentActivity({ activities = [], isLoading = false }) {
  const { t } = useTranslation()
  return (
    <div className="card-base overflow-hidden h-full flex flex-col min-w-0">
      <div className="p-5 flex justify-between items-center gap-3">
        <div className="min-w-0">
          <p className="eyebrow !text-[10px] mb-1">
            {t('dashboard.history_activity', 'Riwayat · Aktivitas')}
          </p>
          <h3 className="text-lg font-display font-semibold text-primary">
            {t('dashboard.recent_activity', 'Aktivitas Terakhir')}
          </h3>
        </div>
        {activities.length > 0 && (
          <Link
            to="/progress"
            className="text-sm font-medium text-tertiary hover:text-tertiary-dark transition-colors flex items-center gap-1 group shrink-0"
          >
            {t('dashboard.view_all', 'Lihat semua')}
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-0 divide-y divide-[rgba(58,41,22,0.06)]">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3.5 p-4 animate-pulse">
                <div className="size-10 rounded-xl bg-secondary/10 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-2/3 rounded bg-secondary/10" />
                  <div className="h-3 w-1/3 rounded bg-secondary/10" />
                </div>
              </div>
            ))}
          </div>
        ) : !activities.length ? (
          <div className="p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mb-4">
              <Inbox className="w-7 h-7 text-secondary/50" strokeWidth={1.5} />
            </div>
            <h4 className="font-display font-semibold text-primary text-lg mb-1">
              {t('dashboard.no_activity', 'Belum ada aktivitas')}
            </h4>
            <p className="text-sm text-secondary mt-1 max-w-sm mx-auto leading-relaxed">
              {t(
                'dashboard.no_activity_desc',
                'Mulai belajar untuk melihat riwayat aktivitasmu di sini. Baca modul, ambil kuis, atau chat tutor.'
              )}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[rgba(58,41,22,0.06)]">
            {activities.map((activity, index) => {
              const {
                type,
                title,
                description,
                created_at,
                time,
                score,
                topicId,
                topic_id,
                href,
              } = activity
              const config = TYPE_CONFIG[type] || TYPE_CONFIG.quiz
              const Icon = config.icon
              const tid = topicId || topic_id

              const scoreConfig =
                score != null
                  ? getScoreConfig(score)
                  : {
                      label: config.labelKey,
                      defaultLabel: config.defaultLabel,
                      class: 'pill-neutral',
                    }

              const itemHref =
                href ||
                (type === 'quiz' && tid
                  ? `/progress/topic/${encodeURIComponent(tid)}`
                  : type === 'topic' && tid
                    ? `/module/${encodeURIComponent(tid)}`
                    : type === 'reading' && tid
                      ? `/module/${encodeURIComponent(tid)}`
                      : type === 'chat'
                        ? tid
                          ? `/chat/${encodeURIComponent(tid)}`
                          : '/chat'
                        : null)

              const timeLabel = formatRelativeTime(created_at || time, t)

              const content = (
                <>
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                      config.bgClass
                    )}
                  >
                    <Icon className={cn('w-5 h-5', config.colorClass)} strokeWidth={2} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-primary truncate">{title}</p>
                      <span className={cn('pill text-[10px] shrink-0', scoreConfig.class)}>
                        {t(scoreConfig.label, scoreConfig.defaultLabel)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-secondary truncate">{description}</p>
                      <span
                        className="text-[11px] text-secondary/60 whitespace-nowrap shrink-0 tabular-nums"
                        title={
                          created_at
                            ? new Date(created_at).toLocaleString('id-ID')
                            : undefined
                        }
                      >
                        {timeLabel}
                      </span>
                    </div>
                  </div>

                  {itemHref && (
                    <ArrowRight
                      className="w-4 h-4 text-tertiary/0 group-hover:text-tertiary transition-all duration-200 shrink-0 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  )}
                </>
              )

              return itemHref ? (
                <Link
                  key={activity.id || index}
                  to={itemHref}
                  className="flex items-center gap-3.5 p-4 hover:bg-secondary/[0.04] transition-colors group"
                >
                  {content}
                </Link>
              ) : (
                <div
                  key={activity.id || index}
                  className="flex items-center gap-3.5 p-4 hover:bg-secondary/[0.04] transition-colors group"
                >
                  {content}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
