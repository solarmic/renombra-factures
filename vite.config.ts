/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Two independent pages from one repo: invoices at the root, photos under fotos/. Each entry only bundles
// its own code (pdf.js for invoices; exifr and the places dataset for photos).
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [svelte()],
  build: {
    rollupOptions: {
      input: {
        main: new URL('./index.html', import.meta.url).pathname,
        fotos: new URL('./fotos/index.html', import.meta.url).pathname,
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
