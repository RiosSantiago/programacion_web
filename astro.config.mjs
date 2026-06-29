import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [tailwind(), react()],
  vite: {
    build: {
      rollupOptions: {
        external: ['better-sqlite3', 'bcryptjs'],
      },
    },
    optimizeDeps: {
      exclude: ['better-sqlite3', 'bcryptjs'],
    },
  },
});
