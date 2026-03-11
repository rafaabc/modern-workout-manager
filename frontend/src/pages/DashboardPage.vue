<template>
  <div>
    <h1>Dashboard</h1>
    <WorkoutCalendar />
    <WorkoutsMetrics />
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
