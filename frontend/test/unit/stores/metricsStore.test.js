import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useMetricsStore } from '../../../src/stores/metricsStore.js';

const mockRequest = vi.fn();

vi.mock('../../../src/composables/useApi.js', () => ({
  useApi: () => ({ request: mockRequest }),
}));

const mockMetrics = {
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
};

describe('metricsStore', () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    mockRequest.mockReset();
    store = useMetricsStore();
  });

  it('initializes with null metrics and loading false', () => {
    expect(store.metrics).toBeNull();
    expect(store.loading).toBe(false);
  });

  describe('fetchMetrics', () => {
    it('populates state with data from API', async () => {
      mockRequest.mockResolvedValue(mockMetrics);

      await store.fetchMetrics(2026);

      expect(mockRequest).toHaveBeenCalledWith('GET', '/api/metrics?year=2026');
      expect(store.metrics).toEqual(mockMetrics);
    });

    it('sets loading to true during fetch and false after', async () => {
      let resolvePromise;
      mockRequest.mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
      );

      const fetchPromise = store.fetchMetrics(2026);
      expect(store.loading).toBe(true);

      resolvePromise(mockMetrics);
      await fetchPromise;

      expect(store.loading).toBe(false);
    });

    it('sets loading to false even on error', async () => {
      mockRequest.mockRejectedValue(new Error('Network error'));

      await expect(store.fetchMetrics(2026)).rejects.toThrow('Network error');
      expect(store.loading).toBe(false);
    });
  });

  describe('setGoal', () => {
    it('calls POST and re-fetches metrics after success', async () => {
      mockRequest.mockResolvedValueOnce({ success: true }).mockResolvedValueOnce(mockMetrics);

      await store.setGoal({ goal: 100, year: 2026 });

      expect(mockRequest).toHaveBeenCalledWith('POST', '/api/metrics/goal', {
        goal: 100,
        year: 2026,
      });
      expect(mockRequest).toHaveBeenCalledWith('GET', '/api/metrics?year=2026');
      expect(store.metrics).toEqual(mockMetrics);
    });

    it('throws error and does not alter state on API error', async () => {
      mockRequest.mockRejectedValue(new Error('Server error'));

      await expect(store.setGoal({ goal: 50, year: 2026 })).rejects.toThrow('Server error');
      expect(store.metrics).toBeNull();
    });
  });
});
