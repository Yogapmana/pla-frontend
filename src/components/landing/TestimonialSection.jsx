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
            "Pendekatan AI agent yang memecah materi dari yang tadinya sulit dimengerti menjadi terstruktur sungguh membantu. <span className="italic font-bold text-tertiary">Belajar terasa jauh lebih cerdas dan efisien.</span>"
          </motion.h2>

          <motion.p
            variants={shouldReduceMotion ? {} : fadeUp}
            className="mt-8 text-base sm:text-lg text-secondary font-label uppercase tracking-widest relative z-10"
          >
            — Mahasiswa & Profesional
          </motion.p>
          
          <motion.div variants={shouldReduceMotion ? {} : fadeUp} className="mt-24 pt-16 relative z-10">
              <h3 className="text-3xl sm:text-4xl font-display font-bold text-primary mb-4">Siap untuk mulai?</h3>
              <p className="text-lg text-secondary mb-10">Buat akun gratis dan rasakan pembelajaran masa depan.</p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <Button
                    size="lg"
                    variant="tertiary"
                    className="w-full sm:w-auto px-10 py-7 text-lg font-semibold rounded-xl shadow-warm-lg font-label tracking-wide group transition-all duration-300 hover:shadow-warm-xl hover:-translate-y-0.5"
                  >
                    Mulai Belajar Gratis
                    <ArrowRight className="ml-2 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto px-10 py-7 text-lg font-semibold rounded-xl border-2 font-label tracking-wide bg-surface/60 transition-all duration-300 hover:shadow-warm-md hover:-translate-y-0.5"
                  >
                    Masuk
                  </Button>
                </Link>
              </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
