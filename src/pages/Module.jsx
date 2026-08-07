import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLearningStore } from '@/stores/learningStore'
import { useModule, useTopics } from '@/hooks/useLearning'
import { generateModule } from '@/api/learning'
import { Skeleton } from '@/components/ui/skeleton'
import EmptyState from '@/components/common/EmptyState'
import ModuleTopbar from '@/components/module/ModuleTopbar'
import ModuleContent from '@/components/module/ModuleContent'
import ResourceCard from '@/components/module/ResourceCard'
import CourseCard from '@/components/module/CourseCard'
import StickyActionBar from '@/components/module/StickyActionBar'
import ReadingTracker from '@/components/module/ReadingTracker'
import ModuleChatPanel from '@/components/module/ModuleChatSlider'
import { BookOpen, GraduationCap, Loader2 } from 'lucide-react'
import ReadingProgressBar from '@/components/module/ReadingProgressBar'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'

/**
 * Module page
 *
 * Layout (final):
 *   - Single page scroll, same as every other page in the app.
 *   - Article column is `flex-1` and shrinks when Tutor AI is open.
 *   - Desktop (lg+): Tutor AI is a collapsible + resizable split-pane
 *     sidebar that takes real layout width (not an overlay drawer).
 *   - Mobile/tablet: floating semi-circle trigger + bottom sheet.
 *   - The StickyActionBar lives INSIDE the article column, sticky to
 *     the bottom of the viewport. "Tandai Selesai" stays visible.
 */

function ModuleSkeleton() {
  return (
    <div className="mx-auto max-w-[720px] px-4 md:px-6 pt-10 pb-4">
      <div className="space-y-3 mb-8">
        <Skeleton className="h-5 w-32 skeleton-shimmer" />
        <Skeleton className="h-10 w-3/4 skeleton-shimmer" />
      </div>
      <div className="space-y-5">
        <Skeleton className="h-7 w-2/3 skeleton-shimmer" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full skeleton-shimmer" />
          <Skeleton className="h-4 w-5/6 skeleton-shimmer" />
          <Skeleton className="h-4 w-4/6 skeleton-shimmer" />
        </div>
        <Skeleton className="h-40 w-full rounded-xl skeleton-shimmer" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full skeleton-shimmer" />
          <Skeleton className="h-4 w-3/4 skeleton-shimmer" />
        </div>
      </div>
    </div>
  )
}

function GeneratingState() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-tertiary/10 mb-6">
        <Loader2 className="size-8 animate-spin text-tertiary" />
      </div>
      <h2 className="text-xl font-display font-bold tracking-tight text-primary mb-2">
        {t('module.generating_title')}
      </h2>
      <p className="text-secondary max-w-md text-center text-sm leading-relaxed">
        {t('module.generating_desc')}
      </p>
    </div>
  )
}

function GenerationFailedState({ onRetry, onBack }) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-danger/10 mb-6">
        <Loader2 className="size-8 text-danger" />
      </div>
      <h2 className="text-xl font-display font-bold tracking-tight text-primary mb-2">
        {t('module.generation_failed_title', 'Gagal Membuat Modul')}
      </h2>
      <p className="text-secondary max-w-md text-sm leading-relaxed mb-6">
        {t('module.generation_failed_desc', 'Proses pembuatan modul memakan waktu terlalu lama atau terjadi kesalahan. Silakan coba lagi.')}
      </p>
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onBack}>{t('module.back_to_curriculum')}</Button>
        <Button onClick={onRetry}>{t('module.retry', 'Coba Lagi')}</Button>
      </div>
    </div>
  )
}

