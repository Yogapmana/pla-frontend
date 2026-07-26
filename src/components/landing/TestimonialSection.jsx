import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Quote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fadeUp, staggerContainer } from './motion'

export default function TestimonialSection() {
  const { t } = useTranslation()
  const shouldReduceMotion = useReducedMotion()
  return (
    <section className="py-24 sm:py-32 bg-neutral relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgb(var(--tertiary)) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={shouldReduceMotion ? {} : staggerContainer}
        >
          <motion.div variants={shouldReduceMotion ? {} : fadeUp} className="relative z-10 flex justify-center mb-8">
            <Quote className="w-12 h-12 text-tertiary/30" />
          </motion.div>

          <motion.h2
            variants={shouldReduceMotion ? {} : fadeUp}
            className="text-3xl sm:text-4xl md:text-5xl font-display font-medium text-primary leading-tight tracking-tight relative z-10"
          >
            "{t('landing.testimonial.quote1', 'Belajar bukanlah tentang menghafal fakta,')} <span className="italic font-bold text-tertiary">{t('landing.testimonial.quote2', 'melainkan melatih pikiran untuk berpikir.')}</span>"
          </motion.h2>

          <motion.p
            variants={shouldReduceMotion ? {} : fadeUp}
            className="mt-8 text-base sm:text-lg text-secondary font-label uppercase tracking-widest relative z-10"
          >
            — Albert Einstein
          </motion.p>
          
        </motion.div>
      </div>
    </section>
  )
}
