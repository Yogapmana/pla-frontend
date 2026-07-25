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
    <section className="py-24 sm:py-32 bg-surface relative overflow-hidden">
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
          className="bg-surface rounded-[2.5rem] p-10 sm:p-14 md:p-20 shadow-warm-xl relative overflow-hidden ring-1 ring-border-subtle/50"
        >
          {/* Soft tertiary glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-tertiary/10 blur-[80px] rounded-full pointer-events-none" />

          <motion.div variants={shouldReduceMotion ? {} : fadeUp} className="relative z-10 flex justify-center mb-10">
            <Quote className="w-12 h-12 text-tertiary/30" />
          </motion.div>

          <motion.h2
            variants={shouldReduceMotion ? {} : fadeUp}
            className="text-2xl sm:text-3xl md:text-4xl font-display font-medium text-primary leading-relaxed tracking-tight relative z-10"
          >
            "Pendekatan AI agent yang memecah materi dari yang tadinya sulit dimengerti menjadi terstruktur sungguh membantu. <span className="italic font-bold text-tertiary">Belajar terasa jauh lebih cerdas dan efisien.</span>"
          </motion.h2>

          <motion.p
            variants={shouldReduceMotion ? {} : fadeUp}
            className="mt-6 text-base sm:text-lg text-secondary font-label uppercase tracking-widest relative z-10"
          >
            — Mahasiswa & Profesional
          </motion.p>
          
          <motion.div variants={shouldReduceMotion ? {} : fadeUp} className="mt-16 pt-12 border-t border-border-subtle relative z-10">
              <h3 className="text-xl sm:text-2xl font-display font-bold text-primary mb-3">Siap untuk mulai?</h3>
              <p className="text-secondary mb-8">Buat akun gratis dan rasakan pembelajaran masa depan.</p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <Button
                    size="lg"
                    variant="tertiary"
                    className="w-full sm:w-auto px-8 py-6 text-base font-semibold rounded-xl shadow-warm-lg font-label tracking-wide group transition-all duration-300 hover:shadow-warm-xl hover:-translate-y-0.5"
                  >
                    Mulai Belajar Gratis
                    <ArrowRight className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto px-8 py-6 text-base font-semibold rounded-xl border-2 font-label tracking-wide bg-surface/60 transition-all duration-300 hover:shadow-warm-md hover:-translate-y-0.5"
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
