import { defineConfig } from 'vite';
import devServer from '@hono/vite-dev-server';
import adapter from '@hono/vite-dev-server/cloudflare';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    devServer({
      adapter,
      entry: 'src/index.ts', // Hono entry point
    }),
  ],
  build: {
    target: 'es2022',
    minify: true,
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            // Group icons but keep core dependencies together
            if (id.includes('lucide-react/dist/esm/icons')) {
              const iconName = id.split('/').pop()?.split('.')[0] || '';
              const group = iconName.charAt(0).toLowerCase();
              return `icons/group_${group}`;
            }
            if (id.includes('react') || id.includes('hono') || id.includes('nanostores')) {
              return 'vendor';
            }
          }
        }
      }
    }
  }
});
