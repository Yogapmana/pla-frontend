import React from 'react';
import { Flame } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { LEVEL_NAMES, LEVEL_THRESHOLDS } from '../../utils/constants';
import { CountUp } from './CountUp';

function getTimeGreeting(t) {
  const hour = new Date().getHours();
  if (hour < 11) return t('dashboard.morning', 'Selamat pagi');
  if (hour < 15) return t('dashboard.afternoon', 'Selamat siang');
  if (hour < 18) return t('dashboard.evening', 'Selamat sore');
  return t('dashboard.night', 'Selamat malam');
}

function getLevelInfo(xp) {
  const levels = Object.entries(LEVEL_THRESHOLDS).sort((a, b) => a[0] - b[0]);
  for (const [level, range] of levels) {
    if (xp >= range.min && xp <= range.max) {
      return {
        level: parseInt(level, 10),
        name: LEVEL_NAMES[level],
        min: range.min,
        max: range.max === Infinity ? xp : range.max,
      };
    }
  }
  return { level: 5, name: LEVEL_NAMES[5], min: 1001, max: xp };
}

export default function GreetingHero({ username = 'Pelajar', streak = 0, xp = 0 }) {
  const { t } = useTranslation();
  const greeting = getTimeGreeting(t);
  const levelInfo = getLevelInfo(xp);
  const shouldReduceMotion = useReducedMotion();

  const range = levelInfo.max - levelInfo.min;
  const currentProgress = xp - levelInfo.min;
  const progressPercent =
    range <= 0
      ? 100
      : (levelInfo.max === xp && levelInfo.max !== 0
          ? 100
          : (currentProgress / range) * 100);

  return (
    <div className="page-header min-w-0">
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1 min-w-0">
          <h1 className="page-title break-words">
            <span className="block sm:inline">{greeting},</span>{' '}
            <span className="break-words">{username}</span>
          </h1>
          <p className="page-subtitle">
            {t('dashboard.ready', 'Siap untuk melanjutkan petualangan belajarmu hari ini?')}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-2.5 bg-tertiary/10 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-tertiary/20">
            <motion.div
              initial={shouldReduceMotion ? { scale: 1 } : { scale: 0.8 }}
              animate={shouldReduceMotion ? { scale: 1 } : { scale: [0.8, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2, repeatType: 'reverse' }}
            >
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-tertiary fill-tertiary" />
            </motion.div>
            <div>
              <div className="text-[10px] font-label uppercase tracking-wider text-tertiary/80 leading-none">
                {t('dashboard.streak', 'Streak')}
              </div>
              <div className="text-base sm:text-lg font-bold text-tertiary leading-tight">
                <CountUp value={streak} /> {t('dashboard.days', 'Hari')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 bg-surface px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-[var(--border)] shadow-warm-xs min-w-0 max-w-full">
            <div className="min-w-0">
              <div className="text-[10px] font-label uppercase tracking-wider text-secondary leading-none">
                {t('dashboard.level', 'Level')} {levelInfo.level}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-primary leading-tight truncate max-w-[9rem] sm:max-w-none">
                {levelInfo.name}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}