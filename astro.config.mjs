import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [react()],
  vite: {
    build: {
      rollupOptions: {
        external: ['pg', 'bcryptjs', 'jsonwebtoken'],
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
      exclude: ['pg', 'bcryptjs', 'jsonwebtoken'],
    },
  },
});
