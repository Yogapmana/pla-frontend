import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarDays,
  MessageCircle,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Flame,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useLearningStore } from '../../stores/learningStore';
import { cn } from '../../utils/cn';
import { useTranslation } from 'react-i18next';

/**
 * Sidebar — fixed left navigation panel.
 *
 * Layout structure (mobile → desktop):
 *   - <lg (mobile): overlay drawer; slides in/out with backdrop
 *   - ≥lg (desktop): persistent rail; collapses from 240px → 72px
 *
 * Navigation is grouped with section labels ("Utama", "Lainnya") so
 * the empty vertical space feels intentional, not accidental.
 *
 * Phase fix (post-Fase 4):
 *   - Removed "brand icon + collapse button" duplication when collapsed
 *     (they didn't fit in 72px and caused horizontal scroll on body).
 *   - Tooltips are now contained within the aside (no `left-full`).
 *   - Active state uses NavLink's isActive (single source of truth).
 *   - Section labels fill the empty space intentionally.
 */

const COLLAPSED_WIDTH = 72;
const EXPANDED_WIDTH = 240;

/**
 * @typedef {Object} NavItem
 * @property {string} label
 * @property {React.ComponentType<{size?: number, className?: string}>} icon
 * @property {string} path
 * @property {'utama' | 'lainnya'} section
 */

const NAV_ITEMS = [
  { labelKey: 'sidebar.dashboard', icon: LayoutDashboard, path: '/dashboard', section: 'utama' },
  { labelKey: 'sidebar.curriculum', icon: CalendarDays, path: '/curriculum', section: 'utama' },
  { labelKey: 'sidebar.chatbot', icon: MessageCircle, path: '/chat', section: 'utama' },
  { labelKey: 'sidebar.quiz_history', icon: History, path: '/progress', section: 'lainnya' },
  { labelKey: 'sidebar.settings', icon: Settings, path: '/settings', section: 'lainnya' },
];

/** Prefetch lazy page chunk on hover/focus so click feels instant. */
const ROUTE_PREFETCH = {
  '/dashboard': () => import('../../pages/Dashboard'),
  '/curriculum': () => import('../../pages/Curriculum'),
  '/chat': () => import('../../pages/Chat'),
  '/progress': () => import('../../pages/QuizHistory'),
  '/settings': () => import('../../pages/Settings'),
};

const prefetchedRoutes = new Set();

function prefetchRoute(path) {
  if (prefetchedRoutes.has(path)) return;
  const loader = ROUTE_PREFETCH[path];
  if (!loader) return;
  prefetchedRoutes.add(path);
  loader().catch(() => {
    prefetchedRoutes.delete(path);
  });
}

