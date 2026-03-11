import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import WorkoutCalendar from '../../../src/components/WorkoutCalendar.vue';
import { useCalendarStore } from '../../../src/stores/calendarStore.js';

vi.mock('../../../src/composables/useApi.js', () => ({
  useApi: () => ({ request: vi.fn().mockResolvedValue([]) }),
}));

describe('WorkoutCalendar', () => {
  let pinia;
  let store;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    store = useCalendarStore();
    vi.restoreAllMocks();
  });

  function mountCalendar() {
    return mount(WorkoutCalendar, {
      global: { plugins: [pinia] },
    });
  }

  it('renders the correct number of days for the month', () => {
    store.currentMonth = 1;
    store.currentYear = 2026;
    const wrapper = mountCalendar();
    const days = wrapper.findAll('.calendar-day');
    expect(days).toHaveLength(31);
  });

  it('renders 28 days for February in a non-leap year', () => {
    store.currentMonth = 2;
    store.currentYear = 2025;
    const wrapper = mountCalendar();
    const days = wrapper.findAll('.calendar-day');
    expect(days).toHaveLength(28);
  });

  it('renders 29 days for February in a leap year', () => {
    store.currentMonth = 2;
    store.currentYear = 2024;
    const wrapper = mountCalendar();
    const days = wrapper.findAll('.calendar-day');
    expect(days).toHaveLength(29);
  });

  it('highlights days with workouts using workout-day class', () => {
    store.currentMonth = 3;
    store.currentYear = 2026;
    store.workoutDays = [5, 12, 20];
    const wrapper = mountCalendar();
    const highlighted = wrapper.findAll('.workout-day');
    expect(highlighted).toHaveLength(3);
  });

  it('calls toggleWorkout when clicking a day without workout', async () => {
    store.currentMonth = 3;
    store.currentYear = 2026;
    store.workoutDays = [];
    vi.spyOn(store, 'toggleWorkout').mockResolvedValue();

    const wrapper = mountCalendar();
    const dayButtons = wrapper.findAll('.calendar-day');
    await dayButtons[4].trigger('click');

    expect(store.toggleWorkout).toHaveBeenCalledWith(5);
  });

  it('calls toggleWorkout when clicking a day with workout', async () => {
    store.currentMonth = 3;
    store.currentYear = 2026;
    store.workoutDays = [5];
    vi.spyOn(store, 'toggleWorkout').mockResolvedValue();

    const wrapper = mountCalendar();
    const dayButtons = wrapper.findAll('.calendar-day');
    await dayButtons[4].trigger('click');

    expect(store.toggleWorkout).toHaveBeenCalledWith(5);
  });

  it('calls previousMonth when clicking ← button', async () => {
    vi.spyOn(store, 'previousMonth').mockResolvedValue();
    const wrapper = mountCalendar();
    await wrapper.find('.prev-month').trigger('click');
    expect(store.previousMonth).toHaveBeenCalled();
  });

  it('calls nextMonth when clicking → button', async () => {
    vi.spyOn(store, 'nextMonth').mockResolvedValue();
    const wrapper = mountCalendar();
    await wrapper.find('.next-month').trigger('click');
    expect(store.nextMonth).toHaveBeenCalled();
  });

  it('displays correct month and year in header', () => {
    store.currentMonth = 1;
    store.currentYear = 2025;
    const wrapper = mountCalendar();
    expect(wrapper.find('h2').text()).toBe('January 2025');
  });

  it('shows loading indicator when loading is true', () => {
    store.loading = true;
    const wrapper = mountCalendar();
    expect(wrapper.find('.loading').exists()).toBe(true);
    expect(wrapper.find('.calendar-grid').exists()).toBe(false);
  });

  it('hides loading indicator when loading is false', () => {
    store.loading = false;
    const wrapper = mountCalendar();
    expect(wrapper.find('.loading').exists()).toBe(false);
    expect(wrapper.find('.calendar-grid').exists()).toBe(true);
  });
});
