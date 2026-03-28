/**
 * Vitest configuration for State (.agent) project
 * Shared configuration for all packages
 */

import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'build/',
        '*.test.ts',
        '*.test.tsx',
        '**/__tests__/**',
        '**/node_modules/**',
        '**/dist/**',
        '**/test-temp/**',
        '**/test-e2e-temp/**',
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
    setupFiles: ['./test/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    isolate: true,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4,
      },
    },
    reporters: ['verbose', 'json'],
    outputFile: {
      json: './test-results/test-results.json',
    },
    include: [
      'packages/**/*.test.ts',
      'packages/**/*.test.tsx',
      'test/**/*.test.ts',
    ],
    exclude: [
      'node_modules/',
      'dist/',
      'build/',
    ],
  },
  resolve: {
    alias: {
      '@state/format': path.resolve(__dirname, './packages/format/src'),
      '@state/importer-claude': path.resolve(__dirname, './packages/importer/claude/src'),
      '@state/importer-chatgpt': path.resolve(__dirname, './packages/importer/chatgpt/src'),
      '@state/importer-manual': path.resolve(__dirname, './packages/importer/manual/src'),
      '@state/cli': path.resolve(__dirname, './packages/cli/src'),
      '@state/viewer-web': path.resolve(__dirname, './packages/viewer-web/src'),
      '@state/viewer-desktop': path.resolve(__dirname, './packages/viewer-desktop/src'),
    },
  },
})
