import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages project site: https://peytonlefleur.github.io/biblical-history-database/
export default defineConfig({
  site: 'https://peytonlefleur.github.io',
  base: '/biblical-history-database',
  trailingSlash: 'always',
  build: { format: 'directory' },
  vite: { plugins: [tailwindcss()] },
});
