import { useQuery } from '@tanstack/react-query';
import { Star, Sparkles, TrendingUp, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import XpBar from './XpBar';
import { getXp } from '@/api/gamification';

/**
 * XpCard — Dashboard card with the user's current level + XP.
 *
 * Replaces the fake-XP calculation that was previously inlined
 * in Dashboard.jsx (the
 *   ``xp = completedTopicsCount * 10 + streak * 5``
 * formula). That old calc was a placeholder — the real source of
 * truth is now ``user.total_xp`` (denormalized) and the
 * ``xp_events`` audit log on the backend.
 *
 * The card shows:
 *   1. Current level + level name (e.g. "3 · Pelajar")
 *   2. The progress bar to the next level
 *   3. "Sisa X XP untuk Level Y" hint
 *   4. Recent XP events (the audit feed)
 *
 * Loading state: the card shows a skeleton placeholder. We
 * never show the old fake-XP formula as a fallback — the
 * backend is the source of truth, and showing a wrong number
 * is worse than showing a spinner.
 */
const LEVEL_ICONS = {
  1: '🌱',
  2: '🧭',
  3: '📚',
  4: '🎓',
  5: '🧠',
  6: '⭐',
  7: '🏆',
  8: '👨‍🏫',
  9: '🔮',
  10: '👑',
};

export default function XpCard() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['gamification', 'xp'],
    queryFn: getXp,
    staleTime: 60 * 1000, // 1 minute — XP changes only on mastery milestones
  });

  if (isLoading) {
    return (
      <div className="card-base p-5 md:p-6">
        <div className="h-4 w-32 bg-secondary/10 rounded animate-pulse mb-3" />
        <div className="h-10 w-20 bg-secondary/10 rounded animate-pulse mb-4" />
        <div className="h-2.5 w-full bg-secondary/10 rounded-full animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { total_xp, level_info, recent_events } = data;
  const levelIcon = LEVEL_ICONS[level_info.level] || LEVEL_ICONS[10];

  return (
    <div className="card-base p-4 sm:p-5 md:p-6 min-w-0 overflow-hidden">
      <div className="flex items-start justify-between gap-2 sm:gap-3 mb-4 min-w-0">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center text-warning shrink-0">
            <Star size={18} fill="currentColor" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <h2 className="font-display font-semibold text-primary text-sm truncate">
              {t('dashboard.level_and_xp', 'Level & XP')}
            </h2>
            <p className="text-[11px] text-secondary/70 font-label truncate">
              {t('dashboard.xp_from_mastery', 'XP dari mastery topik')}
            </p>
          </div>
        </div>
        <Link
          to="/progress"
          className="inline-flex items-center gap-1 text-xs font-label font-semibold text-tertiary hover:text-tertiary-dark transition-colors"
        >
          {t('dashboard.xp_history', 'Riwayat XP')}
          <ArrowRight size={12} />
        </Link>
      </div>

      {/* Level display — big number + name + total XP */}
      <div className="flex items-end gap-3 mb-4">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 18 }}
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-warning/15 to-warning/5 flex items-center justify-center text-2xl shrink-0"
          aria-hidden="true"
        >
          {levelIcon}
        </motion.div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span
              className="font-display font-bold text-2xl text-primary leading-none"
              aria-label={`Level ${level_info.level}: ${level_info.level_name}`}
            >
              {level_info.level}
            </span>
            <span className="text-sm font-display font-semibold text-secondary">
              {level_info.level_name}
            </span>
          </div>
          <p className="text-[11px] text-secondary/80 font-label mt-1 tabular-nums">
            {total_xp.toLocaleString('id-ID')} {t('dashboard.total_xp', 'total XP')}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <XpBar
        progressPct={level_info.progress_pct}
        isMaxLevel={level_info.is_max_level}
        levelName={level_info.level_name}
        currentLevelXp={level_info.current_level_xp}
        nextLevelXp={level_info.next_level_xp}
        xpInCurrentLevel={level_info.xp_in_current_level}
        xpToNextLevel={level_info.xp_to_next_level}
      />

      {/* "Sisa X XP" hint */}
      {!level_info.is_max_level && (
        <p className="text-[11px] text-secondary/80 font-label mt-2.5">
          {t('dashboard.remaining', 'Sisa')}{' '}
          <span className="font-semibold text-tertiary tabular-nums">
            {level_info.xp_to_next_level}
          </span>{' '}
          {t('dashboard.xp_for_next_level', 'XP untuk naik ke')}{' '}
          <span className="font-semibold text-primary">
            {t('dashboard.level', 'Level')} {level_info.level + 1}
          </span>
        </p>
      )}

      {/* Recent XP events — small audit feed. Hidden if empty. */}
      {recent_events && recent_events.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border-subtle/60">
          <p className="text-[10.5px] font-label uppercase tracking-wider text-secondary/60 mb-2">
            {t('dashboard.recent_xp', 'XP Terbaru')}
          </p>
          <ul className="space-y-1.5">
            {recent_events.slice(0, 3).map((ev) => (
              <li
                key={ev.id}
                className="flex items-center gap-2 text-xs"
              >
                <span
                  className="w-6 h-6 rounded-md bg-tertiary/10 flex items-center justify-center text-sm shrink-0"
                  aria-hidden="true"
                >
                  {ev.icon}
                </span>
                <span className="flex-1 truncate text-primary">
                  {ev.label}
                </span>
                <span className="font-label font-semibold text-tertiary tabular-nums">
                  +{ev.amount}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Educational hint — how to earn XP. Keeps the panel
          self-explanatory for new users. */}
      <div className="mt-4 pt-3 border-t border-border-subtle/60 text-[11px] text-secondary/80 leading-relaxed">
        <span className="inline-flex items-center gap-1 font-semibold text-tertiary">
          <TrendingUp size={11} />
          {t('dashboard.tip', 'Tip:')}
        </span>{' '}
        {t('dashboard.complete_quizzes_for_xp', 'Selesaikan kuis topik untuk naikin mastery → XP.')}
      </div>
    </div>
  );
}
