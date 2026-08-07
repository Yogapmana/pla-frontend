import React, { useMemo, useState, Suspense } from 'react'
import { useActiveSession, useCurriculum, useTopics } from '@/hooks/useLearning'
import { TopicNode } from '@/components/curriculum/TopicNode'
import WeekCard from '@/components/curriculum/WeekCard'
import { ProgressRing } from '@/components/curriculum/ProgressRing'
import {
  BookOpen,
  Sparkles,
  Play,
  Check,
  Clock,
  Calendar,
  Target,
  Trophy,
  Brain,
  Network,
  ArrowLeft,
} from 'lucide-react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import PageHeader from '@/components/common/PageHeader'
import StatusBadge from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// Lazy-load the AI mind map view — Mermaid is heavy (~700KB across all
// diagram types) and only needed when the user toggles to that view.
const MindMapView = React.lazy(() => import('@/components/curriculum/MindMapView'))

/**
 * Curriculum page (Phase polish)
 *
 * Layout (top → bottom):
 *   1. PageHeader — title + course title
 *   2. HeroStats  — big progress ring + total/active counts
 *   3. Today's Focus banner (when there's an active topic)
 *   4. Week Grid  — detailed week cards (3-col on desktop)
 *
 * The page tells a story: "you're here in your journey, this is your
 * next step, this is what's coming". The visual hierarchy reflects
 * that narrative.
 */
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

