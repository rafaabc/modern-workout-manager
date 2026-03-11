import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import DashboardPage from '../../../src/pages/DashboardPage.vue';
import { useCalendarStore } from '../../../src/stores/calendarStore.js';

const mockRequest = vi.fn().mockResolvedValue([]);

vi.mock('../../../src/composables/useApi.js', () => ({
  useApi: () => ({ request: mockRequest }),
}));

describe('DashboardPage', () => {
  let pinia;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    mockRequest.mockReset().mockResolvedValue([]);
  });

  function mountDashboard() {
    return mount(DashboardPage, {
      global: { plugins: [pinia] },
    });
  }

  it('renders WorkoutCalendar component', () => {
    const wrapper = mountDashboard();
    expect(wrapper.find('.workout-calendar').exists()).toBe(true);
  });

  it('calls calendarStore.fetchCalendar() on mount', async () => {
    const store = useCalendarStore();
    vi.spyOn(store, 'fetchCalendar').mockResolvedValue();

    mountDashboard();
    await flushPromises();

    expect(store.fetchCalendar).toHaveBeenCalled();
  });
});
