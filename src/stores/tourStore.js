import { create } from 'zustand'

const SEEN_KEY = 'pla_tour_seen'

const readSeen = () => {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}

const persistSeen = () => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SEEN_KEY, '1')
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export const useTourStore = create((set) => ({
  isActive: false,
  isReplay: false,
  stepIndex: 0,
  seen: readSeen(),

  start: () => set({ isActive: true, isReplay: false, stepIndex: 0 }),
  replay: () => set({ isActive: true, isReplay: true, stepIndex: 0 }),
  next: () => set((s) => ({ stepIndex: s.stepIndex + 1 })),
  prev: () => set((s) => ({ stepIndex: Math.max(0, s.stepIndex - 1) })),
  goTo: (index) => set({ stepIndex: index }),

  finish: () => {
    persistSeen()
    set({ isActive: false, isReplay: false, stepIndex: 0, seen: true })
  },

  skip: () => {
    persistSeen()
    set({ isActive: false, isReplay: false, stepIndex: 0, seen: true })
  },
}))