export default function Curriculum() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: activeSession, isLoading: isLoadingSession } = useActiveSession()
  const sessionId = activeSession?.id
  const shouldReduceMotion = useReducedMotion()

  // 'roadmap' = Week Grid
  // 'mindmap' = AI-generated Mermaid diagram
  const [viewMode, setViewMode] = useState('roadmap')
  const [selectedWeek, setSelectedWeek] = useState(null)

  const { data: curriculumData, isLoading: isLoadingCurriculum } = useCurriculum(sessionId)
  const { data: topicsData, isLoading: isLoadingTopics } = useTopics(sessionId)
  const isLoading = isLoadingSession || isLoadingCurriculum || isLoadingTopics

  // Derive all stats in a single pass
  const { weeks, topics, completedTopics, totalTopics, progressPercentage } =
    useMemo(() => {
      if (!curriculumData || !topicsData) {
        return {
          weeks: [],
          topics: [],
          completedTopics: 0,
          totalTopics: 0,
          progressPercentage: 0,
        }
      }
      const curriculumJson = curriculumData.curriculum_json || {}
      const rawWeeks = curriculumJson.weeks || []
      const mappedWeeks = rawWeeks.map((w, i) => ({
        ...w,
        week_number: w.week_number ?? w.week ?? i + 1,
      }))
      const allTopics = Array.isArray(topicsData) ? topicsData : topicsData.topics || []
      const completed = allTopics.filter((t) => t.status === 'completed').length
      const total = allTopics.length
      const pct = total === 0 ? 0 : (completed / total) * 100

      return {
        weeks: mappedWeeks,
        topics: allTopics,
        completedTopics: completed,
        totalTopics: total,
        progressPercentage: pct,
      }
    }, [curriculumData, topicsData])

  const topicsByWeek = useMemo(() => {
    const grouped = {}
    topics.forEach((topic) => {
      const wk = topic.week_number ?? 1
      if (!grouped[wk]) grouped[wk] = []
      grouped[wk].push(topic)
    })
    Object.values(grouped).forEach((arr) =>
      arr.sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0))
    )
    return grouped
  }, [topics])

  const courseTitle = useMemo(() => {
    if (!curriculumData) return ''
    const json = curriculumData.curriculum_json || {}
    return json.title || activeSession?.topic || ''
  }, [curriculumData, activeSession])

  // Find the active topic (for "Today's Focus" banner)
  const activeTopic = topics.find((t) => t.status === 'active')
  const activeWeekNumber = activeTopic?.week_number

  // ─── Loading state ───
  if (isLoading) {
    return (
      <div className="container max-w-5xl py-10 px-4 md:px-8 space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  // ─── Empty state ───
  if (!activeSession || !curriculumData || !topicsData) {
    return (
      <div className="container max-w-5xl py-10 px-4 md:px-8">
        <div className="card-base p-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-tertiary/10 text-tertiary flex items-center justify-center mb-4">
            <BookOpen size={28} />
          </div>
          <h3 className="font-display font-semibold text-xl text-primary">
            {t('curriculum.empty_title', 'Belum ada kurikulum')}
          </h3>
          <p className="text-secondary mt-2 max-w-sm mx-auto">
            {t('curriculum.empty_desc', 'Mulai perjalanan belajarmu dengan membuat kurikulum baru melalui onboarding.')}
          </p>
          <Button
            onClick={() => navigate('/onboarding')}
            variant="tertiary"
            className="mt-5 rounded-xl font-label"
          >
            {t('curriculum.start_onboarding', 'Mulai Onboarding')}
          </Button>
        </div>
      </div>
    )
  }

  const progressValue = progressPercentage / 100
  const allDone = totalTopics > 0 && completedTopics === totalTopics

  return (
    <div className="container mx-auto max-w-5xl py-8 md:py-10 px-4 md:px-8 space-y-7">
      <PageHeader
        title={t('curriculum.title', 'Kurikulum')}
        subtitle={courseTitle}
        actions={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* View mode toggle */}
            <div
              data-tour="curriculum-view"
              role="tablist"
              aria-label="Pilih tampilan kurikulum"
              className="inline-flex items-center gap-1 p-1 bg-surface-1 border border-border-subtle rounded-xl"
            >
              <ViewTab
                active={viewMode === 'roadmap'}
                onClick={() => {
                  setViewMode('roadmap')
                  setSelectedWeek(null)
                }}
                icon={Network}
                label={t('curriculum.roadmap', 'Roadmap')}
              />
              <ViewTab
                active={viewMode === 'mindmap'}
                onClick={() => {
                  setViewMode('mindmap')
                  setSelectedWeek(null)
                }}
                icon={Brain}
                label={t('curriculum.mindmap', 'Peta Konsep')}
              />
            </div>
          </div>
        }
      />

      {/* ─── Hero progress section ─── */}
      <motion.div
        data-tour="curriculum-progress"
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="card-base p-6 md:p-8 relative overflow-hidden"
      >
        {/* Decorative background */}
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-tertiary/[0.04] blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-warning/[0.06] blur-3xl pointer-events-none"
        />

        <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-10">
          {/* Big progress ring */}
          <motion.div variants={fadeUp} className="shrink-0">
            <ProgressRing
              value={progressValue}
              size={180}
              strokeWidth={12}
              label={`${Math.round(progressPercentage)}%`}
              sublabel={t('curriculum.completed', 'Selesai')}
              tone={allDone ? 'success' : 'tertiary'}
            />
          </motion.div>

          {/* Stat cards */}
          <motion.div variants={fadeUp} className="flex-1 grid grid-cols-2 md:grid-cols-2 gap-3 w-full">
            <HeroStat
              icon={Check}
              value={completedTopics}
              label={t('curriculum.completed_topics', 'Topik Selesai')}
              tone="success"
            />
            <HeroStat
              icon={Target}
              value={totalTopics - completedTopics}
              label={t('curriculum.remaining_topics', 'Topik Tersisa')}
              tone="tertiary"
            />
            <HeroStat
              icon={Calendar}
              value={weeks.length}
              label={t('curriculum.total_weeks', 'Minggu Total')}
              tone="info"
            />
            <HeroStat
              icon={Trophy}
              value={allDone ? '✓' : Math.round(progressPercentage) + '%'}
              label={allDone ? t('curriculum.passed', 'Lulus') : t('curriculum.progress', 'Progres')}
              tone={allDone ? 'success' : 'warning'}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* ─── Today's Focus banner ─── */}
      {activeTopic && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          className="card-base card-hover card-interactive p-5 md:p-6 bg-gradient-to-br from-tertiary/8 via-warning/5 to-transparent border-tertiary/20 relative overflow-hidden"
        >
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-tertiary/8 blur-2xl"
          />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge variant="accent" size="sm" icon={Sparkles}>
                  {t('curriculum.todays_focus', 'Fokus Hari Ini')}
                </StatusBadge>
                {activeTopic.duration_minutes && (
                  <span className="inline-flex items-center gap-1 text-xs text-secondary font-label">
                    <Clock size={11} />
                    <span className="tabular-nums">{activeTopic.duration_minutes} {t('curriculum.minutes', 'menit')}</span>
                  </span>
                )}
              </div>
              <h3 className="font-display text-2xl font-bold text-primary leading-tight">
                {activeTopic.title}
              </h3>
              {activeWeekNumber && (
                <p className="text-xs text-secondary font-label">
                  {t('curriculum.week_of_curriculum', { week: activeWeekNumber, defaultValue: `Minggu ${activeWeekNumber} dari kurikulum` })}
                </p>
              )}
            </div>
            <Button
              variant="tertiary"
              size="lg"
              onClick={() => navigate(`/module/${activeTopic.id}`)}
              className="shrink-0 rounded-xl font-label tracking-wide"
            >
              <Play size={16} fill="currentColor" />
              {t('curriculum.start_learning', 'Mulai Belajar')}
            </Button>
          </div>
        </motion.div>
      )}

      {/* ─── View: Mind Map (Overview | Konsep sub-modes handled inside) ─── */}
      {viewMode === 'mindmap' && (
        <motion.div
          key="mindmap-view"
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
        >
          <Suspense fallback={<MindMapLoadingSkeleton />}>
            <MindMapView sessionId={sessionId} courseTitle={courseTitle} />
          </Suspense>
        </motion.div>
      )}

      {/* ─── View: Roadmap (Week Grid) ─── */}
      {viewMode === 'roadmap' && (
        <motion.div
          key="roadmap-view"
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
          className="space-y-7"
        >
          {/* ─── Week Grid or Week Detail ─── */}
          <AnimatePresence mode="wait">
            {selectedWeek ? (
              <motion.div
                key="detail-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                className="space-y-6"
              >
                <div className="flex flex-col gap-4">
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedWeek(null)}
                    className="w-fit -ml-2 text-secondary hover:text-primary gap-2"
                  >
                    <ArrowLeft size={16} />
                    {t('curriculum.back_to_weeks', 'Kembali ke Daftar Minggu')}
                  </Button>
                  
                  <div className="card-base p-6 border-tertiary/20 bg-gradient-to-br from-tertiary/[0.02] to-transparent">
                    <h2 className="text-2xl font-display font-bold text-primary mb-2">
                      {t('curriculum.week_title', { week: selectedWeek.week_number, title: selectedWeek.title || 'Topik Belajar', defaultValue: `Minggu ${selectedWeek.week_number}: ${selectedWeek.title || 'Topik Belajar'}` })}
                    </h2>
                    <p className="text-secondary font-label text-sm mb-6">
                      {t('curriculum.select_module', 'Pilih modul di bawah ini untuk mulai belajar.')}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(topicsByWeek[selectedWeek.week_number] || []).map((topic) => (
                        <div key={topic.id} className="bg-surface border border-border/50 rounded-xl">
                          <TopicNode topic={topic} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="grid-view"
                data-tour="curriculum-week"
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start"
                variants={shouldReduceMotion ? { hidden: {}, visible: {} } : stagger}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
              >
                {weeks.map((week, i) => (
                  <div
                    key={week.week_number ?? i}
                    className="scroll-mt-24"
                  >
                    <WeekCard
                      week={week}
                      topics={topicsByWeek[week.week_number] || []}
                      weekIndex={i}
                      isActive={week.week_number === activeWeekNumber}
                      onClick={(w) => setSelectedWeek(w)}
                    />
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state when no weeks */}
          {weeks.length === 0 && (
            <div className="card-base p-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-tertiary/10 text-tertiary flex items-center justify-center mb-4">
                <Calendar size={28} />
              </div>
              <h3 className="font-display font-semibold text-xl text-primary">
                {t('curriculum.empty_weeks_title', 'Kurikulum kosong')}
              </h3>
              <p className="text-secondary mt-2 max-w-sm mx-auto">
                {t('curriculum.empty_weeks_desc', 'Kurikulum ini belum memiliki minggu/topik. Coba mulai ulang onboarding.')}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

/**
 * Toggle button used in the view-mode switcher (Roadmap | Peta Konsep).
 */
function ViewTab({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-label font-medium',
        'transition-all duration-200 focus:outline-none focus-visible:ring-2',
        'focus-visible:ring-tertiary focus-visible:ring-offset-1',
        active
          ? 'bg-surface-0 text-primary shadow-warm-sm'
          : 'text-secondary hover:text-primary hover:bg-surface-0/50'
      )}
    >
      <Icon size={13} aria-hidden="true" />
      <span>{label}</span>
    </button>
  )
}

/**
 * Loading skeleton for the lazy-loaded MindMapView (Suspense fallback).
 */
function MindMapLoadingSkeleton() {
  return (
    <div className="card-base p-5 md:p-7 space-y-4" aria-busy="true">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-32 rounded-full" />
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
      <Skeleton className="h-[420px] w-full rounded-2xl" />
    </div>
  )
}

/**
 * Single hero stat card (compact) — used in the hero progress row.
 */
function HeroStat({ icon: Icon, value, label, tone = 'tertiary' }) {
  const toneClass = {
    tertiary: 'bg-tertiary/10 text-tertiary',
    success: 'bg-success-light text-success-fg',
    info: 'bg-info-light text-info-fg',
    warning: 'bg-warning-light text-warning-fg',
  }[tone];

  return (
    <div className="card-base p-4 hover:shadow-warm-sm transition-shadow duration-200">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
            toneClass
          )}
        >
          <Icon size={18} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-label uppercase tracking-wider text-secondary">
            {label}
          </div>
          <div className="font-display text-xl font-bold text-primary tabular-nums leading-none mt-1">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}
