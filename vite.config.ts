import { defineConfig } from 'vite';

// GitHub Pages 本番はリポジトリ名に合わせた base を使う（例: /Goldfish/）
// ローカル開発は base '/' のまま
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Goldfish/' : '/',
  build: {
    target: 'es2020',
  },
}));
