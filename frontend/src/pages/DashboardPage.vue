<template>
  <div>
    <h1>Dashboard</h1>
    <WorkoutCalendar />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import WorkoutCalendar from '../components/WorkoutCalendar.vue';
import { useCalendarStore } from '../stores/calendarStore.js';

const calendarStore = useCalendarStore();

onMounted(() => {
  calendarStore.fetchCalendar();
});
</script>
