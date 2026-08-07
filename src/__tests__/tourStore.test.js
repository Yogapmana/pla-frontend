import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTourStore } from '../stores/tourStore';

describe('tourStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useTourStore.setState({
      isActive: false,
      isReplay: false,
      stepIndex: 0,
      seen: false,
    });
  });

  it('starts inactive and un-seen by default', () => {
    const state = useTourStore.getState();
    expect(state.isActive).toBe(false);
    expect(state.seen).toBe(false);
    expect(state.stepIndex).toBe(0);
  });

  it('start() activates the tour without marking it seen', () => {
    useTourStore.getState().start();
    const state = useTourStore.getState();
    expect(state.isActive).toBe(true);
    expect(state.isReplay).toBe(false);
    expect(state.seen).toBe(false);
    expect(state.stepIndex).toBe(0);
  });

  it('replay() activates the tour in replay mode', () => {
    useTourStore.getState().replay();
    const state = useTourStore.getState();
    expect(state.isActive).toBe(true);
    expect(state.isReplay).toBe(true);
  });

  it('next() advances the step index', () => {
    useTourStore.getState().start();
    useTourStore.getState().next();
    useTourStore.getState().next();
    expect(useTourStore.getState().stepIndex).toBe(2);
  });

  it('prev() never goes below zero', () => {
    useTourStore.getState().start();
    useTourStore.getState().prev();
    expect(useTourStore.getState().stepIndex).toBe(0);
  });

  it('finish() deactivates and persists the seen flag', () => {
    useTourStore.getState().start();
    useTourStore.getState().finish();
    const state = useTourStore.getState();
    expect(state.isActive).toBe(false);
    expect(state.seen).toBe(true);
    expect(localStorage.getItem('pla_tour_seen')).toBe('1');
  });

  it('skip() deactivates and persists the seen flag', () => {
    useTourStore.getState().replay();
    useTourStore.getState().skip();
    const state = useTourStore.getState();
    expect(state.isActive).toBe(false);
    expect(state.isReplay).toBe(false);
    expect(state.seen).toBe(true);
    expect(localStorage.getItem('pla_tour_seen')).toBe('1');
  });
});
