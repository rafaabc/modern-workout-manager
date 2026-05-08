import { defineConfig, minimalPreset } from '@vite-pwa/assets-generator/config';

export default defineConfig({
  preset: {
    ...minimalPreset,
    apple: {
      sizes: [180],
      padding: 0.1,
    },
  },
  images: ['public/favicon.svg'],
});
