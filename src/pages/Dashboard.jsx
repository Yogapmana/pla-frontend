import { cn } from '@/lib/utils'
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getDailyStudyTime, getRecentActivity } from '../api/progress';
import { useAuthStore } from '../stores/authStore';
import { useLearningStore } from '../stores/learningStore';
import { useCurriculum, useTopics } from '../hooks/useLearning';
import { useQuizHistory } from '../hooks/useQuiz';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import GreetingHero from '../components/dashboard/GreetingHero';
import { StatCards } from '../components/data/StatCards';
import StreakCard from '../components/gamification/StreakCard';
import XpCard from '../components/gamification/XpCard';

import ContinueLearningHero from '../components/dashboard/ContinueLearningHero';
import RecentActivity from '../components/dashboard/RecentActivity';
import FeedbackBanner from '../components/dashboard/FeedbackBanner';
import LearningAnalytics from '../components/dashboard/LearningAnalytics';
import { Skeleton } from '../components/ui/skeleton';

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 26 } },
};

/** Return last N day keys as 'YYYY-MM-DD' strings (oldest first). */
function lastNDays(n = 7) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

/** Aggregate a numeric field per day from a timestamped array. */
function aggregateByDay(items, valueFn, days = lastNDays()) {
  const map = {};
  items.forEach((item) => {
    const key = new Date(item.created_at).toISOString().split('T')[0];
    map[key] = (map[key] || 0) + valueFn(item);
  });
  return days.map((d) => map[d] || 0);
}

/** Sparkline: quiz scores per day (averaged). */
function quizScoreSparkline(quizHistory) {
  const days = lastNDays();
  const buckets = {};
  quizHistory.forEach((q) => {
    const key = new Date(q.created_at).toISOString().split('T')[0];
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(q.score > 1 ? q.score : q.score * 100);
  });
  return days.map((d) => {
    const scores = buckets[d];
    return scores ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  });
}

/** Sparkline: study hours per day (from quiz time_spent as proxy). */
function studyTimeSparkline(quizHistory) {
  const days = lastNDays();
  const buckets = {};
  quizHistory.forEach((q) => {
    const key = new Date(q.created_at).toISOString().split('T')[0];
    buckets[key] = (buckets[key] || 0) + (q.time_spent_seconds || 0) / 3600;
  });
  return days.map((d) => {
    const h = buckets[d];
    return h ? Math.round(h * 10) / 10 : 0;
  });
}

/** Sparkline: cumulative completed topics per day. */
function completedTopicsSparkline(topics) {
  const completed = topics.filter((t) => t.status === 'completed');
  if (completed.length === 0) return Array(7).fill(0);
  const days = lastNDays();
  const hasTimestamp = completed.some((t) => t.completed_at);
  if (!hasTimestamp) {
    // No per-topic timestamp — show progressive count
    return Array.from({ length: 7 }, (_, i) => Math.round((completed.length * (i + 1)) / 7));
  }
  const buckets = {};
  completed.forEach((t) => {
    const key = new Date(t.completed_at).toISOString().split('T')[0];
    buckets[key] = (buckets[key] || 0) + 1;
  });
  let cumulative = 0;
  return days.map((d) => {
    cumulative += buckets[d] || 0;
    return cumulative;
  });
}

