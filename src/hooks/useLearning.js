import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { completeTopic, getCurriculum, getModule, getSessions, getTopics, startLearning } from '../api/learning'
import { useLearningStore } from '../stores/learningStore'
import {
  getMindmap,
  regenerateMindmap,
  getMindmapData,
  getConceptGraph,
  regenerateConceptGraph,
  getCurriculumDetail,
  getMermaidMindmap,
  regenerateMermaidMindmap,
  getEnhancedMindmap,
} from '../api/curriculum'
import { SESSION_STATUSES, hasActiveSession } from '../stores/learningStore'

const SESSION_STATUS_PRIORITY = {
  [SESSION_STATUSES.READY]: 0,
  [SESSION_STATUSES.PROCESSING]: 1,
  [SESSION_STATUSES.ACTIVE]: 2,
}

function findActiveSession(sessions) {
  if (!Array.isArray(sessions)) {
    return null
  }

  return sessions
    .filter((session) => hasActiveSession(session))
    .sort((a, b) => {
      const priorityA = SESSION_STATUS_PRIORITY[a?.status] ?? Number.POSITIVE_INFINITY
      const priorityB = SESSION_STATUS_PRIORITY[b?.status] ?? Number.POSITIVE_INFINITY

      return priorityA - priorityB
    })[0] || null
}

export function useActiveSession(options = {}) {
  return useQuery({
    queryKey: ['active-session'],
    queryFn: async () => {
      const sessions = await getSessions()
      const storeSession = useLearningStore.getState().activeSession
      
      // If store has an active session, check if it's in the fetched sessions
      if (storeSession) {
        const matched = sessions.find(s => s.id === storeSession.id)
        if (matched) {
          // Keep the store in sync with fresh data
          useLearningStore.getState().setActiveSession(matched)
          return matched
        }
      }
      
      // Fallback to highest priority session
      const fallback = findActiveSession(sessions)
      if (fallback) {
        useLearningStore.getState().setActiveSession(fallback)
      }
      return fallback
    },
    enabled: options.enabled !== false,
    staleTime: 2 * 60_000,
    // Show previous session while background revalidate — no blank flash
    placeholderData: () => useLearningStore.getState().activeSession ?? undefined,
  })
}

export function useAllSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: getSessions,
    staleTime: 2 * 60_000,
  })
}

export function useCurriculum(sessionId) {
  return useQuery({
    queryKey: ['curriculum', sessionId],
    queryFn: () => getCurriculum(sessionId),
    enabled: !!sessionId,
    staleTime: 5 * 60_000,
  })
}

export function useTopics(sessionId) {
  return useQuery({
    queryKey: ['topics', sessionId],
    queryFn: () => getTopics(sessionId),
    enabled: !!sessionId,
    staleTime: 60_000,
  })
}

export function useModule(sessionId, topicId) {
  return useQuery({
    queryKey: ['module', topicId],
    queryFn: () => getModule(sessionId, topicId),
    enabled: !!sessionId && !!topicId,
    staleTime: 5 * 60_000,
  })
}

export function useCompleteTopic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, topicId }) => completeTopic(sessionId, topicId),
    onSuccess: async (_, variables) => {
      queryClient.removeQueries({ queryKey: ['topics', variables.sessionId] })
      queryClient.removeQueries({ queryKey: ['curriculum', variables.sessionId] })
      queryClient.invalidateQueries({ queryKey: ['module', variables.topicId] })
    },
  })
}

export function useStartLearning() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (config) => startLearning(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-session'] })
    },
  })
}

// --------------------------------------------------------------------------- //
// Mind Map hooks
// --------------------------------------------------------------------------- //

/**
 * Fetch the AI-generated Mermaid mind map for a learning session.
 * Cached on the server side (in `curricula.mindmap_json`).
 *
 * NOTE: kept for backward compatibility / export-to-Mermaid use cases.
 * The interactive MindMapView v2 uses `useMindmapData` instead.
 */
export function useMindmap(sessionId, options = {}) {
  return useQuery({
    queryKey: ['mindmap', sessionId],
    queryFn: () => getMindmap(sessionId),
    enabled: !!sessionId && (options.enabled ?? true),
    // Mind maps are large — give them an hour of staleness
    staleTime: 60 * 60 * 1000,
    ...options,
  })
}

/**
 * Fetch structured curriculum data for the interactive (non-Mermaid) mind
 * map view. Cheap & deterministic — no LLM, no cache.
 */
export function useMindmapData(sessionId, options = {}) {
  return useQuery({
    queryKey: ['mindmap-data', sessionId],
    queryFn: () => getMindmapData(sessionId),
    enabled: !!sessionId && (options.enabled ?? true),
    staleTime: 5 * 60 * 1000,  // 5 min
    ...options,
  })
}

