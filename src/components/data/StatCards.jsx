import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Flame, BookOpen, Clock, Target } from 'lucide-react';
import { CountUp } from '../dashboard/CountUp';
import { cn } from '@/lib/utils';

/**
 * StatCard (Phase 5.3 — promoted to components/data/)
 *
 * Standard card for a single numeric metric on dashboard / overview pages.
 * Now with:
 *  - Sparkline micro-chart (7-day trend) as the "wow" detail
 *  - Gradient text on the value for primary metric
 *  - Trend indicator (delta vs yesterday) when supplied
 *  - All previous accessibility guarantees retained
 *
 * Variants:
 *  - flame  → primary/CTA accent
 *  - book   → success (green)
 *  - clock  → warning (amber)
 *  - target → info (blue)
 */

const ICON_MAP = {
  Flame,
  BookOpen,
  Clock,
  Target,
};

const ICON_BG_MAP = {
  Flame: 'bg-tertiary/10 text-tertiary',
  BookOpen: 'bg-success-light text-success-fg',
  Clock: 'bg-warning-light text-warning-fg',
  Target: 'bg-info-light text-info-fg',
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

/**
 * Sparkline — small inline SVG showing 7 data points.
 * No external chart lib needed.
 */
function Sparkline({ data = [], color = 'tertiary', height = 28 }) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const width = 80
  const stepX = width / (data.length - 1)

  const points = data.map((v, i) => {
    const x = i * stepX
    const y = height - ((v - min) / range) * height
    return [x, y]
  })

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(' ')

  const areaD =
    pathD + ` L ${width} ${height} L 0 ${height} Z`

  const strokeMap = {
    tertiary: 'rgb(196, 37, 28)',
    success: 'rgb(22, 101, 52)',
    warning: 'rgb(161, 98, 7)',
    info: 'rgb(29, 78, 216)',
  }
  const fillMap = {
    tertiary: 'rgb(196, 37, 28)',
    success: 'rgb(22, 101, 52)',
    warning: 'rgb(161, 98, 7)',
    info: 'rgb(29, 78, 216)',
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`spark-fill-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillMap[color]} stopOpacity="0.18" />
          <stop offset="100%" stopColor={fillMap[color]} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#spark-fill-${color})`} />
      <path
        d={pathD}
        fill="none"
        stroke={strokeMap[color]}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r="2"
        fill={strokeMap[color]}
      />
    </svg>
  )
}

/**
 * TrendArrow — small indicator showing delta direction.
 * `delta` is the numeric change; `deltaSuffix` defaults to "%".
 */
function TrendArrow({ delta, suffix = '%' }) {
  if (delta == null) return null
  const isPositive = delta >= 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[10px] font-bold font-label tabular-nums',
        isPositive ? 'text-success' : 'text-danger'
      )}
    >
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
        <path
          d={isPositive ? 'M4 1 L7 6 L1 6 Z' : 'M4 7 L1 2 L7 2 Z'}
          fill="currentColor"
        />
      </svg>
      {isPositive ? '+' : ''}{delta}{suffix}
    </span>
  )
}

export function StatCard({ label, value, subtext, icon, sparkline, trend, color = 'tertiary' }) {
  const shouldReduceMotion = useReducedMotion();
  const IconComponent = ICON_MAP[icon] || BookOpen;
  const iconBg = ICON_BG_MAP[icon] || 'bg-secondary/10 text-secondary';

  const hoverProps = shouldReduceMotion
    ? {}
    : { whileHover: { y: -3, transition: { type: 'spring', stiffness: 400, damping: 20 } } };
  const tapProps = shouldReduceMotion ? {} : { whileTap: { scale: 0.98 } };

  return (
    <motion.div
      variants={item}
      {...hoverProps}
      {...tapProps}
      role="group"
      aria-label={`${label}: ${value}${subtext ? `. ${subtext}` : ''}`}
      className="card-base card-hover card-interactive p-3.5 sm:p-5 relative overflow-hidden min-w-0"
    >
      {/* Decorative oversized corner numeral — adds the editorial layer */}
      <span
        aria-hidden="true"
        className="absolute -top-3 -right-1 font-display text-[2.5rem] sm:text-[3.5rem] font-black italic text-primary/[0.04] leading-none pointer-events-none select-none"
      >
        {String(typeof value === 'number' ? value : value).slice(0, 2)}
      </span>

      <div className="flex items-start justify-between gap-2 sm:gap-3 relative z-10">
        <div className="space-y-1.5 sm:space-y-2 min-w-0 flex-1 overflow-hidden">
          <div className="flex items-center justify-between gap-1.5 min-w-0">
            <div className="text-[10px] sm:text-xs font-label uppercase tracking-wider text-secondary truncate">
              {label}
            </div>
            {trend != null && <TrendArrow delta={trend} />}
          </div>
          <div
            aria-hidden="true"
            className={cn(
              'text-2xl sm:text-3xl font-display font-bold leading-none tabular-nums break-all',
              color === 'tertiary' ? 'text-gradient-tertiary' : 'text-primary'
            )}
          >
            {typeof value === 'number' ? <CountUp value={value} /> : value}
          </div>
          {subtext && (
            <div className="text-[11px] sm:text-xs text-secondary/70 font-medium truncate">
              {subtext}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 sm:gap-2 shrink-0">
          <div
            aria-hidden="true"
            className={cn('w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center', iconBg)}
          >
            <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          {sparkline && sparkline.length > 1 && (
            <div className="hidden min-[400px]:block scale-90 sm:scale-100 origin-top-right">
              <Sparkline data={sparkline} color={color} height={28} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function StatCards({ stats = [], className }) {
  if (!stats.length) return null;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={cn(
        'grid gap-3 sm:gap-4',
        // 3 cards: stack on narrow phones, 2-col mid, 3-col desktop
        stats.length === 3
          ? 'grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-3'
          : 'grid-cols-2 lg:grid-cols-4',
        className
      )}
    >
      {stats.map((stat, idx) => (
        <StatCard
          key={idx}
          label={stat.label}
          value={stat.value}
          subtext={stat.subtext}
          icon={stat.icon}
          sparkline={stat.sparkline}
          trend={stat.trend}
          color={stat.color}
        />
      ))}
    </motion.div>
  );
}

export default StatCards;