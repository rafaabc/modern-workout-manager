import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import WorkoutsMetrics from '../../../src/components/WorkoutsMetrics.vue';
import { useMetricsStore } from '../../../src/stores/metricsStore.js';

vi.mock('../../../src/composables/useApi.js', () => ({
  useApi: () => ({ request: vi.fn().mockResolvedValue({}) }),
}));

function createMockMetrics(overrides = {}) {
  return {
    totalYear: 42,
    goal: 100,
    goalProgress: 42,
    byMonth: [
      { month: 1, count: 5 },
      { month: 2, count: 3 },
      { month: 3, count: 8 },
      { month: 4, count: 4 },
      { month: 5, count: 6 },
      { month: 6, count: 2 },
      { month: 7, count: 3 },
      { month: 8, count: 4 },
      { month: 9, count: 2 },
      { month: 10, count: 1 },
      { month: 11, count: 3 },
      { month: 12, count: 1 },
    ],
    ...overrides,
  };
}

describe('WorkoutsMetrics', () => {
  let pinia;
  let store;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    store = useMetricsStore();
    vi.restoreAllMocks();
  });

  function mountMetrics() {
    return mount(WorkoutsMetrics, {
      global: { plugins: [pinia] },
    });
  }

  it('displays totalYear correctly', () => {
    store.metrics = createMockMetrics({ totalYear: 42 });
    const wrapper = mountMetrics();
    expect(wrapper.find('.total-year').text()).toContain('42');
  });

  it('displays goal when goal is not null', () => {
    store.metrics = createMockMetrics({ goal: 100 });
    const wrapper = mountMetrics();
    expect(wrapper.find('.goal-section').text()).toContain('100');
  });

  it('displays no-goal message when goal is null', () => {
    store.metrics = createMockMetrics({ goal: null, goalProgress: null });
    const wrapper = mountMetrics();
    expect(wrapper.find('.no-goal').text()).toBe('No goal set');
  });

  it('renders annual progress bar reflecting goalProgress', () => {
    store.metrics = createMockMetrics({ goalProgress: 42 });
    const wrapper = mountMetrics();
    const bar = wrapper.find('.annual-progress');
    expect(bar.exists()).toBe(true);
    expect(bar.find('.progress-fill').attributes('style')).toContain('width: 42%');
    expect(bar.find('.progress-label').text()).toBe('42%');
  });

  it('does not render annual progress bar when goalProgress is null', () => {
    store.metrics = createMockMetrics({ goal: null, goalProgress: null });
    const wrapper = mountMetrics();
    expect(wrapper.find('.annual-progress').exists()).toBe(false);
  });

  it('renders monthly progress bar with correct percentage (goal=120, count=5 → 50%)', () => {
    store.metrics = createMockMetrics({
      goal: 120,
      goalProgress: 4,
      byMonth: [
        { month: 1, count: 5 },
        { month: 2, count: 0 },
        { month: 3, count: 0 },
        { month: 4, count: 0 },
        { month: 5, count: 0 },
        { month: 6, count: 0 },
        { month: 7, count: 0 },
        { month: 8, count: 0 },
        { month: 9, count: 0 },
        { month: 10, count: 0 },
        { month: 11, count: 0 },
        { month: 12, count: 0 },
      ],
    });
    const wrapper = mountMetrics();
    const monthEntries = wrapper.findAll('.month-entry');
    const firstMonthBar = monthEntries[0].find('.month-progress .progress-fill');
    expect(firstMonthBar.attributes('style')).toContain('width: 50%');
    expect(monthEntries[0].find('.progress-label').text()).toBe('50%');
  });

  it('shows overflow on monthly progress bar beyond 100% (goal=1, count=3 → 3600%)', () => {
    store.metrics = createMockMetrics({
      goal: 1,
      goalProgress: 100,
      byMonth: [
        { month: 1, count: 3 },
        { month: 2, count: 0 },
        { month: 3, count: 0 },
        { month: 4, count: 0 },
        { month: 5, count: 0 },
        { month: 6, count: 0 },
        { month: 7, count: 0 },
        { month: 8, count: 0 },
        { month: 9, count: 0 },
        { month: 10, count: 0 },
        { month: 11, count: 0 },
        { month: 12, count: 0 },
      ],
    });
    const wrapper = mountMetrics();
    const monthEntries = wrapper.findAll('.month-entry');
    const baseFill = monthEntries[0].find('.month-progress .progress-fill');
    expect(baseFill.attributes('style')).toContain('width: 100%');
    expect(monthEntries[0].find('.overflow-fill').exists()).toBe(true);
    expect(monthEntries[0].find('.progress-label').text()).toBe('3600%');
  });

  it('does not render monthly progress bars when goal is null', () => {
    store.metrics = createMockMetrics({ goal: null, goalProgress: null });
    const wrapper = mountMetrics();
    expect(wrapper.find('.month-progress').exists()).toBe(false);
  });

  it('calls metricsStore.setGoal() with correct values on form submit', async () => {
    store.metrics = createMockMetrics();
    vi.spyOn(store, 'setGoal').mockResolvedValue();

    const wrapper = mountMetrics();
    const input = wrapper.find('.goal-input');
    await input.setValue(50);
    await wrapper.find('.goal-form').trigger('submit');

    expect(store.setGoal).toHaveBeenCalledWith({
      goal: 50,
      year: new Date().getFullYear(),
    });
  });

  it('displays each month with its count', () => {
    store.metrics = createMockMetrics();
    const wrapper = mountMetrics();
    const monthEntries = wrapper.findAll('.month-entry');
    expect(monthEntries).toHaveLength(12);

    expect(monthEntries[0].find('.month-name').text()).toBe('January');
    expect(monthEntries[0].find('.month-count').text()).toBe('5');

    expect(monthEntries[11].find('.month-name').text()).toBe('December');
    expect(monthEntries[11].find('.month-count').text()).toBe('1');
  });

  it('shows loading indicator when loading is true', () => {
    store.loading = true;
    const wrapper = mountMetrics();
    expect(wrapper.find('.loading').exists()).toBe(true);
  });

  it('shows success message after successful goal save', async () => {
    store.metrics = createMockMetrics();
    vi.spyOn(store, 'setGoal').mockResolvedValue();

    const wrapper = mountMetrics();
    await wrapper.find('.goal-input').setValue(50);
    await wrapper.find('.goal-form').trigger('submit');

    // Wait for async handler
    await vi.dynamicImportSettled();

    expect(wrapper.find('.success-message').text()).toBe('Goal saved successfully');
  });

  it('shows error message after failed goal save', async () => {
    store.metrics = createMockMetrics();
    vi.spyOn(store, 'setGoal').mockRejectedValue(new Error('Failed to save'));

    const wrapper = mountMetrics();
    await wrapper.find('.goal-input').setValue(50);
    await wrapper.find('.goal-form').trigger('submit');

    // Wait for async handler
    await vi.dynamicImportSettled();

    expect(wrapper.find('.error-message').text()).toBe('Failed to save');
  });
});
