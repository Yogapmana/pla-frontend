import { create } from 'zustand'
import { useLearningStore } from './learningStore'
import { useChatStore } from './chatStore'

const USER_KEY = 'pla_user'
// Access token is kept in memory only (for WebSocket ?token=). Session
// authority is the httpOnly cookie pair set by the backend.

/**
 * Pending streak celebration.
 *
 * Set on every login/register that crosses a day boundary
 * (``is_new_day === true``). Read by ``AppLayout`` which renders
 * the global ``StreakCelebration`` modal. Cleared when the user
 * dismisses the modal.
 */
const persistUser = (user) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(USER_KEY, JSON.stringify(user))
}

const clearPersistedUser = () => {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(USER_KEY)
  // Migrate away from legacy token storage
  window.localStorage.removeItem('pla_token')
}

const clearStaleUserData = () => {
  try {
    useLearningStore.getState().setActiveSession(null)
  } catch {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('pla_active_session')
    }
  }

  try {
    useChatStore.getState().setActiveChatSessionId(null)
  } catch {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('chat-storage')
    }
  }
}

const readStoredUser = () => {
  if (typeof window === 'undefined') return null
  const userRaw = window.localStorage.getItem(USER_KEY)
  if (!userRaw) return null
  try {
    const user = JSON.parse(userRaw)
    if (!user?.id || !user?.username || !user?.email) return null
    return user
  } catch {
    return null
  }
}

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null, // in-memory access JWT for WS; cookies are source of truth
  isAuthenticated: false,
  authReady: false, // true after bootstrap attempt finishes
  pendingStreakCelebration: null,
  pendingLevelUp: null,

  login: (token, user, streak = null) => {
    clearStaleUserData()
    persistUser(user)

    const newStreak =
      (user && typeof user.current_streak === 'number' ? user.current_streak : null) ??
      (streak && typeof streak.new_streak === 'number' ? streak.new_streak : null) ??
      null
    if (newStreak !== null) {
      try {
        useLearningStore.getState().setStreak(newStreak)
      } catch {
        /* non-fatal */
      }
    }

    set({
      token: token || null,
      user,
      isAuthenticated: true,
      authReady: true,
      pendingStreakCelebration: streak && streak.is_new_day ? streak : null,
    })
  },

  logout: async ({ skipServer = false } = {}) => {
    if (!skipServer) {
      try {
        const { logoutApi } = await import('../api/auth')
        await logoutApi()
      } catch {
        /* still clear client state */
      }
    }
    clearPersistedUser()
    clearStaleUserData()
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      authReady: true,
      pendingStreakCelebration: null,
      pendingLevelUp: null,
    })
  },

  updateToken: (newToken) => {
    set({ token: newToken || null })
  },

  /** Merge profile fields into the current user and re-persist. */
  updateUser: (partial) => {
    const current = get().user
    if (!current) {
      if (partial?.id) {
        persistUser(partial)
        set({ user: partial, isAuthenticated: true })
      }
      return
    }
    const nextUser = { ...current, ...partial }
    persistUser(nextUser)
    set({ user: nextUser })
  },

  clearStreakCelebration: () => set({ pendingStreakCelebration: null }),

  setLevelUp: (levelUp) => set({ pendingLevelUp: levelUp }),

  clearLevelUp: () => set({ pendingLevelUp: null }),

  /**
   * Bootstrap session from httpOnly cookies: GET /me, on 401 try /refresh then /me.
   */
  restoreSession: async () => {
    const cachedUser = readStoredUser()
    if (cachedUser) {
      // Optimistic UI while we revalidate with cookies
      set({ user: cachedUser, isAuthenticated: true })
      if (typeof cachedUser.current_streak === 'number') {
        try {
          useLearningStore.getState().setStreak(cachedUser.current_streak)
        } catch {
          /* non-fatal */
        }
      }
    }

    try {
      const { getMe, refreshSession } = await import('../api/auth')
      let user
      let accessToken = get().token

      try {
        user = await getMe()
      } catch {
        // No valid access cookie — try refresh only if we had a cached user
        // (otherwise first visit / logged-out would spam 401 on /refresh).
        if (!cachedUser) {
          throw new Error('no_session')
        }
        const refreshed = await refreshSession()
        user = refreshed.user
        accessToken = refreshed.access_token || null
      }

      // Optional: mint in-memory access for WebSocket without failing session
      if (user && !accessToken) {
        try {
          const refreshed = await refreshSession()
          user = refreshed.user || user
          accessToken = refreshed.access_token || null
        } catch {
          /* HTTP still works via access cookie */
        }
      }

      persistUser(user)
      if (typeof user.current_streak === 'number') {
        try {
          useLearningStore.getState().setStreak(user.current_streak)
        } catch {
          /* non-fatal */
        }
      }
      set({
        user,
        token: accessToken,
        isAuthenticated: true,
        authReady: true,
      })
    } catch {
      clearPersistedUser()
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        authReady: true,
      })
    }
  },
}))

if (typeof window !== 'undefined') {
  // Kick off cookie-based restore once at module load
  useAuthStore.getState().restoreSession()
}
