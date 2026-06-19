// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import solidJs from '@astrojs/solid-js';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

const srcPath = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [solidJs()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': srcPath,
      },
    },
    ssr: {
      external: ['better-sqlite3'],
    },
  },
});