function ModuleArticle({ module }) {
  const { t } = useTranslation();
  const [activeVideoUrl, setActiveVideoUrl] = useState(null)
  const sources = module.sources ?? []
  const courses = module.courses ?? []

  return (
    <article className="relative mx-auto max-w-[720px] px-4 md:px-6 pt-8 md:pt-10 pb-4">
      {/* Decorative oversized numeral — small enough to NOT overlap content */}
      <span
        aria-hidden="true"
        className="absolute top-2 -left-2 font-display text-[4rem] font-black italic text-tertiary/[0.05] leading-none pointer-events-none select-none hidden md:block"
      >
        ✦
      </span>

      {/* Eyebrow — establishes editorial hierarchy */}
      <div className="mb-3">
        <span className="eyebrow">{t('module.learning_material')}</span>
      </div>

      {/* Article body — title is shown in the sticky topbar above and as
          the first H1 in the markdown body itself. No duplicate H1 here
          (Phase fix — the H1 was rendering twice in a row). */}
      <ModuleContent content={module.content_markdown} topicTitle={module.title} />

      {/* Citations / sources — at the END of the article, not in a sidebar.
          They're part of the reading experience, not a floating rail. */}
      {sources.length > 0 && (
        <section className="mt-16 pt-8 border-t border-border">
          <div className="mb-5">
            <span className="eyebrow">{t('module.reference')}</span>
          </div>
          <h2 className="mb-5 flex items-center gap-2.5 text-xl font-display font-bold text-primary tracking-tight">
            <BookOpen className="size-5 text-tertiary" aria-hidden="true" />
            {t('module.sources_used')}
          </h2>
          <div className="space-y-2.5">
            {sources.map((source, i) => (
              <ResourceCard
                key={`${source.url || source.title}-${i}`}
                source={source}
                activeVideoUrl={activeVideoUrl}
                onToggleVideo={setActiveVideoUrl}
              />
            ))}
          </div>
        </section>
      )}

      {/* External courses — also at the end, after sources */}
      {courses.length > 0 && (
        <section className="mt-12 pt-8 border-t border-border">
          <div className="mb-5">
            <span className="eyebrow">{t('module.learn_more')}</span>
          </div>
          <h2 className="mb-5 flex items-center gap-2.5 text-xl font-display font-bold text-primary tracking-tight">
            <GraduationCap className="size-5 text-tertiary" aria-hidden="true" />
            {t('module.related_courses')}
          </h2>
          <div className="space-y-2.5">
            {courses.map((course, i) => (
              <CourseCard
                key={`${course.url || course.title}-${i}`}
                course={course}
              />
            ))}
          </div>
        </section>
      )}

      {/* Supplementary Materials (Remedial & Deep Dive) */}
      {(module.remedial_markdown || module.deep_dive_markdown) && (
        <section className="mt-12 pt-8 border-t border-border">
          <div className="mb-5">
            <span className="eyebrow">Materi Tambahan</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            {module.remedial_markdown && (
              <a 
                href={`/module/${module.topic_id}/remedial`}
                className="flex-1 rounded-xl border border-danger/20 bg-danger/10 p-5 hover:bg-danger/20 transition-colors"
              >
                <h3 className="font-display font-bold text-danger mb-2">Materi Remedial Tersedia</h3>
                <p className="text-sm text-secondary mb-4">Pelajari kembali konsep dasar yang terlewat pada kuis sebelumnya.</p>
                <span className="text-sm font-semibold text-danger">Buka Remedial →</span>
              </a>
            )}
            
            {module.deep_dive_markdown && (
              <a 
                href={`/module/${module.topic_id}/deep-dive`}
                className="flex-1 rounded-xl border border-tertiary/20 bg-tertiary/10 p-5 hover:bg-tertiary/20 transition-colors"
              >
                <h3 className="font-display font-bold text-tertiary mb-2">Materi Pengayaan (Deep Dive)</h3>
                <p className="text-sm text-secondary mb-4">Eksplorasi studi kasus teknis dan materi tingkat lanjut untuk topik ini.</p>
                <span className="text-sm font-semibold text-tertiary">Buka Pengayaan →</span>
              </a>
            )}
          </div>
        </section>
      )}
    </article>
  )
}

