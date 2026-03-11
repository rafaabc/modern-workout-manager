<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold text-white mb-6">Dashboard</h1>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <WorkoutCalendar />
      <WorkoutsMetrics />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import WorkoutCalendar from '../components/WorkoutCalendar.vue';
import WorkoutsMetrics from '../components/WorkoutsMetrics.vue';
import { useCalendarStore } from '../stores/calendarStore.js';
import { useMetricsStore } from '../stores/metricsStore.js';

const calendarStore = useCalendarStore();
const metricsStore = useMetricsStore();

const currentYear = new Date().getFullYear();

const originalToggleWorkout = calendarStore.toggleWorkout;
calendarStore.toggleWorkout = async (day) => {
  await originalToggleWorkout(day);
  await metricsStore.fetchMetrics(currentYear);
};

onMounted(() => {
  calendarStore.fetchCalendar();
  metricsStore.fetchMetrics(currentYear);
});
</script>
