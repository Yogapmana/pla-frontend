import React from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, Flame, HelpCircle } from 'lucide-react'
import { useUIStore } from '../../stores/uiStore'
import { useLearningStore } from '../../stores/learningStore'
import { useTourStore } from '../../stores/tourStore'
import { cn } from '../../utils/cn'
import { NotificationDropdown } from './NotificationDropdown'
import SessionSwitcher from './SessionSwitcher'

/**
 * Topbar — global navigation bar.
 *
 * Phase 5.12 — softer, more integrated.
 *  - Removed solid `border-b`; replaced with a very subtle 1px
 *    bottom shadow that reads as ambient separation.
 *  - Session context lives here as a compact chip (not in sidebar).
 *  - Background is frosted glass over the page grain.
 */
const Topbar = () => {
  const { toggleSidebar } = useUIStore()
  const { streak = 0 } = useLearningStore() || {}
  const replayTour = useTourStore((s) => s.replay)
  const location = useLocation()

  const getBreadcrumb = () => {
    const segments = location.pathname.split('/').filter(Boolean)
    const labels = {
      dashboard: 'Dashboard',
      curriculum: 'Kurikulum',
      module: 'Modul',
      chat: 'Chat Tutor',
      quiz: 'Kuis',
      metrics: undefined,
      settings: 'Pengaturan',
      onboarding: 'Onboarding',
    }
    return segments.map((seg) => labels[seg] || seg.replace(/-/g, ' '))
  }

  const breadcrumbs = getBreadcrumb()

  return (
    <header className="sticky top-0 z-40 flex h-[60px] w-full items-center justify-between bg-surface/90 backdrop-blur-xl px-4 lg:px-6 shadow-[0_1px_3px_rgba(58,41,22,0.06),0_1px_0_rgba(58,41,22,0.08)]">
      {/* Left section */}
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          className="rounded-xl p-2 text-secondary transition-colors duration-200 hover:bg-secondary/10 hover:text-primary lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        <SessionSwitcher />

        {/* Breadcrumb — thinner, more elegant */}
        <nav
          className="hidden min-w-0 items-center gap-1.5 text-sm sm:flex"
          aria-label="Breadcrumb"
        >
          <span className="shrink-0 font-display font-semibold tracking-tight text-tertiary">
            Synapsa
          </span>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <span
                className="shrink-0 select-none text-xs text-secondary/30"
                aria-hidden="true"
              >
                /
              </span>
              <span
                className={cn(
                  'truncate',
                  idx === breadcrumbs.length - 1
                    ? 'font-semibold text-primary'
                    : 'text-secondary'
                )}
              >
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        <button
          type="button"
          onClick={replayTour}
          className="rounded-xl p-2 text-secondary transition-colors duration-200 hover:bg-secondary/10 hover:text-primary"
          aria-label="Panduan fitur"
          title="Panduan fitur"
        >
          <HelpCircle size={19} />
        </button>

        <NotificationDropdown />

        {streak > 0 && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1.5 rounded-xl border border-tertiary/15 bg-tertiary/10 px-2.5 py-1.5"
          >
            <Flame size={15} className="text-tertiary" fill="currentColor" />
            <span className="text-sm font-bold tabular-nums text-tertiary">
              {streak}
            </span>
          </motion.div>
        )}
      </div>
    </header>
  )
}

export default Topbar