/** Trend: compare avg of last 3 days vs first 3 days of sparkline. */
function sparklineTrend(data) {
  if (!data || data.length < 6) return null;
  const first3 = data.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
  const last3 = data.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const delta = last3 - first3;
  if (Math.abs(delta) < 1) return null;
  return Math.round(delta);
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { activeSession, streak } = useLearningStore();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const [showFeedback, setShowFeedback] = useState(true);
  const sessionId = activeSession?.id;

  // Shared React Query cache — navigasi ulang tidak refetch dalam staleTime
  const { data: curriculum, isLoading: loadingCurriculum } = useCurriculum(sessionId);
  const { data: topicsRaw, isLoading: loadingTopics } = useTopics(sessionId);
  const { data: quizHistoryRaw, isLoading: loadingQuiz } = useQuizHistory(sessionId);

  const topics = useMemo(() => {
    if (!topicsRaw) return [];
    return Array.isArray(topicsRaw) ? topicsRaw : (topicsRaw?.topics || []);
  }, [topicsRaw]);

  const quizHistory = useMemo(
    () => (Array.isArray(quizHistoryRaw) ? quizHistoryRaw : []),
    [quizHistoryRaw],
  );

  const { data: rawStudyTime = [] } = useQuery({
    queryKey: ['daily-study-time', sessionId],
    queryFn: () => getDailyStudyTime(sessionId, 30),
    enabled: !!sessionId,
    staleTime: 60_000,
  });

  const {
    data: recentActivityRaw = [],
    isLoading: loadingActivity,
  } = useQuery({
    queryKey: ['recent-activity', sessionId],
    queryFn: () => getRecentActivity(sessionId, 15),
    enabled: !!sessionId,
    staleTime: 30_000,
  });

  // Skeleton only on first load (no cached data). Revisit shows content immediately.
  const loading = !!sessionId && (loadingTopics || loadingQuiz || loadingCurriculum)
    && topics.length === 0 && quizHistory.length === 0 && !curriculum;

  const completedTopicsCount = topics.filter(t => t.status === 'completed').length;

  const avgQuizScore = quizHistory.length > 0
    ? Math.round(quizHistory.reduce((sum, q) => {
        const scoreVal = q.score > 1 ? q.score : q.score * 100;
        return sum + scoreVal;
      }, 0) / quizHistory.length)
    : 0;

  const studyHoursThisWeek = useMemo(() => {
    const recent7Days = rawStudyTime.slice(-7);
    const totalMins = recent7Days.reduce((sum, entry) => sum + (entry.total_minutes || 0), 0);
    return Math.round((totalMins / 60) * 10) / 10;
  }, [rawStudyTime]);

  // Real sparkline data from quiz history and topic completions
  const completedSparkline = useMemo(() => completedTopicsSparkline(topics), [topics]);
  const studyTimeSpark = useMemo(() => {
    return rawStudyTime.slice(-7).map(entry => (entry.total_minutes || 0) / 60);
  }, [rawStudyTime]);
  const quizScoreSpark = useMemo(() => quizScoreSparkline(quizHistory), [quizHistory]);

  const stats = useMemo(() => [
    {
      label: t('dashboard.stats_completed_topics', 'Topik Selesai'),
      value: completedTopicsCount,
      subtext: t('dashboard.stats_from_total', { total: topics.length || 0, defaultValue: `dari ${topics.length || 0} total` }),
      icon: 'BookOpen',
      color: 'success',
      sparkline: completedSparkline,
      trend: sparklineTrend(completedSparkline),
    },
    {
      label: t('dashboard.stats_study_time', 'Waktu Belajar'),
      value: `${studyHoursThisWeek}j`,
      subtext: t('dashboard.stats_this_week', 'minggu ini'),
      icon: 'Clock',
      color: 'warning',
      sparkline: studyTimeSpark,
      trend: sparklineTrend(studyTimeSpark),
    },
    {
      label: t('dashboard.stats_quiz_score', 'Skor Kuis'),
      value: avgQuizScore,
      subtext: t('dashboard.stats_quizzes_count', { count: quizHistory.length, defaultValue: `${quizHistory.length} kuis` }),
      icon: 'Target',
      color: 'info',
      sparkline: quizScoreSpark,
      trend: sparklineTrend(quizScoreSpark),
    },
  ], [completedTopicsCount, topics.length, studyHoursThisWeek, avgQuizScore, quizHistory.length, completedSparkline, studyTimeSpark, quizScoreSpark]);

  const todayTopic = topics.find(t => t.status === 'active') ||
                      topics.find(t => t.status === 'locked' || !t.status);

  const activities = useMemo(() => {
    if (!Array.isArray(recentActivityRaw) || recentActivityRaw.length === 0) {
      // Fallback: quiz-only if endpoint empty/unavailable
      return quizHistory.slice(0, 8).map((q) => {
        const displayScore = q.score > 1 ? q.score : Math.round(q.score * 100)
        return {
          id: q.id,
          type: 'quiz',
          title: t('dashboard.activity_quiz', {
            topic: q.topic_title || 'Topik',
            defaultValue: `Kuis: ${q.topic_title || 'Topik'}`,
          }),
          description: t('dashboard.activity_score_time', {
            score: displayScore,
            mins: Math.round((q.time_spent_seconds || 0) / 60),
            defaultValue: `Skor: ${displayScore} — ${Math.round((q.time_spent_seconds || 0) / 60)} menit`,
          }),
          created_at: q.created_at,
          score: displayScore,
          topicId: q.topic_id,
        }
      })
    }
    return recentActivityRaw.map((a) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      description: a.description,
      created_at: a.created_at,
      score: a.score,
      topicId: a.topic_id,
      href: a.href,
    }))
  }, [recentActivityRaw, quizHistory, t]);

  const latestFeedbackTopic = useMemo(() => {
    return [...topics].reverse().find(t => t.feedback_action && t.feedback_action !== "continue" && t.status === "completed");
  }, [topics]);

  const feedbackData = useMemo(() => {
    if (!latestFeedbackTopic) return null;
    const action = latestFeedbackTopic.feedback_action;
    const score = latestFeedbackTopic.mastery_score ? Math.round(latestFeedbackTopic.mastery_score * 100) : null;
    
    let title = t('dashboard.feedback_eval_title', "Evaluasi Adaptive Learning");
    let message = t('dashboard.feedback_eval_msg', "Sistem mendeteksi tingkat pemahaman Anda.");
    
    if (action === "repeat") {
      title = t('dashboard.feedback_repeat_title', "Pemahaman Perlu Ditingkatkan");
      message = t('dashboard.feedback_repeat_msg', { score, defaultValue: `Skor penguasaan Anda pada materi terakhir adalah ${score}%. Sistem merekomendasikan Anda untuk mengulang materi yang disederhanakan. Silakan klik 'Lanjut Belajar' untuk memulai ulang.` });
    } else if (action === "review") {
      title = t('dashboard.feedback_review_title', "Sesi Review Ditambahkan");
      message = t('dashboard.feedback_review_msg', { score, defaultValue: `Skor penguasaan Anda pada materi terakhir adalah ${score}%. Agar pemahaman lebih kuat, sebuah topik Review khusus telah disisipkan ke dalam jadwal Anda.` });
    } else if (action === "accelerate") {
      title = t('dashboard.feedback_accel_title', "Anda Sangat Cepat!");
      message = t('dashboard.feedback_accel_msg', { score, defaultValue: `Skor penguasaan Anda adalah ${score}%. Anda memahami materi dengan sangat baik! Jadwal telah dipercepat untuk menyesuaikan kemampuan Anda.` });
    }

    return { title, message, action };
  }, [latestFeedbackTopic]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-80 rounded-xl" />
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const hasSession = activeSession?.id;

  return (
    <motion.div
      variants={shouldReduceMotion ? { hidden: {}, show: {} } : stagger}
      initial="hidden"
      animate="show"
      className="max-w-6xl mx-auto space-y-4 sm:space-y-6 relative pb-8 md:pb-12 min-w-0 w-full"
    >
      {/* Decorative oversized serif numeral — the "dashboard page mark" */}
      <span
        aria-hidden="true"
        className="absolute -top-8 -right-2 deco-num deco-num-secondary hidden md:block"
      >
        ✦
      </span>
      {/* 1. Page header — greeting */}
      <motion.div variants={shouldReduceMotion ? {} : fadeUp}>
        <GreetingHero
          username={user?.username || 'Pelajar'}
          streak={streak}
        />
      </motion.div>

      {/* Feedback banner */}
      {showFeedback && feedbackData && (
        <motion.div variants={shouldReduceMotion ? {} : fadeUp}>
          <FeedbackBanner
            title={feedbackData?.title}
            message={feedbackData?.message}
            action={feedbackData?.action}
            isVisible={showFeedback && !!feedbackData}
            onDismiss={() => setShowFeedback(false)}
            onAction={() => {
              setShowFeedback(false);
              if (feedbackData?.action === 'repeat' && todayTopic) {
                navigate(`/module/${todayTopic.id}`);
              } else {
                navigate('/curriculum');
              }
            }}
          />
        </motion.div>
      )}

      {/* 2. Hero "Continue Learning" card */}
      <motion.div variants={shouldReduceMotion ? {} : fadeUp}>
        <ContinueLearningHero
          topic={todayTopic}
          session={activeSession}
          hasSession={hasSession}
          completedTopics={completedTopicsCount}
          totalTopics={topics.length}
        />
      </motion.div>

      {/* 3. Stats grid — 3 kolom (Streak dipindah ke StreakCard) */}
      <motion.div variants={shouldReduceMotion ? {} : fadeUp}>
        <StatCards stats={stats} />
      </motion.div>

      {/* 3a. Gamification — Streak Heatmap + Level/XP. The streak
          card is a richer version of the old "Streak Hari" stat
          (now 12 weeks of history + longest streak). The XP card
          is brand new and shows the user's level progression
          powered by the Mastery Score milestones. Both pull
          live data from /api/v1/gamification/* — no fake client
          computations, no stale values. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        <motion.div variants={shouldReduceMotion ? {} : fadeUp}>
          <StreakCard />
        </motion.div>
        <motion.div variants={shouldReduceMotion ? {} : fadeUp}>
          <XpCard />
        </motion.div>
      </div>

      {/* Analytics Charts */}
      {topics.length > 0 && (
        <LearningAnalytics topics={topics} quizHistory={quizHistory} sessionId={activeSession?.id} />
      )}

      {/* 4. Recent Activity — full width */}
      <motion.div variants={shouldReduceMotion ? {} : fadeUp}>
        <RecentActivity activities={activities} isLoading={loadingActivity && activities.length === 0} />
      </motion.div>
    </motion.div>
  );
}