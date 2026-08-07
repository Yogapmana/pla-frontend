import { motion, useReducedMotion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * StepTooltip — the tour's floating card. Positioned relative to the target
 * rect (above by default, flipping below when there isn't room). Clamped to
 * the viewport on small screens.
 */
export function StepTooltip({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onFinish,
  onSkip,
  rect,
  isLast,
}) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()

  if (!rect) return null

  const GAP = 14
  const viewport = { w: window.innerWidth, h: window.innerHeight }
  const tooltipW = Math.min(360, viewport.w - 32)

  // Default above; flip below if not enough room above.
  let top = rect.top - GAP - 220
  let placeBelow = false
  if (top < 12) {
    top = rect.bottom + GAP
    placeBelow = true
    if (top + 220 > viewport.h) {
      top = Math.max(12, viewport.h - 220 - 12)
    }
  }

  const left = Math.min(Math.max(12, rect.left - tooltipW / 2 + rect.width / 2), viewport.w - tooltipW - 12)
  const arrowCenter = Math.min(Math.max(rect.left + rect.width / 2, left + 28), left + tooltipW - 28)

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.92, y: placeBelow ? -6 : 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      role="dialog"
      aria-live="polite"
      aria-label={t('tour.aria_label', 'Panduan fitur')}
      className="fixed z-[80]"
      style={{ top, left, width: tooltipW }}
    >
      {/* Arrow */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute w-3 h-3 rotate-45 bg-surface border-border/60',
          placeBelow ? 'top-[-6px] border-l border-t' : 'bottom-[-6px] border-r border-b'
        )}
        style={{ left: arrowCenter - 6 }}
      />

      <div className="card-hero relative overflow-hidden p-5 shadow-warm-lg">
        <span
          aria-hidden="true"
          className="absolute -top-6 -right-2 font-display text-[6rem] font-black italic text-tertiary/[0.06] leading-none pointer-events-none select-none"
        >
          ✦
        </span>

        <div className="flex items-start justify-between gap-3 relative">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-xl bg-tertiary/10 text-tertiary">
              <Sparkles className="size-4" />
            </span>
            <span className="font-label text-[11px] uppercase tracking-widest text-secondary">
              {stepIndex + 1} / {totalSteps}
            </span>
          </div>
          <button
            type="button"
            onClick={onSkip}
            aria-label={t('tour.skip', 'Lewati')}
            className="rounded-lg p-1.5 text-secondary hover:bg-secondary/10 hover:text-primary transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-3 relative">
          <h3 className="font-display text-lg font-bold text-primary leading-tight">
            {t(step.titleKey)}
          </h3>
          <p className="mt-1.5 text-sm text-secondary leading-relaxed">
            {t(step.descKey)}
          </p>
        </div>

        {/* Progress dots */}
        <div className="mt-4 flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === stepIndex ? 'w-5 bg-tertiary' : 'w-1.5 bg-secondary/20'
              )}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrev}
            disabled={stepIndex === 0}
            className="gap-1 font-label"
          >
            <ChevronLeft className="size-4" />
            {t('tour.prev', 'Kembali')}
          </Button>

          {isLast ? (
            <Button size="sm" variant="tertiary" onClick={onFinish} className="gap-1 font-label">
              <Check className="size-4" />
              {t('tour.done', 'Selesai')}
            </Button>
          ) : (
            <Button size="sm" variant="tertiary" onClick={onNext} className="gap-1 font-label">
              {t('tour.next', 'Lanjut')}
              <ChevronRight className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default StepTooltip
