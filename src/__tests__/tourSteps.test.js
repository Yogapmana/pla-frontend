import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTourSteps } from '../tour/steps';

describe('getTourSteps', () => {
  it('includes all dashboard, curriculum, chat, progress, and settings steps', () => {
    const steps = getTourSteps({ sessionId: 's1', activeTopicId: null });
    const ids = steps.map((s) => s.id);

    expect(ids).toContain('greeting');
    expect(ids).toContain('continue-hero');
    expect(ids).toContain('stats');
    expect(ids).toContain('gamification');
    expect(ids).toContain('analytics');
    expect(ids).toContain('curriculum-progress');
    expect(ids).toContain('curriculum-view');
    expect(ids).toContain('curriculum-week');
    expect(ids).toContain('chat');
    expect(ids).toContain('progress');
    expect(ids).toContain('settings');
  });

  it('skips module steps when there is no active topic', () => {
    const steps = getTourSteps({ sessionId: 's1', activeTopicId: null });
    const ids = steps.map((s) => s.id);
    expect(ids).not.toContain('module-article');
    expect(ids).not.toContain('module-tutor');
    expect(ids).not.toContain('module-complete');
    expect(steps).toHaveLength(11);
  });

  it('includes module steps with the topic route when an active topic exists', () => {
    const steps = getTourSteps({ sessionId: 's1', activeTopicId: 'topic-42' });
    const ids = steps.map((s) => s.id);

    expect(ids).toContain('module-article');
    expect(ids).toContain('module-tutor');
    expect(ids).toContain('module-complete');

    const moduleStep = steps.find((s) => s.id === 'module-article');
    expect(moduleStep.page).toBe('/module/topic-42');
    expect(steps).toHaveLength(14);
  });

  it('every step has a title key, description key, page, and data-tour target', () => {
    const steps = getTourSteps({ sessionId: 's1', activeTopicId: 't1' });
    for (const step of steps) {
      expect(step.titleKey).toMatch(/^tour\./);
      expect(step.descKey).toMatch(/^tour\./);
      expect(step.page).toMatch(/^\//);
      expect(step.target).toMatch(/^\[data-tour=/);
    }
  });
});
