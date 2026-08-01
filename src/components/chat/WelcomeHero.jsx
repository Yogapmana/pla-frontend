import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { Compass } from 'lucide-react'

/**
 * WelcomeHero — calm empty-state for general chat.
 * Typography only: greeting + short helper line.
 */
export default function WelcomeHero({ username }) {
  const { t } = useTranslation()
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      className="mx-auto max-w-xl px-4 text-center"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
    >
      <div className="mx-auto mb-7 flex size-14 items-center justify-center rounded-2xl border border-tertiary/20 bg-tertiary/[0.07] text-tertiary shadow-warm-sm">
        <Compass size={25} strokeWidth={1.5} />
      </div>
      <h1 className="font-display text-[1.8rem] font-semibold leading-tight tracking-tight text-primary sm:text-[2.15rem]">
        {username
          ? t('chat.empty_title_named', 'Hi {{name}}, what shall we explore?', {
              name: username,
            })
          : t('chat.empty_title', 'What would you like to explore?')}
      </h1>
      <motion.p
         className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-secondary"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26, delay: 0.05 }}
      >
        {t(
          'chat.empty_subtitle',
          'Ask anything, upload a document, or pick a starter below — answers can use your materials and the web.'
        )}
      </motion.p>
    </motion.div>
  )
}