const Sidebar = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { streak = 0 } = useLearningStore() || {};
  const shouldReduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );

  // Sync mobile/desktop state with viewport
  useEffect(() => {
    const syncWithViewport = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // Auto-collapse on mobile, auto-expand on desktop (if user hasn't chosen)
      // We don't override user choice; just track viewport for layout decisions.
    };
    syncWithViewport();
    window.addEventListener('resize', syncWithViewport);
    return () => window.removeEventListener('resize', syncWithViewport);
  }, []);

  const transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.25, ease: [0.4, 0, 0.2, 1] };

  const width = sidebarCollapsed ? (isMobile ? 0 : COLLAPSED_WIDTH) : EXPANDED_WIDTH;

  return (
    <>
      {/* Mobile overlay backdrop — sits below the aside, above content */}
      <AnimatePresence>
        {isMobile && !sidebarCollapsed && (
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition}
            onClick={toggleSidebar}
            aria-hidden="true"
            className="fixed inset-0 z-30 bg-primary/40 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          width,
          x: isMobile && sidebarCollapsed ? -EXPANDED_WIDTH : 0,
        }}
        transition={transition}
        aria-label="Main navigation"
        className={cn(
          // `h-screen flex flex-col` keeps the aside exactly viewport
          // tall (it's `fixed` so it doesn't depend on the parent).
          // The brand header (h-[60px]), nav, streak badge, and user
          // profile are all `shrink-0` so they stay pinned. Only the
          // <nav> below has `flex-1 overflow-y-auto` — when there are
          // many items, ONLY the nav scrolls, the footer (profile +
          // logout) stays visible.
          //
          // Why no `overflow-y-auto` here? Previously the aside had
          // `overflow-y-auto`, which meant the ENTIRE aside (logo,
          // nav, profile) scrolled together when content was too
          // tall. That made the user profile "scroll out of view"
          // when the nav was long, and created a vertical scrollbar
          // next to the page content (the "navbar bisa ke scroll"
          // bug). The fix: no outer scroll. The nav inside is the
          // only thing that can scroll.
          'fixed left-0 top-0 z-40 h-screen flex flex-col min-h-0',
          'bg-gradient-to-b from-surface via-surface to-surface/95',
          // Subtle inner shadow on the right edge — softer than a
          // solid border, integrates with the page background
          'shadow-[inset_-1px_0_0_rgba(58,41,22,0.06)]',
          // Belt-and-suspenders: even though children handle their
          // own overflow, keep x hidden so a tooltip overflow can't
          // produce a horizontal scrollbar on the aside itself.
          'overflow-x-hidden',
          // On mobile when "closed" (translated off-screen), hide entirely
          isMobile && sidebarCollapsed && 'invisible'
        )}
      >
        {/* ── Brand header (collapses to just the toggle when sidebarCollapsed) ── */}
        <div
          className={cn(
            'h-[60px] flex items-center shrink-0',
            sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-5'
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            {!sidebarCollapsed && (
              <motion.div
                key="brand"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2.5 overflow-hidden"
              >
                <div className="w-8 h-8 shrink-0">
                  <img src="/logo.png" alt="Synapsa Logo" className="w-full h-full object-contain" />
                </div>
                <span className="font-display font-bold text-lg text-primary/80 tracking-tight whitespace-nowrap">
                  Synapsa
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Desktop collapse toggle — single element, no overlap */}
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!sidebarCollapsed}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-lg shrink-0',
              'text-secondary hover:text-primary hover:bg-secondary/10',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary',
              // On mobile we hide this (toggle is via backdrop / hamburger)
              'hidden lg:flex'
            )}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* ── Navigation ── */}
        {/*
          `min-h-0` is the magic that lets `overflow-y-auto` actually
          work inside a flex parent. Without it, the flex parent's
          min-content size is its tallest child, so a tall nav list
          prevents the parent from shrinking — and `overflow-y-auto`
          never gets a chance to engage (there's nothing to overflow).
          With `min-h-0`, the parent is allowed to shrink below its
          content, the nav list's natural height exceeds the parent,
          and the scrollbar appears as expected.
        */}
        <nav
          aria-label="Primary"
          className="flex-1 min-h-0 py-3 px-2.5 overflow-y-auto overflow-x-hidden"
        >
          {/* Section: Utama */}
          <NavGroup
            section="utama"
            sidebarCollapsed={sidebarCollapsed}
          />
          {NAV_ITEMS.filter((i) => i.section === 'utama').map((item) => (
            <NavItemRow
              key={item.path}
              item={item}
              sidebarCollapsed={sidebarCollapsed}
            />
          ))}

          {/* Section: Lainnya */}
          <NavGroup
            section="lainnya"
            sidebarCollapsed={sidebarCollapsed}
          />
          {NAV_ITEMS.filter((i) => i.section === 'lainnya').map((item) => (
            <NavItemRow
              key={item.path}
              item={item}
              sidebarCollapsed={sidebarCollapsed}
            />
          ))}
        </nav>

        {/* ── User profile + logout (footer) ── */}
        <div className="p-2.5 shrink-0 shadow-[inset_0_1px_0_rgba(58,41,22,0.06)]">
          <div
            className={cn(
              'flex items-center gap-3 rounded-xl px-2 py-2 mb-1',
              sidebarCollapsed && 'justify-center px-0 mb-0'
            )}
          >
            <div
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                'bg-gradient-to-br from-tertiary/20 to-tertiary/5',
                'text-tertiary font-bold text-sm font-display',
                'shadow-warm-xs ring-1 ring-tertiary/15'
              )}
              aria-hidden="true"
            >
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>

            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-semibold text-primary truncate leading-tight">
                  {user?.username || 'User'}
                </p>
                <p className="text-xs text-secondary truncate leading-tight mt-0.5">
                  {user?.email || 'user@example.com'}
                </p>
              </motion.div>
            )}
          </div>

          <button
            type="button"
            onClick={() => logout()}
            aria-label={t("common.logout", "Keluar")}
            className={cn(
              'flex items-center gap-3 w-full rounded-xl text-secondary',
              'hover:bg-danger/8 hover:text-danger',
              'transition-colors duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger',
              sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
            )}
          >
            <LogOut size={18} className="shrink-0" />
            {!sidebarCollapsed && (
              <span className="text-sm font-label font-medium">{t('sidebar.logout')}</span>
            )}
          </button>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;

