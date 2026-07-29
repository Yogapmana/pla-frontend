import { Star, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PLATFORM_COLORS } from '@/utils/constants'
import { motion, useReducedMotion } from 'framer-motion'

const PRICE_VARIANTS = {
  gratis: 'bg-success-light text-success-fg border-success/20',
  berbayar: 'bg-warning-light text-warning-fg border-warning/20',
  audit: 'bg-info-light text-info-fg border-info/20',
}

function PlatformLogo({ platform }) {
  const color = PLATFORM_COLORS[platform?.toLowerCase()] || '#6b7280'
  return (
    <div
      className="flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {platform?.slice(0, 2).toUpperCase() ?? '??'}
    </div>
  )
}

function RatingStars({ rating }) {
  if (rating == null) return null
  const full = Math.floor(rating)
  const hasHalf = rating - full >= 0.5

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              'size-3.5',
              i < full
                ? 'fill-amber-400 text-amber-400'
                : i === full && hasHalf
                  ? 'fill-amber-400/50 text-amber-400'
                  : 'fill-none text-secondary/40',
            )}
          />
        ))}
      </div>
      <span className="text-xs text-secondary font-label">{rating.toFixed(1)}</span>
    </div>
  )
}

export default function CourseCard({ course }) {
  const platform = course.platform?.toLowerCase() ?? ''
  const platformColor = PLATFORM_COLORS[platform] || '#6b7280'
  const priceClass = PRICE_VARIANTS[course.price_type] || PRICE_VARIANTS.gratis
  const shouldReduceMotion = useReducedMotion()

  const handleOpen = () => {
    if (course.url) {
      window.open(course.url, '_blank', 'noopener,noreferrer')
    }
  }

  const hoverProps = shouldReduceMotion ? {} : {
    whileHover: { y: -2 },
    whileTap: { scale: 0.98 }
  }

  return (
    <motion.div
      {...hoverProps}
      className="course-card group relative cursor-pointer"
      style={{ '--platform-color': platformColor }}
      onClick={handleOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleOpen() }}
    >
      <div className="flex items-start gap-3">
        <PlatformLogo platform={course.platform} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-primary">{course.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-xs text-secondary font-label capitalize">{course.platform}</span>
            {course.rating != null && <RatingStars rating={course.rating} />}
            {course.duration && (
              <span className="text-xs text-secondary font-label">{course.duration}</span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge className={cn('text-[10px]', priceClass)}>
              {course.price_type || 'gratis'}
            </Badge>
            {course.section && (
              <Badge variant="outline" className="text-[10px]">
                Relevan: {course.section}
              </Badge>
            )}
          </div>
        </div>
        <ExternalLink className="mt-1 size-4 shrink-0 text-secondary/50 transition-colors group-hover:text-tertiary" />
      </div>
    </motion.div>
  )
}