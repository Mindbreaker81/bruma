import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import fs from 'node:fs';
import { visualizer } from 'rollup-plugin-visualizer';

const packageJson = JSON.parse(
  fs.readFileSync(new URL('./package.json', import.meta.url), 'utf-8')
) as { version: string };

const shouldAnalyze = process.env.ANALYZE === 'true';

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    ...(shouldAnalyze
      ? [
          visualizer({
            brotliSize: true,
            filename: 'dist/stats.html',
            gzipSize: true,
            open: false,
            template: 'treemap',
          }),
        ]
      : []),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/.pnpm/@lezer+')) {
            return 'lezer';
          }

          if (id.includes('/node_modules/.pnpm/@codemirror+')) {
            return 'codemirror';
          }

          if (
            id.includes('/node_modules/.pnpm/style-mod@') ||
            id.includes('/node_modules/.pnpm/w3c-keyname@') ||
            id.includes('/node_modules/.pnpm/crelt@')
          ) {
            return 'editor-runtime';
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  envPrefix: ['VITE_', 'TAURI_'],
  test: {
    environment: 'jsdom',
  },
});
