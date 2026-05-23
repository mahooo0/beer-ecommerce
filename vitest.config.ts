import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      thresholds: {
        global: {
          lines: 80,
        },
      },
      include: ['apps/server/src/**', 'packages/types/src/**'],
    },
  },
  resolve: {
    alias: {
      '@repo/db': './packages/db/src',
      '@repo/types': './packages/types/src',
    },
  },
});
