import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useApi } from '../composables/useApi.js';

async function doFetchCalendar(workoutDays, loading, currentMonth, currentYear) {
  loading.value = true;
  try {
    const { request } = useApi();
    const data = await request(
      'GET',
      `/api/workouts/calendar?month=${currentMonth.value}&year=${currentYear.value}`,
    );
    workoutDays.value = data.map((w) => w.day);
  } finally {
    loading.value = false;
  }
}

async function doToggleWorkout(workoutDays, day, currentMonth, currentYear) {
  const { request } = useApi();
  const body = { day, month: currentMonth.value, year: currentYear.value };

  if (workoutDays.value.includes(day)) {
    await request('DELETE', '/api/workouts/calendar', body);
    workoutDays.value = workoutDays.value.filter((d) => d !== day);
  } else {
    await request('POST', '/api/workouts/calendar', body);
    workoutDays.value = [...workoutDays.value, day];
  }
}

export const useCalendarStore = defineStore('calendar', () => {
  const now = new Date();
  const currentMonth = ref(now.getMonth() + 1);
  const currentYear = ref(now.getFullYear());
  const workoutDays = ref([]);
  const loading = ref(false);

  const fetchCalendar = () => doFetchCalendar(workoutDays, loading, currentMonth, currentYear);

  const toggleWorkout = (day) => doToggleWorkout(workoutDays, day, currentMonth, currentYear);

  const previousMonth = () => {
    if (currentMonth.value === 1) {
      currentMonth.value = 12;
      currentYear.value -= 1;
    } else {
      currentMonth.value -= 1;
    }
    return fetchCalendar();
  };

  const nextMonth = () => {
    if (currentMonth.value === 12) {
      currentMonth.value = 1;
      currentYear.value += 1;
    } else {
      currentMonth.value += 1;
    }
    return fetchCalendar();
  };

  return {
    workoutDays,
    currentMonth,
    currentYear,
    loading,
    fetchCalendar,
    toggleWorkout,
    previousMonth,
    nextMonth,
  };
});
