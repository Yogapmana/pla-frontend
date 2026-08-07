/**
 * Feature tour step definitions.
 *
 * Each step points at an element via a `data-tour` selector and belongs to
 * a page. Steps whose `page` differs from the current location cause the tour
 * to navigate first, then wait for the target to mount.
 *
 * Module steps (9–11) are conditional: they only run when the caller provides
 * an `activeTopicId` (the topic the new user is meant to study). Without it
 * those steps are skipped so the tour never points at a broken route.
 */

const T = (key) => `tour.${key}`

/**
 * @param {{ sessionId?: string|null, activeTopicId?: string|null }} ctx
 * @returns {Array<{id:string, page:string, target:string, titleKey:string, descKey:string, position?:string}>}
 */
export function getTourSteps({ sessionId, activeTopicId } = {}) {
  const modulePage = activeTopicId ? `/module/${activeTopicId}` : null

  const steps = [
    // ── Dashboard ────────────────────────────────────────────────
    {
      id: 'greeting',
      page: '/dashboard',
      target: '[data-tour="greeting"]',
      titleKey: T('greeting_title'),
      descKey: T('greeting_desc'),
    },
    {
      id: 'continue-hero',
      page: '/dashboard',
      target: '[data-tour="continue-hero"]',
      titleKey: T('continue_hero_title'),
      descKey: T('continue_hero_desc'),
    },
    {
      id: 'stats',
      page: '/dashboard',
      target: '[data-tour="stats"]',
      titleKey: T('stats_title'),
      descKey: T('stats_desc'),
    },
    {
      id: 'gamification',
      page: '/dashboard',
      target: '[data-tour="gamification"]',
      titleKey: T('gamification_title'),
      descKey: T('gamification_desc'),
    },
    {
      id: 'analytics',
      page: '/dashboard',
      target: '[data-tour="analytics"]',
      titleKey: T('analytics_title'),
      descKey: T('analytics_desc'),
    },
    // ── Curriculum ───────────────────────────────────────────────
    {
      id: 'curriculum-progress',
      page: '/curriculum',
      target: '[data-tour="curriculum-progress"]',
      titleKey: T('curriculum_progress_title'),
      descKey: T('curriculum_progress_desc'),
    },
    {
      id: 'curriculum-view',
      page: '/curriculum',
      target: '[data-tour="curriculum-view"]',
      titleKey: T('curriculum_view_title'),
      descKey: T('curriculum_view_desc'),
    },
    {
      id: 'curriculum-week',
      page: '/curriculum',
      target: '[data-tour="curriculum-week"]',
      titleKey: T('curriculum_week_title'),
      descKey: T('curriculum_week_desc'),
    },
  ]

  // ── Module (only when we know which topic to open) ─────────────
  if (modulePage) {
    steps.push(
      {
        id: 'module-article',
        page: modulePage,
        target: '[data-tour="module-article"]',
        titleKey: T('module_article_title'),
        descKey: T('module_article_desc'),
      },
      {
        id: 'module-tutor',
        page: modulePage,
        target: '[data-tour="module-tutor"]',
        titleKey: T('module_tutor_title'),
        descKey: T('module_tutor_desc'),
      },
      {
        id: 'module-complete',
        page: modulePage,
        target: '[data-tour="module-complete"]',
        titleKey: T('module_complete_title'),
        descKey: T('module_complete_desc'),
      },
    )
  }

  // ── Chat / Progress / Settings ─────────────────────────────────
  steps.push(
    {
      id: 'chat',
      page: '/chat',
      target: '[data-tour="chat-input"]',
      titleKey: T('chat_title'),
      descKey: T('chat_desc'),
    },
    {
      id: 'progress',
      page: '/progress',
      target: '[data-tour="history-header"]',
      titleKey: T('progress_title'),
      descKey: T('progress_desc'),
    },
    {
      id: 'settings',
      page: '/settings',
      target: '[data-tour="settings-profile"]',
      titleKey: T('settings_title'),
      descKey: T('settings_desc'),
    },
  )

  // Keep sessionId referenced so callers can build steps lazily per session.
  void sessionId

  return steps
}
