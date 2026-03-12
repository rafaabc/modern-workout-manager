<template>
  <div class="bg-gray-950 min-h-screen text-white">
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <AppHeader />
    <router-view v-slot="{ Component, route }">
      <Transition
        mode="out-in"
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-3"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-3"
      >
        <component :is="Component" :key="route.fullPath" id="main-content" />
      </Transition>
    </router-view>
  </div>
</template>

<script setup>
import AppHeader from './components/AppHeader.vue';
</script>
