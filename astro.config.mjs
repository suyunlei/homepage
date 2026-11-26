import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  ...(process.env.SITE_URL ? { site: process.env.SITE_URL } : {}),
  base: process.env.SITE_BASE || '/',
  trailingSlash: 'ignore',
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
});
