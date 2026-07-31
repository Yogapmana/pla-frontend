import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { id as idLocale, enUS } from 'date-fns/locale';
import { getDailyStudyTime } from '../../api/progress';

export default function LearningAnalytics({ topics, quizHistory, sessionId }) {
  const { t, i18n } = useTranslation();

  // Pick locale based on current language
  const dateLocale = i18n.language?.startsWith('en') ? enUS : idLocale;

  // 1. Fetch actual daily study time from backend
  const { data: rawStudyTime = [] } = useQuery({
    queryKey: ['daily-study-time', sessionId],
    queryFn: () => getDailyStudyTime(sessionId, 30),
    enabled: !!sessionId,
    staleTime: 60_000,
  });

  // Format for chart — last 7 active days
  const studyTimeData = useMemo(() => {
    return rawStudyTime
      .map(entry => {
        const dateObj = parseISO(entry.date);
        return {
          fullDate: entry.date,
          label: format(dateObj, 'd MMM', { locale: dateLocale }),
          reading: entry.reading_minutes,
          quiz: entry.quiz_minutes,
          total: entry.total_minutes,
        };
      })
      .slice(-7);
  }, [rawStudyTime, dateLocale]);


  // 2. Prepare Mastery Progress Data (Line Chart)
  // Prefer completed topics with mastery/quiz scores. Fall back to quizHistory
  // when topic.completed_at is missing from older API payloads or DB rows.
  const masteryData = useMemo(() => {
    const topicList = Array.isArray(topics) ? topics : [];
    const quizzes = Array.isArray(quizHistory) ? quizHistory : [];

    // Latest quiz score per topic_id (0-1 or 0-100 — normalize later)
    const latestQuizByTopic = new Map();
    for (const q of quizzes) {
      const tid = q.topic_id || q.topicId;
      if (!tid) continue;
      const prev = latestQuizByTopic.get(tid);
      const qTime = new Date(q.created_at || q.submitted_at || 0).getTime();
      if (!prev || qTime >= prev.time) {
        latestQuizByTopic.set(tid, { score: q.score, time: qTime, title: q.topic_title });
      }
    }

    const toPct = (value) => {
      if (value == null || Number.isNaN(Number(value))) return null;
      const n = Number(value);
      // Backend stores 0-1; some quiz history endpoints already return 0-100.
      return n <= 1 ? Math.round(n * 100) : Math.round(n);
    };

    const scoredTopics = topicList
      .filter((t) => {
        if (!t) return false;
        const hasScore = t.mastery_score != null || t.quiz_score != null || latestQuizByTopic.has(t.id);
        // Include completed topics, or any topic that already has mastery/quiz data
        // (XP milestones can exist before status flips if timing races).
        return (t.status === 'completed' || hasScore) && hasScore;
      })
      .sort((a, b) => {
        const aTime = new Date(a.completed_at || a.scheduled_date || 0).getTime();
        const bTime = new Date(b.completed_at || b.scheduled_date || 0).getTime();
        if (aTime !== bTime) return aTime - bTime;
        // Stable curriculum order fallback
        return (a.week_number - b.week_number) || (a.day_number - b.day_number);
      });

    const masteryHistory = scoredTopics.map((topic) => {
      const title = topic.title || latestQuizByTopic.get(topic.id)?.title || topic.id;
      const shortTitle = title.length > 15 ? title.substring(0, 15) + '...' : title;
      const quizFallback = latestQuizByTopic.get(topic.id)?.score;
      const masteryPct = toPct(topic.mastery_score) ?? toPct(topic.quiz_score) ?? toPct(quizFallback) ?? 0;
      const quizPct = toPct(topic.quiz_score) ?? toPct(quizFallback) ?? masteryPct;

      return {
        name: shortTitle,
        fullTitle: title,
        mastery: masteryPct,
        quizScore: quizPct,
      };
    });

    // If topics payload still empty but quizzes exist, chart from quiz attempts.
    if (masteryHistory.length === 0 && latestQuizByTopic.size > 0) {
      const fromQuizzes = [...latestQuizByTopic.entries()]
        .sort((a, b) => a[1].time - b[1].time)
        .map(([, entry]) => {
          const title = entry.title || 'Topik';
          const shortTitle = title.length > 15 ? title.substring(0, 15) + '...' : title;
          const pct = toPct(entry.score) ?? 0;
          return { name: shortTitle, fullTitle: title, mastery: pct, quizScore: pct };
        });
      return fromQuizzes.slice(-10);
    }

    return masteryHistory.slice(-10);
  }, [topics, quizHistory]);

  if (studyTimeData.length === 0 && masteryData.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full min-w-0">

      {/* Chart 1: Daily Study Time (stacked bar: reading + quiz) */}
      <div className="card-base p-4 sm:p-6 flex flex-col h-full min-w-0 overflow-hidden">
        <h3 className="text-base sm:text-lg font-display font-bold text-primary mb-1">
          {t('analytics.study_time_title', 'Daily Study Time')}
        </h3>
        <p className="text-xs sm:text-sm text-secondary mb-4 sm:mb-6">
          {t('analytics.study_time_desc', 'Duration reading modules and taking quizzes (last 7 active days)')}
        </p>

        <div className="flex-1 w-full min-h-[220px] sm:min-h-[250px] min-w-0">
          {studyTimeData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studyTimeData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  label={{ value: t('analytics.minutes_short', 'min'), angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#9CA3AF' } }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value, name) => {
                    const label = name === 'reading'
                      ? t('analytics.reading', 'Reading Modules')
                      : t('analytics.quiz', 'Quiz');
                    return [`${value} ${t('analytics.minutes_short', 'min')}`, label];
                  }}
                  labelStyle={{ color: '#374151', fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  formatter={(value) => value === 'reading'
                    ? t('analytics.reading', 'Reading Modules')
                    : t('analytics.quiz', 'Quiz')}
                />
                <Bar
                  dataKey="reading"
                  stackId="study"
                  fill="rgb(var(--tertiary))"
                  radius={[0, 0, 0, 0]}
                  barSize={32}
                  name="reading"
                />
                <Bar
                  dataKey="quiz"
                  stackId="study"
                  fill="rgb(var(--warning))"
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                  name="quiz"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              {t('analytics.no_study_data', 'No learning data yet')}
            </div>
          )}
        </div>
      </div>

      {/* Chart 2: Mastery Progress */}
      <div className="card-base p-4 sm:p-6 flex flex-col h-full min-w-0 overflow-hidden">
        <h3 className="text-base sm:text-lg font-display font-bold text-primary mb-1">
          {t('analytics.mastery_progress_title', 'Understanding Progress')}
        </h3>
        <p className="text-xs sm:text-sm text-secondary mb-4 sm:mb-6">
          {t('analytics.mastery_progress_desc', 'Mastery score and quiz results trend (last 10 topics)')}
        </p>

        <div className="flex-1 w-full min-h-[220px] sm:min-h-[250px] min-w-0">
          {masteryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={masteryData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  dy={10}
                />
                <YAxis
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  // Recharts passes series `name` (display label), not dataKey.
                  // Prefer item.dataKey so mastery stays green-labeled and quiz purple.
                  formatter={(value, name, item) => {
                    const key = item?.dataKey ?? name;
                    const label =
                      key === 'mastery'
                        ? t('analytics.mastery_score', 'Mastery Score')
                        : key === 'quizScore'
                          ? t('analytics.quiz_score', 'Quiz Score')
                          : name;
                    return [`${value}%`, label];
                  }}
                  labelFormatter={(_, payload) => payload[0]?.payload.fullTitle || ''}
                  labelStyle={{ color: '#374151', fontWeight: 'bold', marginBottom: '4px', maxWidth: '200px', whiteSpace: 'normal' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="mastery"
                  name={t('analytics.mastery_score', 'Mastery Score')}
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="quizScore"
                  name={t('analytics.quiz_score', 'Quiz Score')}
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              {t('analytics.no_mastery_data', 'No topic scores yet')}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
