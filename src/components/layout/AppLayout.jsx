import React from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { useTourStore } from '../../stores/tourStore';
import StreakCelebration from '../gamification/StreakCelebration';
import LevelUpCelebration from '../gamification/LevelUpCelebration';
import FeatureTour from '../tour/FeatureTour';
import { cn } from '../../utils/cn';

const AppLayout = ({ children }) => {
  const { sidebarCollapsed } = useUIStore();
  const location = useLocation();

  // Global streak celebration — pulled from the auth store which
  // is set by `authStore.login()` whenever a login crosses a day
  // boundary (``streak.is_new_day === true``). The modal renders
  // here (and not in the Login page) so it persists across the
  // route transition from /login → /dashboard, and so any future
  // entry point (e.g. magic-link login, OAuth callback) gets the
  // same celebration for free.
  const pendingStreakCelebration = useAuthStore(
    (s) => s.pendingStreakCelebration,
  );
  const clearStreakCelebration = useAuthStore(
    (s) => s.clearStreakCelebration,
  );
  const pendingLevelUp = useAuthStore((s) => s.pendingLevelUp);
  const clearLevelUp = useAuthStore((s) => s.clearLevelUp);

  // The feature tour guides brand-new users right after onboarding.
  // The streak/level-up celebration (a full-screen blurred overlay at
  // z-[60]) must not appear while the tour is running — it would blur
  // the tutorial and intercept its clicks. Both celebrations stay
  // pending in the auth store, so deferring their render until the
  // tour finishes (finish/skip) is safe: they show right after.
  const isTourActive = useTourStore((s) => s.isActive);
  const isTourSeen = useTourStore((s) => s.seen);

  const path = location.pathname;
  // A brand-new user landing on the dashboard auto-starts the tour on
  // the next render; hold the celebration until the tour has actually
  // begun (or the user navigates away) so it can't flash in first.
  const isTourPending = path === '/dashboard' && !isTourSeen;
  // Chat and Module pages are "app-in-app" layouts: they fill the
  // viewport exactly and manage their own internal scrolling (Chat has
  // a messages scroll area, Module has its own scroll container with
  // a sticky chat panel). For these pages:
  //   - No padding (they handle their own gutters)
  //   - main uses overflow-hidden so the height chain propagates
  //     cleanly and h-full on the page root resolves correctly.
  //
  // All other pages (Dashboard, Curriculum, Settings, etc.) are long
  // scrollable documents. main uses overflow-y-auto so they scroll.
  const isFullHeightPage = path.startsWith('/chat') || path.startsWith('/module');
  const paddingClass = isFullHeightPage ? 'p-0' : 'p-4 md:p-6 lg:p-8';
  const overflowClass = isFullHeightPage ? 'overflow-hidden' : 'overflow-y-auto';

  return (
    // ── App-shell pattern (Slack/Discord/ChatGPT-style) ─────────────
    // The OUTER container is `h-screen overflow-hidden` so the page
    // itself can NEVER scroll — even if a child is taller than the
    // viewport. This is the root cause of the "double scroll" bug:
    // the page used to grow past 100vh because <main> + padding
    // didn't constrain its height, so we got a page scrollbar *in
    // addition to* the inner messages-area scrollbar.
    //
    // The flex row here is for the fixed sidebar. Sidebar is `fixed`
    // (off-flow), so the row only contains the inner wrapper. The
    // inner wrapper uses `flex-1` to fill the row width and stacks
    // Topbar + Main vertically.
    //
    // Padding is moved off of <main> and onto the inner content div.
    // That way pages like Chat can use `h-full` to fill the entire
    // <main> box (no padding stealing height) while still getting
    // visual breathing room from the inner div.
    <div className="h-screen flex bg-neutral overflow-hidden texture-grain">
      <Sidebar />

      <div
        className={cn(
          // `min-w-0` lets the wrapper actually shrink in the flex
          // row (otherwise the sidebar's 240px + flex content would
          // overflow horizontally).
          // `min-h-0` lets the wrapper's children (Topbar, Main) use
          // `flex-1` and actually constrain height — without it,
          // flex-1 sizes to content, not available space.
          "flex-1 flex flex-col min-w-0 min-h-0 transition-all duration-250 ease-in-out",
          // The fixed sidebar overlaps this wrapper, so push the
          // content right with padding-left. On mobile the sidebar
          // is a drawer (no pl needed) — `lg:` prefix.
          sidebarCollapsed ? "lg:pl-16" : "lg:pl-[240px]"
        )}
      >
        <Topbar />

        {/*
          Main area — fills remaining height (viewport − topbar).
          Overflow behavior is conditional (set by `overflowClass`):
            - Normal pages (Dashboard, Curriculum, etc.): overflow-y-auto
              so long content scrolls with the scrollbar at main's edge.
            - Chat / Module pages: overflow-hidden so the height chain
              propagates cleanly to children using h-full. These pages
              manage their own internal scrolling.
        */}
        <main id="main-content" tabIndex={-1} className={cn("flex-1 min-h-0 flex flex-col focus:outline-none", overflowClass)}>
          <div
            className={cn(
              "w-full flex-1 flex flex-col min-h-0",
              paddingClass
            )}
          >
            {children}
          </div>
        </main>
      </div>

      {/* ── Global Streak Celebration Modal ─────────────────────
          Rendered OUTSIDE the layout's flex tree (after the inner
          wrapper closes) so it always renders at the top stacking
          context (z-[60]) regardless of which page the user is on.
          AnimatePresence handles enter/exit transitions; the modal
          reads its data from the auth store and clears it on
          dismiss so it only ever shows once per login.
          Suppressed while the feature tour is running so the tour's
          spotlight and tooltip are never covered by the blurred
          celebration overlay. */}
      <AnimatePresence>
        {!isTourActive && !isTourPending && pendingStreakCelebration && (
          <StreakCelebration
            streak={pendingStreakCelebration}
            onClose={clearStreakCelebration}
          />
        )}
        {!isTourActive && !isTourPending && pendingLevelUp && (
          <LevelUpCelebration
            levelUp={pendingLevelUp}
            onClose={clearLevelUp}
          />
        )}
      </AnimatePresence>

      {/* ── Feature Tour ────────────────────────────────────────
          Rendered outside the flex tree like the celebration modals.
          Mounted once at the layout level so it survives route
          changes (cross-page tour steps navigate and continue). */}
      <FeatureTour />
    </div>
  );
};

export default AppLayout;
