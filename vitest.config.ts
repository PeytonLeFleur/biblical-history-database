import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['packages/*/src/**/*.test.ts', 'apps/api/src/**/*.test.ts', 'tests/**/*.test.ts'],
          exclude: ['**/*.db.test.ts', '**/node_modules/**'],
        },
      },
      {
        test: {
          name: 'db',
          include: ['packages/*/src/**/*.db.test.ts', 'apps/api/src/**/*.db.test.ts', 'tests/**/*.db.test.ts'],
          fileParallelism: false,
        },
      },
    ],
  },
});
