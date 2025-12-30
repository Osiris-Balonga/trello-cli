import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/cli.ts',
        'src/commands/**',
        'src/locales/**',
        'src/index.ts',
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
