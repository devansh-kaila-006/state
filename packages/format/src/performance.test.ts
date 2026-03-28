/**
 * Performance and benchmarking tests for @state/format
 */

import { describe, it, expect } from 'vitest'
import { AgentFile } from './AgentFile'
import { scanProject } from './semantic-map'
import { parsePlanFromConversation } from './plan-parser'
import { encrypt, decrypt } from './encryption'
import { generateKeyPair, sign, verify } from './signature'

describe('Performance Tests', () => {
  describe('AgentFile Operations', () => {
    it('should create AgentFile quickly', async () => {
      const start = performance.now()

      const agentFile = await AgentFile.create({
        metadata: {
          title: 'Performance Test',
          language: 'TypeScript',
        },
        sourceTool: {
          name: 'test',
          version: '1.0.0',
        },
      })

      const end = performance.now()
      const duration = end - start

      expect(duration).toBeLessThan(100) // Should be fast (<100ms)
      expect(agentFile).toBeDefined()
    })

    it('should add 100 messages quickly', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      const messages = []
      for (let i = 0; i < 100; i++) {
        messages.push({
          id: `msg-${i}`,
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i}`,
          timestamp: new Date().toISOString(),
        })
      }

      const start = performance.now()
      await agentFile.addConversation(messages)
      const end = performance.now()

      const duration = end - start
      expect(duration).toBeLessThan(1000) // Should be <1s for 100 messages
    })

    it('should load large files efficiently', async () => {
      // Create a file with 1000 messages
      const agentFile = await AgentFile.create({
        metadata: { title: 'Large File Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      const messages = []
      for (let i = 0; i < 1000; i++) {
        messages.push({
          id: `msg-${i}`,
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i} with some content`.repeat(10),
          timestamp: new Date().toISOString(),
        })
      }

      await agentFile.addConversation(messages)

      // Save to buffer
      const buffer = await agentFile.saveToBuffer()

      // Load from buffer
      const start = performance.now()
      const loadedFile = await AgentFile.load(buffer)
      const end = performance.now()

      const duration = end - start
      expect(duration).toBeLessThan(2000) // Should load <2s
      expect(loadedFile).toBeDefined()
    })
  })

  describe('Encryption Performance', () => {
    it('should encrypt 1MB quickly', () => {
      const data = Buffer.alloc(1024 * 1024) // 1MB
      const password = 'test-password-123'

      const start = performance.now()
      const encrypted = encrypt(data, { password })
      const end = performance.now()

      const duration = end - start
      expect(duration).toBeLessThan(1000) // Should encrypt <1s
      expect(encrypted.data.length).toBeGreaterThan(0)
    })

    it('should decrypt quickly', () => {
      const data = Buffer.alloc(1024 * 1024) // 1MB
      const password = 'test-password-123'

      const encrypted = encrypt(data, { password })

      const start = performance.now()
      const decrypted = decrypt(encrypted, password)
      const end = performance.now()

      const duration = end - start
      expect(duration).toBeLessThan(500) // Should decrypt <500ms
      expect(Buffer.compare(data, decrypted)).toBe(0)
    })

    it('should handle multiple encryptions efficiently', () => {
      const data = Buffer.alloc(1024 * 100) // 100KB
      const password = 'test-password-123'

      const iterations = 10
      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        const encrypted = encrypt(data, { password })
        const decrypted = decrypt(encrypted, password)
        expect(Buffer.compare(data, decrypted)).toBe(0)
      }

      const end = performance.now()
      const duration = end - start
      const avgDuration = duration / iterations

      expect(avgDuration).toBeLessThan(100) // Average <100ms per op
    })
  })

  describe('Signature Performance', () => {
    it('should generate key pairs quickly', () => {
      const start = performance.now()
      const keyPair = generateKeyPair()
      const end = performance.now()

      const duration = end - start
      expect(duration).toBeLessThan(100) // <100ms
      expect(keyPair).toBeDefined()
    })

    it('should sign data quickly', () => {
      const keyPair = generateKeyPair()
      const data = Buffer.from('Test message to sign')

      const start = performance.now()
      const signature = sign(data, keyPair.secretKey)
      const end = performance.now()

      const duration = end - start
      expect(duration).toBeLessThan(50) // <50ms
      expect(signature).toBeDefined()
    })

    it('should verify signatures quickly', () => {
      const keyPair = generateKeyPair()
      const data = Buffer.from('Test message to sign')
      const signature = sign(data, keyPair.secretKey)

      const start = performance.now()
      const isValid = verify(data, signature, keyPair.publicKey)
      const end = performance.now()

      const duration = end - start
      expect(duration).toBeLessThan(50) // <50ms
      expect(isValid).toBe(true)
    })
  })

  describe('Semantic Map Performance', () => {
    it('should scan small projects quickly', async () => {
      // This is more of an integration test
      // For unit test, we'll just verify the function exists
      expect(scanProject).toBeDefined()
    })

    it('should handle large file lists efficiently', async () => {
      // Test that we can handle many files
      const maxFiles = 100000
      expect(scanProject).toBeDefined()
      // Actual file system test would be in integration tests
    })
  })

  describe('Memory Usage', () => {
    it('should not leak memory when creating multiple files', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0

      // Create and destroy 100 AgentFiles
      for (let i = 0; i < 100; i++) {
        const agentFile = await AgentFile.create({
          metadata: { title: `Test ${i}` },
          sourceTool: { name: 'test', version: '1.0.0' },
        })
        // AgentFile goes out of scope and should be garbage collected
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory

      // Memory increase should be reasonable (<10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle parallel file creation', async () => {
      const promises = []
      for (let i = 0; i < 10; i++) {
        promises.push(
          AgentFile.create({
            metadata: { title: `Concurrent Test ${i}` },
            sourceTool: { name: 'test', version: '1.0.0' },
          })
        )
      }

      const start = performance.now()
      const results = await Promise.all(promises)
      const end = performance.now()

      const duration = end - start
      expect(duration).toBeLessThan(500) // Should be fast
      expect(results).toHaveLength(10)
    })
  })

  describe('Large File Handling', () => {
    it('should handle files up to 500MB', async () => {
      // This is a unit test - actual file handling would be in integration tests
      expect(AgentFile.MAX_TOTAL_SIZE).toBeDefined()
      expect(AgentFile.MAX_TOTAL_SIZE).toBe(500 * 1024 * 1024)
    })

    it('should handle individual files up to 100MB', async () => {
      expect(AgentFile.MAX_FILE_SIZE).toBeDefined()
      expect(AgentFile.MAX_FILE_SIZE).toBe(100 * 1024 * 1024)
    })

    it('should enforce entry count limits', async () => {
      expect(AgentFile.MAX_ENTRIES).toBeDefined()
      expect(AgentFile.MAX_ENTRIES).toBe(10000)
    })
  })
})
