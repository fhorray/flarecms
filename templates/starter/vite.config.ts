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
    minify: true,
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('hono')) {
              return 'vendor';
            }
            // Agrupar ícones da Lucide em blocos para reduzir o número de arquivos
            if (id.includes('lucide-react/dist/esm/icons')) {
              const iconName = id.split('/').pop()?.split('.')[0] || '';
              // Agrupa ícones pela primeira letra (ex: index_a, index_b...)
              const group = iconName.charAt(0).toLowerCase();
              return `icons/group_${group}`;
            }
            return 'deps';
          }
        }
      }
    }
  }
});
