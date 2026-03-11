<template>
  <div class="workout-calendar">
    <div class="calendar-header">
      <button class="prev-month" @click="calendarStore.previousMonth()">←</button>
      <h2>{{ monthName }} {{ calendarStore.currentYear }}</h2>
      <button class="next-month" @click="calendarStore.nextMonth()">→</button>
    </div>
    <div v-if="calendarStore.loading" class="loading">Loading...</div>
    <div v-else class="calendar-grid">
      <button
        v-for="day in daysInMonth"
        :key="day"
        class="calendar-day"
        :class="{ 'workout-day': workoutDays.includes(day) }"
        @click="calendarStore.toggleWorkout(day)"
      >
        {{ day }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useCalendarStore } from '../stores/calendarStore.js';

const calendarStore = useCalendarStore();
const { workoutDays } = storeToRefs(calendarStore);

const monthNames = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const monthName = computed(() => monthNames[calendarStore.currentMonth - 1]);

const daysInMonth = computed(() => {
  const total = new Date(calendarStore.currentYear, calendarStore.currentMonth, 0).getDate();
  return Array.from({ length: total }, (_, i) => i + 1);
});
</script>
