// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import solidJs from '@astrojs/solid-js';
import tailwindcss from '@tailwindcss/vite';

/** @type {import('astro').AstroUserConfig} */
export default defineConfig({
  site: 'https://novanest.example',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [solidJs()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      dedupe: ['nanostores', '@nanostores/solid', 'solid-js'],
    },
    ssr: {
      // Use Node built-in sqlite (no better-sqlite3 native binary)
      external: ['node:sqlite'],
    },
  },
});