/* ────────────────────────────────────────────────────────────────── */
/* Internal sub-components                                           */
/* ────────────────────────────────────────────────────────────────── */

/**
 * Section label ("Utama", "Lainnya") — only shown when expanded.
 * Fills the empty vertical space intentionally.
 */
function NavGroup({ section, sidebarCollapsed }) {
  const { t } = useTranslation();
  const labelKey = section === 'utama' ? 'sidebar.main' : 'sidebar.others';

  return (
    <AnimatePresence>
      {!sidebarCollapsed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.15 }}
          className="overflow-hidden"
        >
          <div className="px-3 pt-4 pb-1.5 first:pt-1.5">
            <p className="font-label text-[10px] uppercase tracking-widest text-secondary/60 font-semibold">
              {t(labelKey)}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Single nav row. Uses NavLink's own `isActive` (single source of truth).
 * The active indicator is an absolute-positioned bar (no layout shift).
 *
 * Phase 5.12 — refined active/hover states:
 *  - Active state: `bg-tertiary/[0.08]` only (no ring) — softer
 *  - Hover state: smoother transition (200ms)
 *  - Icon color transitions smoothly between states
 */
function NavItemRow({ item, sidebarCollapsed }) {
  const { t } = useTranslation();
  const Icon = item.icon;
  const isCollapsed = sidebarCollapsed;

  return (
    <NavLink
      to={item.path}
      // Exact match for these paths so /chat doesn't highlight when
      // user is on /curriculum and vice versa.
      end={item.path === '/chat' || item.path === '/curriculum'}
      aria-label={item.label}
      onMouseEnter={() => prefetchRoute(item.path)}
      onFocus={() => prefetchRoute(item.path)}
      onTouchStart={() => prefetchRoute(item.path)}
      className={({ isActive }) =>
        cn(
          'relative flex items-center gap-3 rounded-xl transition-all duration-200 group',
          isCollapsed ? 'justify-center px-0 py-2.5 my-0.5' : 'px-3 py-2.5 my-0.5',
          isActive
            ? 'bg-tertiary/[0.08] text-tertiary font-semibold'
            : 'text-secondary hover:bg-secondary/[0.06] hover:text-primary'
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Active indicator — only on the active item */}
          {isActive && (
            <span
              aria-hidden="true"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-tertiary"
            />
          )}

          <Icon
            size={19}
            className={cn(
              'shrink-0 transition-colors duration-200',
              isActive ? 'text-tertiary' : 'text-secondary group-hover:text-primary'
            )}
            aria-hidden="true"
          />

          {/* Label — expanded */}
          {!isCollapsed && (
            <span
              className={cn(
                'whitespace-nowrap text-sm font-label',
                isActive ? 'text-tertiary' : 'text-primary'
              )}
            >
              {t(item.labelKey)}
            </span>
          )}

          {/* Tooltip — only on collapsed (hover-only) */}
          {isCollapsed && (
            <span
              role="tooltip"
              className={cn(
                'pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3',
                'px-2.5 py-1.5 rounded-lg whitespace-nowrap z-50',
                'bg-primary text-neutral text-xs font-label font-medium',
                'shadow-warm-md',
                'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
                // Arrow — left of the tooltip, pointing back to the nav item
                "before:content-[''] before:absolute before:right-full before:top-1/2 before:-translate-y-1/2",
                'before:border-y-[6px] before:border-r-[6px] before:border-transparent before:border-r-primary'
              )}
            >
              {t(item.labelKey)}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}
