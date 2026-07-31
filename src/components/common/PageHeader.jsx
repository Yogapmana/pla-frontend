import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'

/**
 * PageHeader (Phase 2.3)
 *
 * Replaces 4+ ad-hoc `<div className="page-header">` implementations
 * (Curriculum, AgentLog, Settings, GreetingHero, etc.) with a single
 * component that supports:
 *
 * - Standard title + subtitle
 * - Eyebrow (small label above title)
 * - Right-side slot (badges, actions, breadcrumb, etc.)
 * - Staggered enter animation (respects reduced motion via MotionConfig)
 * - Two size variants: `default` and `compact`
 */
function PageHeader({
  title,
  subtitle,
  eyebrow,
  icon: Icon,
  actions,           // right-side slot (e.g. badges, buttons)
  size = 'default',  // 'default' | 'compact'
  className,
  as: As = 'div',
}) {
  const shouldReduceMotion = useReducedMotion();

  const sizing =
    size === 'compact'
      ? { wrap: 'mb-4', title: 'text-lg sm:text-xl', subtitle: 'text-sm' }
      : { wrap: 'mb-5 sm:mb-7', title: 'text-2xl sm:text-3xl', subtitle: 'text-sm' };

  const titleMotion = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
      };

  const subtitleMotion = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, delay: 0.05, ease: [0.25, 1, 0.5, 1] },
      };

  return (
    <As className={cn(sizing.wrap, className)}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          {eyebrow && (
            <div className="text-xs font-label uppercase tracking-wider text-tertiary">
              {eyebrow}
            </div>
          )}
          <div className="flex items-center gap-3">
            {Icon && (
              <div
                aria-hidden="true"
                className="flex size-9 items-center justify-center rounded-xl bg-tertiary/10 text-tertiary ring-2 ring-tertiary/15 shrink-0"
              >
                <Icon className="size-4" />
              </div>
            )}
            <motion.h1
              {...titleMotion}
              className={cn(
                'font-display font-bold tracking-tight text-primary leading-tight break-words min-w-0',
                sizing.title
              )}
            >
              {title}
            </motion.h1>
          </div>
          {subtitle && (
            <motion.p
              {...subtitleMotion}
              className={cn('text-secondary leading-relaxed max-w-3xl', sizing.subtitle)}
            >
              {subtitle}
            </motion.p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
    </As>
  );
}

export default PageHeader;
