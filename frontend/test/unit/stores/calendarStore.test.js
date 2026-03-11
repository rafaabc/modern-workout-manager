import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCalendarStore } from '../../../src/stores/calendarStore.js';

const mockRequest = vi.fn();

vi.mock('../../../src/composables/useApi.js', () => ({
  useApi: () => ({ request: mockRequest }),
}));

describe('calendarStore', () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    mockRequest.mockReset();
    store = useCalendarStore();
  });

  it('initializes with current month and year', () => {
    const now = new Date();
    expect(store.currentMonth).toBe(now.getMonth() + 1);
    expect(store.currentYear).toBe(now.getFullYear());
    expect(store.workoutDays).toEqual([]);
    expect(store.loading).toBe(false);
  });

  describe('fetchCalendar', () => {
    it('populates workoutDays with data from API', async () => {
      mockRequest.mockResolvedValue([
        { id: 1, day: 5, month: 3, year: 2026 },
        { id: 2, day: 12, month: 3, year: 2026 },
      ]);

      await store.fetchCalendar();

      expect(mockRequest).toHaveBeenCalledWith(
        'GET',
        `/api/workouts/calendar?month=${store.currentMonth}&year=${store.currentYear}`,
      );
      expect(store.workoutDays).toEqual([5, 12]);
    });

    it('sets loading to true during fetch and false after', async () => {
      let resolvePromise;
      mockRequest.mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
      );

      const fetchPromise = store.fetchCalendar();
      expect(store.loading).toBe(true);

      resolvePromise([]);
      await fetchPromise;

      expect(store.loading).toBe(false);
    });

    it('sets loading to false even on error', async () => {
      mockRequest.mockRejectedValue(new Error('Network error'));

      await expect(store.fetchCalendar()).rejects.toThrow('Network error');
      expect(store.loading).toBe(false);
    });
  });

  describe('toggleWorkout', () => {
    it('calls POST and adds day when day has no workout', async () => {
      store.workoutDays = [];
      mockRequest.mockResolvedValue({ id: 1, day: 10, month: 3, year: 2026 });

      await store.toggleWorkout(10);

      expect(mockRequest).toHaveBeenCalledWith('POST', '/api/workouts/calendar', {
        day: 10,
        month: store.currentMonth,
        year: store.currentYear,
      });
      expect(store.workoutDays).toContain(10);
    });

    it('calls DELETE and removes day when day has workout', async () => {
      store.workoutDays = [10, 15];
      mockRequest.mockResolvedValue(undefined);

      await store.toggleWorkout(10);

      expect(mockRequest).toHaveBeenCalledWith('DELETE', '/api/workouts/calendar', {
        day: 10,
        month: store.currentMonth,
        year: store.currentYear,
      });
      expect(store.workoutDays).not.toContain(10);
      expect(store.workoutDays).toContain(15);
    });
  });

  describe('previousMonth', () => {
    it('decrements month normally', async () => {
      store.currentMonth = 6;
      store.currentYear = 2026;
      mockRequest.mockResolvedValue([]);

      await store.previousMonth();

      expect(store.currentMonth).toBe(5);
      expect(store.currentYear).toBe(2026);
    });

    it('wraps from January to December of previous year', async () => {
      store.currentMonth = 1;
      store.currentYear = 2026;
      mockRequest.mockResolvedValue([]);

      await store.previousMonth();

      expect(store.currentMonth).toBe(12);
      expect(store.currentYear).toBe(2025);
    });

    it('calls fetchCalendar after changing month', async () => {
      store.currentMonth = 6;
      mockRequest.mockResolvedValue([{ id: 1, day: 3, month: 5, year: 2026 }]);

      await store.previousMonth();

      expect(mockRequest).toHaveBeenCalled();
      expect(store.workoutDays).toEqual([3]);
    });
  });

  describe('nextMonth', () => {
    it('increments month normally', async () => {
      store.currentMonth = 6;
      store.currentYear = 2026;
      mockRequest.mockResolvedValue([]);

      await store.nextMonth();

      expect(store.currentMonth).toBe(7);
      expect(store.currentYear).toBe(2026);
    });

    it('wraps from December to January of next year', async () => {
      store.currentMonth = 12;
      store.currentYear = 2026;
      mockRequest.mockResolvedValue([]);

      await store.nextMonth();

      expect(store.currentMonth).toBe(1);
      expect(store.currentYear).toBe(2027);
    });

    it('calls fetchCalendar after changing month', async () => {
      store.currentMonth = 6;
      mockRequest.mockResolvedValue([{ id: 1, day: 7, month: 7, year: 2026 }]);

      await store.nextMonth();

      expect(mockRequest).toHaveBeenCalled();
      expect(store.workoutDays).toEqual([7]);
    });
  });
});
