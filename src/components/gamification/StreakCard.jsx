import { useQuery } from '@tanstack/react-query';
import { Flame, Trophy, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import StreakHeatmap from './StreakHeatmap';
import { getHeatmap } from '@/api/gamification';
import { useAuthStore } from '@/stores/authStore';
import { useLearningStore } from '@/stores/learningStore';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

/**
 * StreakCard — Dashboard card with the heatmap + headline stats.
 *
 * Replaces the simple "Streak Hari" stat card with a richer view
 * that shows the user:
 *   1. Current streak (big number)
 *   2. Longest streak (smaller)
 *   3. 12-week heatmap (visual consistency)
 *   4. Encouraging CTA
 *
 * The card gracefully degrades while the heatmap is loading —
 * we show a skeleton placeholder instead of the grid. The
 * streak number itself comes from the auth store (which is
 * updated by the login response) so the headline is instant.
 */
export default function StreakCard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const streak = useLearningStore((s) => s.streak) || 0;
  const longestStreak = user?.longest_streak || 0;

  // Heatmap data — 12 weeks (84 days). The API has a 14-day
  // minimum and 365-day maximum, so 84 is a comfortable middle.
  const { data, isLoading } = useQuery({
    queryKey: ['gamification', 'heatmap', 84],
    queryFn: () => getHeatmap(84),
    staleTime: 5 * 60 * 1000, // 5 minutes — heatmap doesn't change often
  });

  // Format the "last login" date for the subtitle. We pull it
  // from the user payload (server timezone).
  const lastLoginLabel = (() => {
    if (!user?.last_login_date) return null;
    try {
      return format(parseISO(user.last_login_date), "d MMM yyyy", { locale: idLocale });
    } catch {
      return null;
    }
  })();

  return (
    <div className="card-base p-4 sm:p-5 md:p-6 min-w-0 overflow-hidden">
      <div className="flex items-start justify-between gap-2 sm:gap-3 mb-4 min-w-0">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary shrink-0">
            <Flame size={18} fill="currentColor" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <h2 className="font-display font-semibold text-primary text-sm truncate">
              {t('dashboard.learning_consistency', 'Konsistensi Belajar')}
            </h2>
            <p className="text-[11px] text-secondary/70 font-label truncate">
              {lastLoginLabel
                ? `${t('dashboard.last_login', 'Login terakhir: ')}${lastLoginLabel}`
                : t('dashboard.login_learning_activity', 'Aktivitas login & belajar')}
            </p>
          </div>
        </div>
        <Link
          to="/progress"
          className="inline-flex items-center gap-1 text-xs font-label font-semibold text-tertiary hover:text-tertiary-dark transition-colors shrink-0"
        >
          {t('dashboard.history', 'Riwayat')}
          <ArrowRight size={12} />
        </Link>
      </div>

      {/* Headline stats — current streak (big) + longest (small) */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-xl bg-tertiary/8 border border-tertiary/15 p-3">
          <div className="flex items-baseline gap-1.5">
            <span
              className="font-display font-bold text-3xl text-tertiary tabular-nums leading-none"
              aria-label={`Streak saat ini: ${streak} hari`}
            >
              {streak}
            </span>
            <span className="text-[11px] text-secondary/70 font-label">{t('dashboard.day', 'hari')}</span>
          </div>
          <p className="text-[11px] text-secondary/80 font-label mt-1">
            {t('dashboard.consecutive', 'Berturut-turut')}
          </p>
        </div>
        <div className="rounded-xl bg-secondary/8 border border-border-subtle p-3">
          <div className="flex items-baseline gap-1.5">
            <span
              className="font-display font-bold text-2xl text-primary tabular-nums leading-none"
              aria-label={`Streak terpanjang: ${longestStreak} hari`}
            >
              {longestStreak}
            </span>
            <span className="text-[11px] text-secondary/70 font-label">{t('dashboard.day', 'hari')}</span>
          </div>
          <p className="text-[11px] text-secondary/80 font-label mt-1 flex items-center gap-1">
            <Trophy size={10} className="text-warning" />
            {t('dashboard.personal_record', 'Rekor pribadi')}
          </p>
        </div>
      </div>

      {/* The heatmap — the main visual. Below: total stats from
          the API response (a quick "23 active days" so the user
          sees the value of the heatmap at a glance). */}
      <StreakHeatmap data={data} isLoading={isLoading} />
      {data && (
        <p
          className="text-[11px] text-secondary/70 font-label mt-3"
          aria-label={`${data.total_active_days} hari aktif dari ${data.days} hari terakhir`}
        >
          {data.total_active_days} {t('dashboard.active_days_from', 'hari aktif dari')} {data.days} {t('dashboard.last_days', 'hari terakhir')} ·{' '}
          {data.total_logins} {t('dashboard.total_logins', 'total login')}
        </p>
      )}

      {/* CTA — encouraging copy when streak > 0. When the user
          has no streak yet, we keep the copy inviting. */}
      <div
        className={cn(
          'mt-4 pt-4 border-t border-border-subtle/60 text-xs text-secondary leading-relaxed',
          streak === 0 && 'text-secondary/80',
        )}
      >
        {streak > 0 ? (
          <>
            {t('dashboard.login_tomorrow_streak', '💡 Login besok untuk tambah streak. Skip satu hari = ')}
            <span className="font-semibold text-tertiary">{t('dashboard.restart_from_1', 'ulang dari 1')}</span>.
          </>
        ) : (
          <>{t('dashboard.login_today_streak', '💡 Login hari ini untuk mulai streak pertamamu.')}</>
        )}
      </div>
    </div>
  );
}
