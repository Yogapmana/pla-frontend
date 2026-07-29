export const AGENT_COLORS = {
  orchestrator: '#8b5cf6',
  planner: '#0d9488',
  researcher: '#f97316',
  composer: '#ec4899',
  tutor: '#3b82f6',
};

export const AGENT_LABELS = {
  orchestrator: 'Orchestrator',
  planner: 'Planner',
  researcher: 'Researcher',
  composer: 'Composer',
  tutor: 'Tutor',
};

export const TOPIC_STATUS = {
  COMPLETED: 'Selesai',
  ACTIVE: 'Sedang berjalan',
  REVIEW: 'Perlu diulang',
  LOCKED: 'Terkunci',
};

export const TOPIC_STATUS_COLORS = {
  COMPLETED: '#22c55e',
  ACTIVE: '#3b82f6',
  REVIEW: '#f59e0b',
  LOCKED: '#94a3b8',
};

export const LEVEL_OPTIONS = [
  { label: 'Pemula', value: 'beginner' },
  { label: 'Menengah', value: 'intermediate' },
  { label: 'Mahir', value: 'advanced' },
];

export const DURATION_OPTIONS = [
  { label: '1 minggu', value: 1 },
  { label: '1 bulan', value: 4 },
  { label: '3 bulan', value: 12 },
  { label: '6 bulan', value: 24 },
];

export const HOURS_PER_DAY_OPTIONS = [
  { label: '30 mnt', value: 0.5 },
  { label: '1 jam', value: 1 },
  { label: '2 jam', value: 2 },
  { label: '3+ jam', value: 3 },
];

export const XP_REWARDS = {
  MODULE_COMPLETION: 10,
  QUIZ_75: 20,
  QUIZ_90: 30,
  CHAT_QUESTION: 2,
  STREAK_MILESTONE: 50,
};

export const LEVEL_NAMES = {
  1: 'Penjelajah Baru',
  2: 'Pelajar Aktif',
  3: 'Penggali Ilmu',
  4: 'Pemikir Kritis',
  5: 'Master Belajar',
};

export const LEVEL_THRESHOLDS = {
  1: { min: 0, max: 100 },
  2: { min: 101, max: 300 },
  3: { min: 301, max: 600 },
  4: { min: 601, max: 1000 },
  5: { min: 1001, max: Infinity },
};

export const QUIZ_FEEDBACK = [
  {
    min: 90,
    max: 100,
    title: 'Luar biasa! 🎉',
    message: 'Kamu benar-benar menguasai topik ini. Lanjutkan momentum-mu!',
  },
  {
    min: 75,
    max: 89,
    title: 'Kerja bagus! 💪',
    message: 'Hampir sempurna! Sedikit lagi dan kamu kuasai semuanya.',
  },
  {
    min: 60,
    max: 74,
    title: 'Terus semangat! 📚',
    message: 'Kamu sedang berkembang. Coba baca ulang bagian yang belum yakin.',
  },
  {
    min: 0,
    max: 59,
    title: 'Yuk review dulu! 🔄',
    message: 'Tidak apa-apa — setiap orang belajar dengan kecepatan berbeda. Planner sudah menyesuaikan jadwalmu.',
  },
];

export const PLATFORM_COLORS = {
  coursera: '#0056d2',
  udemy: '#a435f0',
  edx: '#02262b',
  fastai: '#0098c6',
  freecodecamp: '#0a0a23',
  youtube: '#ff0000',
  arxiv: '#b31b1b',
};

export const GREETING_MESSAGES = {
  morning: 'Selamat pagi! Saatnya belajar dengan semangat baru.',
  afternoon: 'Selamat siang! Lanjutkan progres belajarmu.',
  evening: 'Selamat malam! Waktu yang tenang untuk review dan refleksi.',
};
