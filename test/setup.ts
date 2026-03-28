/**
 * Test setup and configuration
 * Runs before all test suites
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs/promises'
import * as path from 'path'

// Global test configuration
const testTempDir = path.join(process.cwd(), 'test-temp')
const testE2ETempDir = path.join(process.cwd(), 'test-e2e-temp')

beforeAll(async () => {
  // Set up test environment
  process.env.NODE_ENV = 'test'

  // Increase timeout for integration tests
  if (process.env.CI) {
    // CI environments may be slower
  }
})

afterAll(async () => {
  // Clean up any remaining test directories
  try {
    await fs.rm(testTempDir, { recursive: true, force: true })
    await fs.rm(testE2ETempDir, { recursive: true, force: true })
  } catch {
    // Ignore cleanup errors
  }
})

beforeEach(async () => {
  // Reset any global state before each test
})

afterEach(async () => {
  // Clean up after each test if needed
})

// Mock console methods to reduce noise in test output
const originalConsole = global.console

global.console = {
  ...originalConsole,
  // Keep error and warn for debugging test failures
  error: originalConsole.error,
  warn: originalConsole.warn,
  // Optionally silence info and log in tests
  log: process.env.DEBUG ? originalConsole.log : () => {},
  info: process.env.DEBUG ? originalConsole.info : () => {},
  debug: () => {},
}

// Restore console in DEBUG mode
if (process.env.DEBUG) {
  global.console = originalConsole
}

// Add custom matchers if needed
expect.extend({
  // Custom matcher for buffer comparison
  toEqualBuffer(received: Buffer, expected: Buffer) {
    const pass = Buffer.compare(received, expected) === 0
    return {
      pass,
      message: () =>
        pass
          ? `Expected buffers to be different`
          : `Expected buffers to be equal`,
    }
  },

  // Custom matcher for file existence
  async toBeExistingFile(filePath: string) {
    try {
      await fs.access(filePath)
      return {
        pass: true,
        message: () => `Expected file ${filePath} not to exist`,
      }
    } catch {
      return {
        pass: false,
        message: () => `Expected file ${filePath} to exist`,
      }
    }
  },
})

// Type augmentation for custom matchers
declare global {
  namespace Vi {
    interface AsymmetricMatchersContaining {
      toEqualBuffer(expected: Buffer): Promise<void>
      toBeExistingFile(): Promise<void>
    }
  }
}

export {}
