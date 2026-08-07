import { defineConfig } from 'vite';

// VITE_BASE_PATH でデプロイ先の base を切り替え
// Firebase Hosting: VITE_BASE_PATH=/
// GitHub Pages: VITE_BASE_PATH=/Goldfish/
export default defineConfig(({ command }) => ({
  base: process.env.VITE_BASE_PATH ?? (command === 'build' ? '/Goldfish/' : '/'),
  build: {
    target: 'es2020',
  },
}));
