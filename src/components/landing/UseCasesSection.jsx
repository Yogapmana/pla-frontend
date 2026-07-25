import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { fadeUp, staggerContainer, viewportOnce } from './motion'
import { BookOpen, Code, GraduationCap } from 'lucide-react'

export default function UseCasesSection() {
  const { t } = useTranslation()
  const shouldReduceMotion = useReducedMotion()
  
  const cases = [
    { 
      icon: <GraduationCap className="w-8 h-8 text-tertiary" />,
      title: t('landing.useCases.case1_title', 'Persiapan Ujian'), 
      desc: t('landing.useCases.case1_desc', 'Pelajari materi yang spesifik untuk ujianmu, dan tes pemahaman dengan kuis adaptif.') 
    },
    { 
      icon: <Code className="w-8 h-8 text-tertiary" />,
      title: t('landing.useCases.case2_title', 'Belajar Skill Baru'), 
      desc: t('landing.useCases.case2_desc', 'Mulai dari programming hingga desain, AI merancang kurikulum step-by-step untuk pemula.') 
    },
    { 
      icon: <BookOpen className="w-8 h-8 text-tertiary" />,
      title: t('landing.useCases.case3_title', 'Eksplorasi Konsep'), 
      desc: t('landing.useCases.case3_desc', 'Gali dalam-dalam topik apa pun yang membuatmu penasaran tanpa batas kurikulum konvensional.') 
    },
  ]

  return (
    <section className="py-24 sm:py-28 bg-neutral relative overflow-hidden shadow-[inset_0_1px_3px_rgba(58,41,22,0.04),inset_0_-1px_3px_rgba(58,41,22,0.04)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={viewportOnce}
          variants={shouldReduceMotion ? {} : staggerContainer}
        >
          <motion.p
            variants={shouldReduceMotion ? {} : fadeUp}
            className="text-xs font-label uppercase tracking-widest text-secondary mb-4"
          >
            {t('landing.useCases.eyebrow', 'Skenario Penggunaan')}
          </motion.p>
          <motion.h2
            variants={shouldReduceMotion ? {} : fadeUp}
            className="text-3xl sm:text-4xl md:text-5xl font-display font-medium text-primary leading-snug tracking-tight max-w-3xl mx-auto"
          >
            {t('landing.useCases.title', 'Satu Platform untuk ')}
            <span className="text-tertiary italic">{t('landing.useCases.title_highlight', 'Segala Kebutuhan Belajarmu')}</span>
          </motion.h2>

          <motion.div
            variants={shouldReduceMotion ? {} : fadeUp}
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
          >
            {cases.map((c, i) => (
              <div
                key={i}
                className="rounded-3xl bg-surface p-8 shadow-warm-sm ring-1 ring-border-subtle/40 transition-all duration-300 hover:-translate-y-2 hover:shadow-warm-lg text-left relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
                  {c.icon}
                </div>
                <div className="mb-6 p-4 bg-secondary/5 inline-flex rounded-2xl">
                  {c.icon}
                </div>
                <h3 className="font-display text-2xl font-bold text-primary tracking-tight mb-3">
                  {c.title}
                </h3>
                <p className="text-base text-secondary font-serif-content leading-relaxed">
                  {c.desc}
                </p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
