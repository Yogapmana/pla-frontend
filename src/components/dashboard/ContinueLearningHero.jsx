import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { BookOpen, PlayCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import StatusBadge from '../common/StatusBadge';

/**
 * ContinueLearningHero — the "today's hero" card on the dashboard.
 *
 * Phase 5.3: rebuilt with editorial treatment.
 *  - Larger, more prominent (dominates the dashboard fold)
 *  - Decorative oversized serif numeral as watermark
 *  - Gradient mesh + decorative flourishes
 *  - Clear hierarchy: Eyebrow → Topic → Meta → CTA → Visual
 *  - States: no-session, all-done, ready-to-learn (each with personality)
 */
export default function ContinueLearningHero({
  topic,
  session,
  hasSession,
  completedTopics,
  totalTopics,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  if (!hasSession) {
    return (
      <motion.div
        {...(shouldReduceMotion ? {} : { whileHover: { y: -2 } })}
        className="card-hero p-4 sm:p-7 md:p-9 relative overflow-hidden gradient-mesh-warm min-w-0"
      >
        <span
          aria-hidden="true"
          className="absolute top-3 right-4 font-display text-5xl sm:text-7xl font-black italic text-tertiary/[0.06] leading-none pointer-events-none select-none"
        >
          ✦
        </span>
        <span
          aria-hidden="true"
          className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-tertiary/[0.06] blur-3xl pointer-events-none"
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-4 sm:gap-6">
          <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
            <div className="flex items-center gap-2">
              <span className="eyebrow">{t('dashboard.chapter_start', 'Bab 01 — Mulai')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-[2.5rem] font-display font-bold text-primary leading-[1.1] tracking-tight break-words">
              {t('dashboard.start_journey', 'Mulai perjalanan')}
              <br />
              <span className="italic text-tertiary">{t('dashboard.learning', 'belajarmu')}</span>
            </h2>
            <p className="text-secondary max-w-lg leading-relaxed font-serif-content">
              {t('dashboard.no_session_desc', 'Belum ada sesi aktif. Buat kurikulum pertamamu dan biarkan Planner Agent menyusun jalur belajar yang dipersonalisasi untukmu.')}
            </p>
            <div className="pt-2">
              <Button
                variant="tertiary"
                size="lg"
                className="gap-2 rounded-xl font-semibold shadow-warm-md group w-full sm:w-auto justify-center"
                onClick={() => navigate('/onboarding')}
              >
                <Sparkles className="w-5 h-5" />
                {t('dashboard.create_curriculum', 'Buat Kurikulum')}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
          <div className="hidden md:flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-tertiary/10 blur-2xl rounded-3xl" />
              <div className="relative w-32 h-32 rounded-3xl bg-surface border-2 border-tertiary/30 flex items-center justify-center shadow-warm-lg rotate-3">
                <BookOpen className="w-14 h-14 text-tertiary" strokeWidth={1.5} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!topic) {
    return (
      <motion.div
        {...(shouldReduceMotion ? {} : { whileHover: { y: -2 } })}
        className="card-hero p-4 sm:p-7 md:p-9 relative overflow-hidden bg-gradient-to-br from-success/[0.04] via-surface to-transparent border-success/30 min-w-0"
      >
        <span
          aria-hidden="true"
          className="absolute top-3 right-4 font-display text-5xl sm:text-7xl font-black italic text-success/[0.08] leading-none pointer-events-none select-none"
        >
          ✓
        </span>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-4 sm:gap-6">
          <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
            <div className="flex items-center gap-2">
              <StatusBadge variant="success">{t('dashboard.passed', 'Lulus')}</StatusBadge>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-[2.5rem] font-display font-bold text-primary leading-[1.1] tracking-tight break-words">
              {t('dashboard.all_topics', 'Semua topik')}
              <br />
              <span className="italic text-success">{t('dashboard.finished', 'sudah selesai')}</span>
            </h2>
            <p className="text-secondary max-w-lg leading-relaxed font-serif-content text-sm sm:text-base">
              {t('dashboard.all_topics_desc', 'Kamu sudah menyelesaikan semua materi yang tersedia. Saatnya review atau memulai topik baru.')}
            </p>
            <div className="pt-2">
              <Button
                variant="tertiary"
                size="lg"
                className="gap-2 rounded-xl font-semibold shadow-warm-md w-full sm:w-auto justify-center"
                onClick={() => navigate('/onboarding')}
              >
                <Sparkles className="w-5 h-5" />
                {t('dashboard.start_new_topic', 'Mulai Topik Baru')}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="hidden md:flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-success/15 blur-2xl rounded-3xl" />
              <div className="relative w-32 h-32 rounded-3xl bg-success-light border-2 border-success/40 flex items-center justify-center shadow-warm-lg -rotate-3">
                <BookOpen className="w-14 h-14 text-success-fg" strokeWidth={1.5} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const progress = topic.progress || 0;
  const topicTitle = topic.title || t('dashboard.next_topic', 'Topik berikutnya');
  const durationMinutes = topic.duration_minutes || 30;
  const topicIndex = completedTopics + 1;
  const progressFraction = Math.min(1, Math.max(0, progress / 100));

  const hoverProps = shouldReduceMotion ? {} : { whileHover: { y: -2 } };

  return (
    <motion.div
      {...hoverProps}
      className="card-hero p-4 sm:p-7 md:p-9 relative overflow-hidden bg-gradient-to-br from-tertiary/[0.04] via-warning/[0.025] to-transparent border-tertiary/20 min-w-0"
    >
      {/* Decorative oversized numeral — watermark */}
      <span
        aria-hidden="true"
        className="absolute -top-4 -right-2 font-display text-[5rem] sm:text-[7rem] md:text-[9rem] font-black italic text-tertiary/[0.07] leading-none pointer-events-none select-none"
      >
        ✦
      </span>

      {/* Soft glows for atmosphere */}
      <span className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-tertiary/[0.05] blur-3xl pointer-events-none" />
      <span className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-warning/[0.05] blur-2xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 sm:gap-6 md:gap-8 items-center">
        <div className="space-y-3 sm:space-y-4 min-w-0">
          {/* Eyebrow — establishes hierarchy */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <span className="eyebrow">{t('dashboard.chapter_continue', { num: String(topicIndex).padStart(2, '0'), defaultValue: `Bab ${String(topicIndex).padStart(2, '0')} — Lanjutkan` })}</span>
            {totalTopics > 0 && (
              <span className="text-[10px] font-label uppercase tracking-wider text-secondary/70 tabular-nums">
                {t('dashboard.topics_count', { completed: completedTopics, total: totalTopics, defaultValue: `${completedTopics} / ${totalTopics} topik` })}
              </span>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-display font-bold text-primary leading-[1.1] tracking-tight break-words">
            {topicTitle}
          </h2>

          <div className="flex items-center gap-3 sm:gap-4 text-sm text-secondary font-label flex-wrap">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-tertiary shrink-0" />
              <span className="tabular-nums">{t('dashboard.mins', { duration: durationMinutes, defaultValue: `${durationMinutes} menit` })}</span>
            </span>
            {progress > 0 && (
              <span className="flex items-center gap-1.5 text-tertiary font-semibold">
                <span className="tabular-nums">{t('dashboard.percent_finished', { progress: Math.round(progress), defaultValue: `${Math.round(progress)}% selesai` })}</span>
              </span>
            )}
          </div>

          {progress > 0 && (
            <div className="space-y-1.5 max-w-md">
              <Progress
                value={progress}
                className="h-2 bg-secondary/15 rounded-full"
                indicatorClassName="bg-tertiary rounded-full"
              />
            </div>
          )}

          <div className="pt-1 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
            <Button
              variant="tertiary"
              size="lg"
              className="gap-2 rounded-xl font-semibold shadow-warm-md group w-full sm:w-auto justify-center"
              onClick={() => navigate(`/module/${topic.id}`)}
            >
              <PlayCircle className="w-5 h-5" fill="currentColor" />
              {progress > 0 ? t('dashboard.continue_learning', 'Lanjutkan Belajar') : t('dashboard.start_now', 'Mulai Sekarang')}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="rounded-xl font-semibold text-secondary hover:text-primary w-full sm:w-auto justify-center"
              onClick={() => navigate('/curriculum')}
            >
              {t('dashboard.view_curriculum', 'Lihat kurikulum')}
            </Button>
          </div>
        </div>

        {/* Decorative visual on the right */}
        <div className="hidden md:flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-tertiary/10 blur-2xl rounded-3xl" />
            <div className="relative w-36 h-36 rounded-3xl bg-surface border-2 border-tertiary/30 flex items-center justify-center shadow-warm-lg rotate-3 hover:rotate-0 transition-transform duration-500">
              {/* Progress ring around the book icon */}
              <svg
                className="absolute inset-0"
                viewBox="0 0 100 100"
                aria-hidden="true"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="rgb(196, 37, 28)"
                  strokeOpacity="0.12"
                  strokeWidth="2"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="rgb(196, 37, 28)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={`${progressFraction * 289} 289`}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <BookOpen className="w-14 h-14 text-tertiary" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}