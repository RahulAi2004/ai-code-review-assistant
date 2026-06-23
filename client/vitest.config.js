import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Separate config for Vitest so the dev server config stays clean.
export default defineConfig({
  plugins: [react()],
  // Use React's automatic JSX runtime so test files don't need React in scope.
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    css: false,
  },
});
