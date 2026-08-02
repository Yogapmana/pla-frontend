import api from './client'

export function submitSignal({ session_id, topic_id, quiz_score, reading_time_ratio, reading_time_seconds, question_frequency, self_assessment, material_rating }) {
  return api.post('/progress/signal', {
    session_id,
    topic_id,
    quiz_score,
    reading_time_ratio,
    reading_time_seconds,
    question_frequency,
    self_assessment,
    material_rating,
  }).then((response) => response.data)
}

export function evaluateFeedback(sessionId, topicId) {
  return api.post('/progress/evaluate', null, {
    params: { session_id: sessionId, topic_id: topicId },
  }).then((response) => response.data)
}

export function getUserMetrics(sessionId) {
  return api.get(`/progress/user-metrics/${sessionId}`).then(res => res.data)
}

export function getDailyStudyTime(sessionId, days = 30) {
  return api.get(`/progress/${sessionId}/daily-study-time`, {
    params: { days },
  }).then(res => res.data)
}

export function getTopicSignals(sessionId, topicId) {
  return api.get(`/progress/signals/${sessionId}/${topicId}`).then(res => res.data)
}

export function getRecentActivity(sessionId, limit = 20) {
  return api
    .get(`/progress/${sessionId}/recent-activity`, { params: { limit } })
    .then((res) => res.data)
}
