import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import cartographer from '@replit/vite-plugin-cartographer';
import runtimeErrorModal from '@replit/vite-plugin-runtime-error-modal';
import shadcnThemeJson from '@replit/vite-plugin-shadcn-theme-json';

export default defineConfig({
  plugins: [
    react(),
    cartographer(),
    runtimeErrorModal(),
    shadcnThemeJson(),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['./tests/**/*.test.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './client/src'),
      '@shared': resolve(__dirname, './shared'),
    },
  },
});