<template>
  <div class="bg-gray-950 min-h-screen text-white">
    <AppHeader />
    <router-view />
  </div>
</template>

<script setup>
import AppHeader from './components/AppHeader.vue';
</script>
