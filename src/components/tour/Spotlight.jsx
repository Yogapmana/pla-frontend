import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * Spotlight — full-screen dimmed overlay with a "hole" punched around the
 * tour target.
 *
 * The hole is drawn as a single rectangle (the target's bounding rect) with a
 * giant box-shadow that darkens everything around it. Keeping it one element
 * avoids 4-div seam artifacts and is cheap to re-position.
 */
export function Spotlight({ rect, animated = true }) {
  const reduceMotion = useReducedMotion()

  if (!rect) return null

  const pad = 8
  const { top, left, width, height } = rect

  return (
    <motion.div
      className="fixed inset-0 z-[70] pointer-events-none"
      initial={animated && !reduceMotion ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      aria-hidden="true"
    >
      <div
        className="absolute"
        style={{
          top: top - pad,
          left: left - pad,
          width: width + pad * 2,
          height: height + pad * 2,
          borderRadius: 16,
          boxShadow: '0 0 0 9999px rgba(26, 18, 10, 0.62)',
        }}
      />
    </motion.div>
  )
}

export default Spotlight
