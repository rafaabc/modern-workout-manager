<template>
  <div class="workout-calendar bg-gray-800 border border-gray-700 rounded-2xl shadow-xl p-6">
    <div class="calendar-header flex items-center justify-between mb-6">
      <button
        class="prev-month text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg p-2 transition"
        @click="calendarStore.previousMonth()"
      >
        ←
      </button>
      <h2 class="text-lg font-bold text-white">{{ monthName }} {{ calendarStore.currentYear }}</h2>
      <button
        class="next-month text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg p-2 transition"
        @click="calendarStore.nextMonth()"
      >
        →
      </button>
    </div>
    <div v-if="calendarStore.loading" class="loading flex justify-center py-8">
      <svg
        class="animate-spin h-8 w-8 text-indigo-400"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        ></path>
      </svg>
    </div>
    <div v-else class="calendar-grid">
      <div class="grid grid-cols-7 gap-1 mb-2">
        <span
          v-for="d in weekDays"
          :key="d"
          class="text-xs font-medium text-gray-400 text-center py-2"
          >{{ d }}</span
        >
      </div>
      <div class="grid grid-cols-7 gap-1">
        <div v-for="n in startOffset" :key="'pad-' + n"></div>
        <button
          v-for="day in daysInMonth"
          :key="day"
          class="calendar-day aspect-square flex items-center justify-center rounded-lg text-sm cursor-pointer transition"
          :class="
            workoutDays.includes(day)
              ? 'workout-day font-bold bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg'
              : 'text-gray-300 hover:bg-gray-700'
          "
          @click="calendarStore.toggleWorkout(day)"
        >
          {{ day }}
        </button>
      </div>
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
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const monthName = computed(() => monthNames[calendarStore.currentMonth - 1]);

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const startOffset = computed(() => {
  return new Date(calendarStore.currentYear, calendarStore.currentMonth - 1, 1).getDay();
});

const daysInMonth = computed(() => {
  const total = new Date(calendarStore.currentYear, calendarStore.currentMonth, 0).getDate();
  return Array.from({ length: total }, (_, i) => i + 1);
});
</script>
