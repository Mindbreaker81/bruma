import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import fs from 'node:fs';

const packageJson = JSON.parse(
  fs.readFileSync(new URL('./package.json', import.meta.url), 'utf-8')
) as { version: string };

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // Skip macOS resource fork files (e.g. `._foo.test.ts`) that some external
    // drives create alongside real files. They are invalid TS and break vitest
    // even though git ignores them.
    exclude: ['**/._*', '**/node_modules/**'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