/**
 * Hook for the NotebookLM-style enhanced mindmap.
 *
 * Behavior:
 *   - Returns ``{ data, isLoading, isError }`` from React Query.
 *   - ``data.ready === false`` means the background Celery task
 *     hasn't finished yet (or failed). The component should show
 *     a "preparing mindmap..." state.
 *   - We poll every 5s while ``ready === false`` so the component
 *     automatically picks up the new mindmap once it lands.
 *   - ``refetchIntervalInBackground: true`` is important — by
 *     default React Query pauses polling when the browser tab is
 *     hidden. We explicitly keep it running so a user who has
 *     Curriculum open in a background tab still sees the new
 *     mindmap when they come back. (Without this, the
 *     ``mindmap_enhanced`` WebSocket event would be the only
 *     way to learn about the update — and we don't have a
 *     WebSocket consumer wired in yet.)
 *   - The component can ALSO call ``refetch()`` for an instant
 *     manual refresh (the "Coba lagi" button in the loading UI).
 *
 * @param {string} sessionId - UUID
 */
export function useEnhancedMindmap(sessionId, options = {}) {
  return useQuery({
    queryKey: ['enhanced-mindmap', sessionId],
    queryFn: () => getEnhancedMindmap(sessionId),
    enabled: !!sessionId && (options.enabled ?? true),
    refetchInterval: (query) => {
      // Poll every 5s while waiting for the Celery task. Stop as
      // soon as the payload arrives.
      const data = query.state.data
      if (data?.ready) return false
      return 5000
    },
    // Keep polling even when the tab is in the background. Without
    // this, a user who minimizes the Curriculum tab while the
    // mindmap is generating would see a stale "preparing..." UI
    // when they come back, even though the data has been ready
    // for minutes.
    refetchIntervalInBackground: true,
    staleTime: 30 * 1000,  // 30 s — short enough that a manual
                           // refresh picks up the new data quickly
    ...options,
  })
}

/**
 * Force-regenerate the Mermaid mind map (bypasses server cache).
 * Used by the "Buat Ulang" button on the legacy Mermaid view.
 */
export function useRegenerateMindmap() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId) => regenerateMindmap(sessionId),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['mindmap', sessionId] })
    },
  })
}

// --------------------------------------------------------------------------- //
// Concept graph hooks
// --------------------------------------------------------------------------- //

/**
 * Fetch the structured concept graph (root → cluster → concept → topic →
 * resource) for the "Konsep" mind map view. Cached on the server side.
 *
 * First request after a replan may take 15-45s while the LLM extracts
 * concepts week-by-week. The query's default timeout is 60s to accommodate.
 */
export function useConceptGraph(sessionId, options = {}) {
  return useQuery({
    queryKey: ['concept-graph', sessionId],
    queryFn: () => getConceptGraph(sessionId),
    enabled: !!sessionId && (options.enabled ?? true),
    staleTime: 60 * 60 * 1000,  // 1 hr — graph rarely changes
    ...options,
  })
}

/**
 * Force-regenerate the concept graph. Used by the "Buat Ulang" button.
 */
export function useRegenerateConceptGraph() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId) => regenerateConceptGraph(sessionId),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['concept-graph', sessionId] })
    },
  })
}

/**
 * Fetch the curriculum detail (curriculum + topics + search_queries) for
 * the ConceptDetailPanel side panel.
 */
export function useCurriculumDetail(sessionId, options = {}) {
  return useQuery({
    queryKey: ['curriculum-detail', sessionId],
    queryFn: () => getCurriculumDetail(sessionId),
    enabled: !!sessionId && (options.enabled ?? true),
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

/**
 * Fetch the Mermaid v11 mindmap syntax for the dark-themed Konsep view.
 * Same cache as the concept graph (one DB row, one LLM build) but the
 * endpoint returns the pre-rendered syntax string ready for
 * ``mermaid.render()``.
 */
export function useMermaidMindmap(sessionId, options = {}) {
  return useQuery({
    queryKey: ['mermaid-mindmap', sessionId],
    queryFn: () => getMermaidMindmap(sessionId),
    enabled: !!sessionId && (options.enabled ?? true),
    // The syntax rarely changes; 1hr is a safe staleness window.
    // The endpoint itself is fast — only the LLM build (which writes
    // to the concept_graph_json cache) is slow, and that runs once
    // per cache-miss.
    staleTime: 60 * 60 * 1000,
    ...options,
  })
}

/**
 * Force-regenerate the underlying concept graph (and therefore the
 * Mermaid syntax). Used by the "Buat Ulang" button on the Mermaid view.
 */
export function useRegenerateMermaidMindmap() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId) => regenerateMermaidMindmap(sessionId),
    onSuccess: (_, sessionId) => {
      // Invalidate BOTH queries — they share the same backend cache.
      queryClient.invalidateQueries({ queryKey: ['mermaid-mindmap', sessionId] })
      queryClient.invalidateQueries({ queryKey: ['concept-graph', sessionId] })
    },
  })
}
