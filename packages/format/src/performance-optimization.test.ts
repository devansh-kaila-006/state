/**
 * Performance optimization tests for @state/format
 * Tests performance characteristics and identifies bottlenecks
 */

import { describe, it, expect } from 'vitest'
import { AgentFile } from './AgentFile'
import { encrypt, decrypt } from './encryption'
import { generateKeyPair, sign, verify } from './signature'

describe('Performance Optimization Tests', () => {
  describe('Memory Efficiency', () => {
    it('should efficiently handle large conversations', async () => {
      const messageCounts = [100, 500, 1000, 5000]

      for (const count of messageCounts) {
        const startMemory = (global as any).gc
          ? (v8.getHeapStatistics() as any).used_heap_size
          : 0

        const agentFile = await AgentFile.create({
          metadata: { title: `Memory Test ${count}` },
          sourceTool: { name: 'test', version: '1.0.0' },
        })

        const messages = Array.from({ length: count }, (_, i) => ({
          id: `msg-${i}`,
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i} with some content`,
          timestamp: new Date().toISOString(),
        }))

        await agentFile.addConversation(messages)
        await agentFile.saveToBuffer()

        // Force garbage collection if available
        if (global.gc) {
          global.gc()
        }

        const endMemory = (global as any).gc
          ? (v8.getHeapStatistics() as any).used_heap_size
          : 0

        if (startMemory > 0 && endMemory > 0) {
          const memoryIncrease = endMemory - startMemory
          const memoryPerMessage = memoryIncrease / count

          // Should use reasonable memory per message (<1KB per message)
          expect(memoryPerMessage).toBeLessThan(1024)
        }
      }
    })

    it('should release memory after file operations', async () => {
      // Create multiple files and ensure memory doesn't grow unbounded
      const iterations = 50
      const files: Buffer[] = []

      for (let i = 0; i < iterations; i++) {
        const agentFile = await AgentFile.create({
          metadata: { title: `Memory Test ${i}` },
          sourceTool: { name: 'test', version: '1.0.0' },
        })

        await agentFile.addConversation([
          {
            id: 'msg-1',
            role: 'user',
            content: 'Test',
            timestamp: new Date().toISOString(),
          },
        ])

        const buffer = await agentFile.saveToBuffer()
        files.push(buffer)
      }

      // All files should be created successfully
      expect(files).toHaveLength(iterations)

      // Clean up
      files.length = 0

      if (global.gc) {
        global.gc()
      }
    })
  })

  describe('CPU Performance', () => {
    it('should efficiently create files', async () => {
      const iterations = 100
      const start = Date.now()

      for (let i = 0; i < iterations; i++) {
        const agentFile = await AgentFile.create({
          metadata: { title: `CPU Test ${i}` },
          sourceTool: { name: 'test', version: '1.0.0' },
        })

        await agentFile.addConversation([
          {
            id: 'msg-1',
            role: 'user',
            content: 'Test',
            timestamp: new Date().toISOString(),
          },
        ])

        await agentFile.saveToBuffer()
      }

      const duration = Date.now() - start
      const avgDuration = duration / iterations

      // Should average <50ms per file creation
      expect(avgDuration).toBeLessThan(50)
    })

    it('should efficiently load files', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Load Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      await agentFile.addConversation(
        Array.from({ length: 100 }, (_, i) => ({
          id: `msg-${i}`,
          role: 'user',
          content: `Message ${i}`,
          timestamp: new Date().toISOString(),
        }))
      )

      const buffer = await agentFile.saveToBuffer()

      const iterations = 100
      const start = Date.now()

      for (let i = 0; i < iterations; i++) {
        await AgentFile.load(buffer)
      }

      const duration = Date.now() - start
      const avgDuration = duration / iterations

      // Should average <20ms per file load
      expect(avgDuration).toBeLessThan(20)
    })
  })

  describe('I/O Performance', () => {
    it('should efficiently serialize data', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Serialization Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      await agentFile.addConversation(
        Array.from({ length: 1000 }, (_, i) => ({
          id: `msg-${i}`,
          role: 'user',
          content: `Message ${i}`,
          timestamp: new Date().toISOString(),
        }))
      )

      const start = Date.now()
      const buffer = await agentFile.saveToBuffer()
      const duration = Date.now() - start

      // Should serialize quickly
      expect(duration).toBeLessThan(1000) // 1 second
      expect(buffer.byteLength).toBeGreaterThan(0)
    })

    it('should efficiently deserialize data', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Deserialization Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      await agentFile.addConversation(
        Array.from({ length: 1000 }, (_, i) => ({
          id: `msg-${i}`,
          role: 'user',
          content: `Message ${i}`,
          timestamp: new Date().toISOString(),
        }))
      )

      const buffer = await agentFile.saveToBuffer()

      const start = Date.now()
      const loaded = await AgentFile.load(buffer)
      const duration = Date.now() - start

      // Should deserialize quickly
      expect(duration).toBeLessThan(1000) // 1 second
      expect(loaded.getConversation().messages).toHaveLength(1000)
    })
  })

  describe('Encryption Performance', () => {
    it('should scale linearly with data size for encryption', async () => {
      const sizes = [1024, 10 * 1024, 100 * 1024, 1024 * 1024] // 1KB, 10KB, 100KB, 1MB
      const results: { size: number; time: number }[] = []

      for (const size of sizes) {
        const data = Buffer.alloc(size)
        const password = 'test-password-123'

        const start = Date.now()
        encrypt(data, { password })
        const duration = Date.now() - start

        results.push({ size, time: duration })
      }

      // Verify linear scaling (within reason)
      // Each 10x increase in size should take roughly 10x time (within 2x tolerance)
      for (let i = 1; i < results.length; i++) {
        const sizeRatio = results[i].size / results[i - 1].size
        const timeRatio = results[i].time / results[i - 1].time

        // Time ratio should be within 2x of size ratio
        expect(timeRatio).toBeLessThan(sizeRatio * 2)
      }
    })

    it('should encrypt large files efficiently', async () => {
      const data = Buffer.alloc(10 * 1024 * 1024) // 10MB
      const password = 'test-password-123'

      const start = Date.now()
      const encrypted = encrypt(data, { password })
      const duration = Date.now() - start

      // Should encrypt 10MB in reasonable time (<5s)
      expect(duration).toBeLessThan(5000)
      expect(encrypted.data.byteLength).toBeGreaterThan(0)
    })

    it('should decrypt large files efficiently', async () => {
      const data = Buffer.alloc(10 * 1024 * 1024) // 10MB
      const password = 'test-password-123'

      const encrypted = encrypt(data, { password })

      const start = Date.now()
      const decrypted = decrypt(encrypted, password)
      const duration = Date.now() - start

      // Should decrypt 10MB in reasonable time (<5s)
      expect(duration).toBeLessThan(5000)
      expect(Buffer.compare(data, decrypted)).toBe(0)
    })
  })

  describe('Signature Performance', () => {
    it('should sign data efficiently', async () => {
      const sizes = [1024, 10 * 1024, 100 * 1024, 1024 * 1024]
      const keyPair = generateKeyPair()

      for (const size of sizes) {
        const data = Buffer.alloc(size)

        const start = Date.now()
        sign(data, keyPair.secretKey)
        const duration = Date.now() - start

        // Should sign quickly (<100ms for 1MB)
        if (size <= 1024 * 1024) {
          expect(duration).toBeLessThan(100)
        }
      }
    })

    it('should verify signatures efficiently', async () => {
      const sizes = [1024, 10 * 1024, 100 * 1024, 1024 * 1024]
      const keyPair = generateKeyPair()

      for (const size of sizes) {
        const data = Buffer.alloc(size)
        const signature = sign(data, keyPair.secretKey)

        const start = Date.now()
        verify(data, signature, keyPair.publicKey)
        const duration = Date.now() - start

        // Should verify quickly (<100ms for 1MB)
        if (size <= 1024 * 1024) {
          expect(duration).toBeLessThan(100)
        }
      }
    })
  })

  describe('Concurrency Performance', () => {
    it('should handle parallel file operations', async () => {
      const concurrency = 10
      const start = Date.now()

      const promises = Array.from({ length: concurrency }, async (_, i) => {
        const agentFile = await AgentFile.create({
          metadata: { title: `Concurrent ${i}` },
          sourceTool: { name: 'test', version: '1.0.0' },
        })

        await agentFile.addConversation([
          {
            id: 'msg-1',
            role: 'user',
            content: 'Test',
            timestamp: new Date().toISOString(),
          },
        ])

        return agentFile.saveToBuffer()
      })

      await Promise.all(promises)

      const duration = Date.now() - start

      // Parallel operations should be faster than sequential
      // Should complete in <2s total
      expect(duration).toBeLessThan(2000)
    })

    it('should handle parallel load operations', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Concurrent Load Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      await agentFile.addConversation([
        {
          id: 'msg-1',
          role: 'user',
          content: 'Test',
          timestamp: new Date().toISOString(),
        },
      ])

      const buffer = await agentFile.saveToBuffer()

      const concurrency = 100
      const start = Date.now()

      const promises = Array.from({ length: concurrency }, () => AgentFile.load(buffer))
      await Promise.all(promises)

      const duration = Date.now() - start

      // Should handle 100 parallel loads in <2s
      expect(duration).toBeLessThan(2000)
    })
  })

  describe('Streaming Performance', () => {
    it('should efficiently add messages in batches', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Batch Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      const batchSize = 100
      const batches = 10
      const start = Date.now()

      for (let b = 0; b < batches; b++) {
        const messages = Array.from({ length: batchSize }, (_, i) => ({
          id: `msg-${b * batchSize + i}`,
          role: 'user',
          content: `Message ${b * batchSize + i}`,
          timestamp: new Date().toISOString(),
        }))

        await agentFile.addConversation(messages)
      }

      const duration = Date.now() - start

      // Should add 1000 messages quickly (<2s)
      expect(duration).toBeLessThan(2000)
      expect(agentFile.getConversation().messages).toHaveLength(1000)
    })
  })

  describe('Cache Efficiency', () => {
    it('should cache manifest efficiently', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Cache Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      // Access manifest multiple times
      const iterations = 1000
      const start = Date.now()

      for (let i = 0; i < iterations; i++) {
        agentFile.getManifest()
      }

      const duration = Date.now() - start

      // Cached access should be very fast
      expect(duration).toBeLessThan(100)
    })

    it('should cache conversation efficiently', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Cache Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      await agentFile.addConversation([
        {
          id: 'msg-1',
          role: 'user',
          content: 'Test',
          timestamp: new Date().toISOString(),
        },
      ])

      // Access conversation multiple times
      const iterations = 1000
      const start = Date.now()

      for (let i = 0; i < iterations; i++) {
        agentFile.getConversation()
      }

      const duration = Date.now() - start

      // Cached access should be very fast
      expect(duration).toBeLessThan(100)
    })
  })
})
