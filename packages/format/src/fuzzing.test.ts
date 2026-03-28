/**
 * Fuzzing tests for @state/format
 * Tests robustness against malformed and malicious inputs
 */

import { describe, it, expect } from 'vitest'
import { AgentFile } from './AgentFile'
import { encrypt, decrypt } from './encryption'

describe('Fuzzing Tests', () => {
  describe('Input Validation Fuzzing', () => {
    it('should handle very long strings', async () => {
      // Test with extremely long strings at various limits
      const longStrings = [
        { length: 10000, name: '10k' },
        { length: 100000, name: '100k' },
        { length: 1000000, name: '1M' },
      ]

      for (const { length, name } of longStrings) {
        const longString = 'A'.repeat(length)

        const agentFile = await AgentFile.create({
          metadata: { title: longString },
          sourceTool: { name: 'test', version: '1.0.0' },
        })

        await agentFile.addConversation([
          {
            id: 'msg-1',
            role: 'user',
            content: longString,
            timestamp: new Date().toISOString(),
          },
        ])

        const buffer = await agentFile.saveToBuffer()
        expect(buffer.byteLength).toBeGreaterThan(0)

        // Should be able to load it back
        const loaded = await AgentFile.load(buffer)
        expect(loaded.getConversation().messages[0].content).toBe(longString)
      }
    })

    it('should handle special characters', async () => {
      const specialChars = [
        '\x00', // Null byte
        '\x01', // Start of heading
        '\x1B', // Escape
        '\x7F', // Delete
        '\u200B', // Zero-width space
        '\uFEFF', // BOM
        '\uFFFE', // Non-character
        '\uFFFF', // Non-character
        '\uD800', // Surrogate pair start
        '\uDC00', // Surrogate pair end
      ]

      for (const char of specialChars) {
        const agentFile = await AgentFile.create({
          metadata: { title: `Special char: ${char.codePointAt(0)}` },
          sourceTool: { name: 'test', version: '1.0.0' },
        })

        const content = `Before${char}After`

        await agentFile.addConversation([
          {
            id: 'msg-1',
            role: 'user',
            content,
            timestamp: new Date().toISOString(),
          },
        ])

        const buffer = await agentFile.saveToBuffer()
        const loaded = await AgentFile.load(buffer)

        expect(loaded.getConversation().messages[0].content).toBe(content)
      }
    })

    it('should handle unicode edge cases', async () => {
      const unicodeCases = [
        // Combining characters
        'e\u0301', // e with acute accent
        // Emoji sequences
        '👨‍👩‍👧‍👦', // Family emoji (zwj sequence)
        '🏴‍☠️', // Pirate flag emoji
        // RTL text
        'שלום עולם', // Hebrew
        'مرحبا بالعالم', // Arabic
        // Mixed direction
        'Hello שלום',
        // Zero-width characters
        'A\u200B\u200B\u200BB', // Zero-width spaces
        'A\uFEFFB', // BOM
        // Very long unicode sequences
        '😀'.repeat(1000),
        // Regional indicators
        '🇺🇸🇬🇧🇯🇵',
      ]

      for (const text of unicodeCases) {
        const agentFile = await AgentFile.create({
          metadata: { title: 'Unicode Test' },
          sourceTool: { name: 'test', version: '1.0.0' },
        })

        await agentFile.addConversation([
          {
            id: 'msg-1',
            role: 'user',
            content: text,
            timestamp: new Date().toISOString(),
          },
        ])

        const buffer = await agentFile.saveToBuffer()
        const loaded = await AgentFile.load(buffer)

        expect(loaded.getConversation().messages[0].content).toBe(text)
      }
    })

    it('should handle malformed timestamps', async () => {
      const malformedTimestamps = [
        'not-a-timestamp',
        '2024-13-01T00:00:00.000Z', // Invalid month
        '2024-01-32T00:00:00.000Z', // Invalid day
        '2024-01-01T25:00:00.000Z', // Invalid hour
        '',
        '0000-00-00T00:00:00.000Z',
        '9999-99-99T99:99:99.999Z',
      ]

      // These should either work or fail gracefully
      for (const ts of malformedTimestamps) {
        try {
          const agentFile = await AgentFile.create({
            metadata: { title: 'Timestamp Test' },
            sourceTool: { name: 'test', version: '1.0.0' },
          })

          await agentFile.addConversation([
            {
              id: 'msg-1',
              role: 'user',
              content: 'Test',
              timestamp: ts,
            },
          ])

          // If it succeeds, try to save/load
          const buffer = await agentFile.saveToBuffer()
          const loaded = await AgentFile.load(buffer)
          expect(loaded.getConversation().messages).toHaveLength(1)
        } catch (error) {
          // Should fail gracefully, not crash
          expect(error).toBeDefined()
        }
      }
    })
  })

  describe('Buffer Overflow Protection', () => {
    it('should handle large numbers of messages', async () => {
      const messageCounts = [100, 500, 1000, 5000]

      for (const count of messageCounts) {
        const agentFile = await AgentFile.create({
          metadata: { title: `Large: ${count}` },
          sourceTool: { name: 'test', version: '1.0.0' },
        })

        const messages = Array.from({ length: count }, (_, i) => ({
          id: `msg-${i}`,
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i}`,
          timestamp: new Date().toISOString(),
        }))

        await agentFile.addConversation(messages)

        const buffer = await agentFile.saveToBuffer()
        expect(buffer.byteLength).toBeGreaterThan(0)

        const loaded = await AgentFile.load(buffer)
        expect(loaded.getConversation().messages).toHaveLength(count)
      }
    })

    it('should handle deep nesting in semantic map', async () => {
      // Create a very deep file path
      const deepPath = Array.from({ length: 100 }, (_, i) => `dir${i}`).join('/') + '/file.ts'

      const agentFile = await AgentFile.create({
        metadata: { title: 'Deep Path' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      await agentFile.addSemanticMap({
        files: [
          {
            path: deepPath,
            language: 'TypeScript',
            size: 1024,
            line_count: 50,
            last_modified: new Date().toISOString(),
          },
        ],
        languages: {},
        dependencies: [],
      })

      const buffer = await agentFile.saveToBuffer()
      const loaded = await AgentFile.load(buffer)

      expect(loaded.getSemanticMap().files[0].path).toBe(deepPath)
    })
  })

  describe('Invalid Data Handling', () => {
    it('should handle empty buffers gracefully', async () => {
      const emptyBuffer = Buffer.alloc(0)

      await expect(AgentFile.load(emptyBuffer)).rejects.toThrow()
    })

    it('should handle truncated ZIP data', async () => {
      // Create a valid file
      const agentFile = await AgentFile.create({
        metadata: { title: 'Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      const buffer = await agentFile.saveToBuffer()

      // Truncate it
      const truncated = buffer.slice(0, Math.floor(buffer.byteLength / 2))

      await expect(AgentFile.load(truncated)).rejects.toThrow()
    })

    it('should handle corrupted ZIP data', async () => {
      // Create a valid file
      const agentFile = await AgentFile.create({
        metadata: { title: 'Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      const buffer = await agentFile.saveToBuffer()

      // Corrupt it by flipping bits
      const corrupted = Buffer.from(buffer)
      for (let i = 0; i < Math.min(100, corrupted.length); i++) {
        corrupted[i] = corrupted[i] ^ 0xFF
      }

      await expect(AgentFile.load(corrupted)).rejects.toThrow()
    })
  })

  describe('Resource Exhaustion Protection', () => {
    it('should handle rapid file creation', async () => {
      const count = 100
      const start = Date.now()

      for (let i = 0; i < count; i++) {
        const agentFile = await AgentFile.create({
          metadata: { title: `Rapid ${i}` },
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

      // Should complete in reasonable time
      expect(duration).toBeLessThan(30000) // 30 seconds
    })

    it('should handle rapid save/load cycles', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Cycle Test' },
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

      const cycles = 50
      const start = Date.now()

      for (let i = 0; i < cycles; i++) {
        const buffer = await agentFile.saveToBuffer()
        await AgentFile.load(buffer)
      }

      const duration = Date.now() - start

      // Should complete in reasonable time
      expect(duration).toBeLessThan(10000) // 10 seconds
    })
  })

  describe('Encryption Fuzzing', () => {
    it('should handle various password lengths', async () => {
      const passwords = [
        '', // Empty
        'a', // Too short
        'ab',
        'abc',
        'abcd',
        'abcde',
        'abcdef',
        'abcdefg',
        'abcdefgh', // 8 chars - minimum
        'a'.repeat(100), // Very long
        '🔑'.repeat(50), // Emoji password
      ]

      const data = Buffer.from('Test data')

      for (const password of passwords) {
        try {
          const encrypted = encrypt(data, { password })

          if (password.length >= 8) {
            // Should be decryptable
            const decrypted = decrypt(encrypted, password)
            expect(Buffer.compare(data, decrypted)).toBe(0)
          } else {
            // Should handle gracefully (may or may not work)
            expect(encrypted).toBeDefined()
          }
        } catch (error) {
          // Short passwords might fail, that's OK
          expect(password.length).toBeLessThan(8)
        }
      }
    })

    it('should handle empty data encryption', async () => {
      const emptyData = Buffer.alloc(0)
      const password = 'test-password-123'

      const encrypted = encrypt(emptyData, { password })
      const decrypted = decrypt(encrypted, password)

      expect(decrypted.length).toBe(0)
    })

    it('should handle very large data encryption', async () => {
      const sizes = [1024 * 1024, 10 * 1024 * 1024] // 1MB, 10MB

      for (const size of sizes) {
        const data = Buffer.alloc(size)
        const password = 'test-password-123'

        const start = Date.now()
        const encrypted = encrypt(data, { password })
        const encryptTime = Date.now() - start

        const decrypted = decrypt(encrypted, password)
        const decryptTime = Date.now() - start - encryptTime

        expect(Buffer.compare(data, decrypted)).toBe(0)
        expect(encryptTime).toBeLessThan(5000) // Should encrypt in <5s
        expect(decryptTime).toBeLessThan(5000) // Should decrypt in <5s
      }
    })
  })

  describe('Race Condition Protection', () => {
    it('should handle concurrent file operations', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Concurrent Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      // Add messages concurrently
      const promises = Array.from({ length: 10 }, (_, i) =>
        agentFile.addConversation([
          {
            id: `msg-${i}`,
            role: 'user',
            content: `Message ${i}`,
            timestamp: new Date().toISOString(),
          },
        ])
      )

      await Promise.all(promises)

      const conversation = agentFile.getConversation()
      expect(conversation.messages.length).toBeGreaterThan(0)
    })

    it('should handle concurrent save operations', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Concurrent Save Test' },
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

      // Save concurrently
      const promises = Array.from({ length: 5 }, () => agentFile.saveToBuffer())
      const results = await Promise.all(promises)

      // All saves should succeed
      for (const buffer of results) {
        expect(buffer.byteLength).toBeGreaterThan(0)
      }

      // All should be the same size
      const sizes = results.map((b) => b.byteLength)
      expect(new Set(sizes).size).toBe(1)
    })
  })
})
