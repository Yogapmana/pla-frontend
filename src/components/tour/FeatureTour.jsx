import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { useActiveSession, useTopics } from '@/hooks/useLearning'
import { useTourStore } from '@/stores/tourStore'
import { getTourSteps } from '@/tour/steps'
import { Spotlight } from '@/components/tour/Spotlight'
import { StepTooltip } from '@/components/tour/StepTooltip'

/**
 * FeatureTour — the tour orchestrator.
 *
 * Flow:
 *  1. Auto-starts on /dashboard for users who have never completed the tour
 *     (flag lives in localStorage via tourStore). The Topbar "help" button
 *     re-runs it on demand.
 *  2. Builds steps per session; module steps are skipped when there is no
 *     active topic.
 *  3. For each step it waits until the target element mounts, scrolls it into
 *     view, then renders Spotlight + StepTooltip. Cross-page steps navigate
 *     first, then poll for the target.
 *  4. Finish/skip persists the "seen" flag.
 */
export function FeatureTour() {
  const location = useLocation()
  const navigate = useNavigate()
  const { data: activeSession } = useActiveSession()
  const sessionId = activeSession?.id

  const { data: topicsRaw } = useTopics(sessionId)
  const activeTopicId = useMemo(() => {
    if (!topicsRaw) return null
    const topics = Array.isArray(topicsRaw) ? topicsRaw : topicsRaw?.topics || []
    return topics.find((tp) => tp.status === 'active')?.id ?? null
  }, [topicsRaw])

  const { isActive, stepIndex, start, next, prev, finish, skip } = useTourStore()

  const steps = useMemo(
    () => getTourSteps({ sessionId, activeTopicId }),
    [sessionId, activeTopicId],
  )

  const currentStep = steps[stepIndex]

  const [targetRect, setTargetRect] = useState(null)
  const mountTimerRef = useRef(null)

  // ── Auto-start: once per browser, only on the dashboard. ──────────
  const seen = useTourStore((s) => s.seen)
  useEffect(() => {
    if (!isActive && !seen && location.pathname === '/dashboard' && steps.length > 0) {
      start()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, seen, isActive, steps.length])

  // ── Measure the step's target. Returns null while not mounted. ────
  const measure = useCallback((step) => {
    const el = document.querySelector(step.target)
    if (!el) return null
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) return null
    return rect
  }, [])

  // ── Bring the current step into play: navigate first if needed, then
  //    poll until the target mounts and is visible. ─────────────────
  const applyStep = useCallback(
    (index) => {
      const step = steps[index]
      if (!step) return

      if (location.pathname !== step.page) {
        setTargetRect(null)
        navigate(step.page)
        return
      }

      setTargetRect(null)
      if (mountTimerRef.current) clearTimeout(mountTimerRef.current)

      const tryMount = () => {
        const rect = measure(step)
        if (rect) {
          setTargetRect(rect)
          document
            .querySelector(step.target)
            ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
          return
        }
        mountTimerRef.current = setTimeout(tryMount, 120)
      }
      tryMount()
    },
    [steps, location.pathname, navigate, measure],
  )

  // ── Advance when the tour becomes active or the step changes. ─────
  useEffect(() => {
    if (!isActive || !currentStep) {
      setTargetRect(null)
      return
    }
    applyStep(stepIndex)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, stepIndex, currentStep?.id])

  // ── Re-fire after a navigation lands on the step's page. ──────────
  useEffect(() => {
    if (!isActive || !currentStep) return undefined
    if (location.pathname !== currentStep.page) return undefined
    const timer = setTimeout(() => {
      if (!targetRect) applyStep(stepIndex)
    }, 180)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, isActive, currentStep?.id])

  // ── Re-measure on resize / scroll to keep spotlight accurate. ─────
  useEffect(() => {
    if (!isActive || !currentStep) return undefined
    const re = () => setTargetRect(measure(currentStep))
    window.addEventListener('resize', re)
    window.addEventListener('scroll', re, true)
    return () => {
      window.removeEventListener('resize', re)
      window.removeEventListener('scroll', re, true)
    }
  }, [isActive, currentStep, measure])

  useEffect(() => () => {
    if (mountTimerRef.current) clearTimeout(mountTimerRef.current)
  }, [])

  const goNext = useCallback(() => {
    if (stepIndex >= steps.length - 1) return finish()
    next()
  }, [stepIndex, steps.length, next, finish])

  const goPrev = useCallback(() => {
    if (stepIndex === 0) return
    prev()
  }, [stepIndex, prev])

  if (!isActive || !currentStep) return null

  return (
    <>
      <Spotlight rect={targetRect} />
      <AnimatePresence>
        {targetRect && (
          <StepTooltip
            step={currentStep}
            stepIndex={stepIndex}
            totalSteps={steps.length}
            onNext={goNext}
            onPrev={goPrev}
            onFinish={finish}
            onSkip={skip}
            rect={targetRect}
            isLast={stepIndex === steps.length - 1}
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default FeatureTour
