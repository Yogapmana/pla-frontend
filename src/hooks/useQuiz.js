import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getQuiz,
  getQuizHistory,
  getQuizHistoryByTopic,
  getQuizAttemptDetail,
  submitQuiz,
} from '../api/quiz'

export function useQuiz(topicId, numQuestions) {
  return useQuery({
    queryKey: ['quiz', topicId, numQuestions],
    queryFn: () => getQuiz(topicId, numQuestions),
    enabled: !!topicId,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: Infinity,
  })
}

export function useSubmitQuiz() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => submitQuiz(data),
    onSuccess: (_, variables) => {
      const sessionId = variables?.sessionId ?? variables?.session_id
      // NOTE: we intentionally do NOT removeQueries(['quiz', topicId]) here.
      // Doing so while the Quiz page is still mounted makes react-query
      // recreate the query and refetch immediately, flipping isLoading back
      // to true so the result screen is replaced by the loader — and the
      // backend regenerates a brand-new quiz via the LLM for a topic that
      // was just consumed/completed. Cache cleanup happens on page unmount
      // instead (see Quiz.jsx), and Retry forces a refetch() by itself.
      if (sessionId) {
        queryClient.invalidateQueries({ queryKey: ['quiz-results', sessionId] })
        // Also invalidate per-topic views (so the "Attempt N of M"
        // page refreshes after a new submission).
        queryClient.invalidateQueries({
          queryKey: ['quiz-results-by-topic', sessionId],
        })
      }
    },
  })
}

export function useQuizHistory(sessionId) {
  return useQuery({
    queryKey: ['quiz-results', sessionId],
    queryFn: () => getQuizHistory(sessionId),
    enabled: !!sessionId,
    staleTime: 60_000,
  })
}

export function useQuizHistoryByTopic(sessionId, topicId) {
  return useQuery({
    queryKey: ['quiz-results-by-topic', sessionId, topicId],
    queryFn: () => getQuizHistoryByTopic(sessionId, topicId),
    enabled: !!sessionId && !!topicId,
    staleTime: 60_000,
  })
}

export function useQuizAttemptDetail(attemptId) {
  return useQuery({
    queryKey: ['quiz-attempt', attemptId],
    queryFn: () => getQuizAttemptDetail(attemptId),
    enabled: !!attemptId,
    staleTime: 5 * 60_000,
  })
}
