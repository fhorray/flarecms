import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import devServer from '@hono/vite-dev-server';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    devServer({
      entry: 'src/index.ts',
      exclude: [
        /^\/(admin|api|static)\/.*/,
        /^\/node_modules\/.*/,
        /^\/@vite\/.*/,
        /^\/@react-refresh$/,
        /^\/src\/.*/,
        /^\/index\.html$/,
      ],
    }),
  ],
});