export default function Module() {
  const { t } = useTranslation();
  const { topicId } = useParams()
  const navigate = useNavigate()
  const { activeSession } = useLearningStore()
  const sessionId = activeSession?.id

  // The article column is the SCROLL CONTAINER — not the page itself.
  // AppLayout locks the page at h-screen overflow-hidden so the body
  // never gets a scrollbar. Sticky elements (topbar, bottom action bar)
  // need a scrollable ancestor INSIDE the module. This ref is attached
  // to the article column (left pane of the split) so ModuleTopbar's
  // 80%-scroll quiz button reads the right scrollTop/scrollHeight.
  // Desktop Tutor AI sits in a sticky right pane and does not scroll
  // with the article.
  const scrollContainerRef = useRef(null)

  const { data: module, isLoading, error, refetch } = useModule(sessionId, topicId)
  const { data: topicsData } = useTopics(sessionId)

  const allTopics = Array.isArray(topicsData) ? topicsData : topicsData?.topics || []
  const currentTopic = allTopics.find(t => t.id === topicId)
  const isLocked = currentTopic?.status === 'locked'

  const [generating, setGenerating] = useState(false)
  const [generationTriggered, setGenerationTriggered] = useState(false)
  const [generationFailed, setGenerationFailed] = useState(false)
  const retryCountRef = useRef(0)
  const MAX_RETRIES = 60 // 60 × 5s = 5 minutes max polling

  useEffect(() => {
    let interval
    if (!isLoading && !module && !generating && !generationTriggered && !generationFailed && sessionId && topicId && !isLocked) {
      setGenerating(true)
      setGenerationTriggered(true)
      retryCountRef.current = 0
      generateModule(sessionId, topicId)
        .then(() => {
          interval = setInterval(() => {
            retryCountRef.current += 1
            if (retryCountRef.current >= MAX_RETRIES) {
              clearInterval(interval)
              setGenerating(false)
              setGenerationFailed(true)
              return
            }
            refetch()
          }, 5000)
        })
        .catch(() => {
          setGenerating(false)
          setGenerationFailed(true)
        })
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isLoading, module, generating, generationTriggered, generationFailed, sessionId, topicId, refetch])

  useEffect(() => {
    if (module && generating) {
      setGenerating(false)
    }
  }, [module, generating])

  const handleGenerationRetry = () => {
    setGenerationFailed(false)
    setGenerationTriggered(false)
    setGenerating(false)
    retryCountRef.current = 0
  }

  // The chat panel needs a `module.title` for the topic pill. Only
  // render it once the module is loaded — for loading/locked/error
  // states the page chrome is shown alone.
  const moduleTitle = module?.title

  return (
    <div className="flex h-full min-h-0 relative items-stretch overflow-hidden">
      {/* Article column — scrolls independently; shrinks when Tutor AI opens. */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-w-0 flex flex-col relative overflow-y-auto h-full"
      >
        <ReadingProgressBar scrollContainerRef={scrollContainerRef} />
        <ModuleTopbar module={module} topic={currentTopic} scrollContainerRef={scrollContainerRef} />

        <ReadingTracker
          sessionId={sessionId}
          topicId={topicId}
          estimatedMinutes={module?.estimated_read_minutes}
        />

        <main className="flex-1 min-w-0">
          {isLoading || generating ? (
            <>{generating ? <GeneratingState /> : <ModuleSkeleton />}</>
          ) : generationFailed ? (
            <GenerationFailedState
              onRetry={handleGenerationRetry}
              onBack={() => navigate('/curriculum')}
            />
          ) : isLocked ? (
            <div className="mx-auto max-w-[720px] px-4 md:px-6 py-16">
              <EmptyState
                icon={BookOpen}
                title={t('module.module_locked')}
                description={t('module.module_locked_desc')}
                actionLabel={t('module.back_to_curriculum')}
                onAction={() => navigate('/curriculum')}
              />
            </div>
          ) : error || !module ? (
            <div className="mx-auto max-w-[720px] px-4 md:px-6 py-16">
              <EmptyState
                icon={BookOpen}
                title={t('module.module_not_found')}
                description={t('module.module_not_found_desc')}
                actionLabel={t('module.back_to_curriculum')}
                onAction={() => navigate('/curriculum')}
              />
            </div>
          ) : (
            <>
              <div data-tour="module-article">
                <ModuleArticle module={module} />
              </div>
              <div data-tour="module-complete">
                <StickyActionBar
                  module={module}
                  sessionId={sessionId}
                  topicId={topicId}
                />
              </div>
            </>
          )}
        </main>
      </div>

      {/* Tutor AI — desktop: in-layout collapsible/resizable split pane.
          Mobile: floating trigger + bottom sheet. Mounted once module loads.
          The expand trigger button itself carries `data-tour="module-tutor"`
          (inside ModuleChatSlider) so the tour spotlight lands exactly on
          the button — wrapping this component in a div would give the
          spotlight a 0×0 rect because the trigger is `position: fixed`. */}
      {module && (
        <ModuleChatPanel
          sessionId={sessionId}
          topicId={topicId}
          moduleTitle={moduleTitle}
        />
      )}
    </div>
  )
}
