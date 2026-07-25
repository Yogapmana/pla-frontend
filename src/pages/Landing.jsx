import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import LanguageToggle from '@/components/common/LanguageToggle'
import HeroSection from '@/components/landing/HeroSection'
import FeaturesBento from '@/components/landing/FeaturesBento'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import UseCasesSection from '@/components/landing/UseCasesSection'
import TestimonialSection from '@/components/landing/TestimonialSection'

function scrollToSection(id) {
  return (e) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

/**
 * Landing — public marketing page.
 * Aesthetic: "Editorial Warmth × Multi-Agent Intelligence"
 * Sections live in components/landing/* for maintainability.
 */
export default function Landing() {
  const { t } = useTranslation()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-neutral texture-grain">
      <nav
        className={cn(
          "fixed left-0 right-0 z-50 transition-all duration-300",
          isScrolled 
            ? "top-4 mx-4 sm:mx-8 lg:mx-auto max-w-5xl rounded-full bg-surface/90 backdrop-blur-md shadow-warm-lg ring-1 ring-border-subtle/50" 
            : "top-0 bg-transparent"
        )}
        aria-label="Main"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              to="/"
              onClick={(e) => {
                e.preventDefault()
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="flex items-center gap-2.5 group"
              aria-label="Synapsa home"
            >
              <img src="/horizontal-logo.png" alt="Synapsa Logo" className="h-12 w-auto scale-150 origin-left object-contain transition-transform duration-300 group-hover:scale-[1.55]" />
            </Link>

            <div className="flex items-center gap-1 sm:gap-2">
              <a
                href="#fitur"
                onClick={scrollToSection('fitur')}
                className="hidden md:inline-flex px-3 py-2 text-sm font-label text-secondary hover:text-primary transition-colors duration-200"
              >
                {t('landing.features', 'Fitur')}
              </a>
              <a
                href="#cara-kerja"
                onClick={scrollToSection('cara-kerja')}
                className="hidden md:inline-flex px-3 py-2 text-sm font-label text-secondary hover:text-primary transition-colors duration-200"
              >
                {t('landing.how_it_works', 'Cara Kerja')}
              </a>

              <LanguageToggle />

              <Link to="/login" className="hidden sm:block">
                <Button
                  variant="ghost"
                  className="text-secondary hover:text-primary font-label transition-colors duration-200"
                >
                  {t('landing.login', 'Masuk')}
                </Button>
              </Link>
              <Link to="/register">
                <Button
                  variant="tertiary"
                  className="font-label tracking-wide transition-all duration-300 hover:shadow-warm-md"
                >
                  {t('landing.register', 'Daftar')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <HeroSection />
        
        <div id="fitur">
          <FeaturesBento />
        </div>
        
        <div id="cara-kerja">
          <HowItWorksSection />
        </div>

        <UseCasesSection />
        <TestimonialSection />
      </main>

      <footer className="bg-surface text-secondary py-12 border-t border-border-subtle/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3 group">
              <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <img src="/horizontal-logo.png" alt="Synapsa Logo" className="h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
              </Link>
              <span className="text-xs text-secondary/60 font-label font-medium bg-surface-1 px-2 py-1 rounded-md">
                v1.0
              </span>
            </div>
            <p className="text-sm font-label">
              {t('landing.footer_tagline')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
