/**
 * Advanced property-based tests for @state/format
 * Uses fast-check to verify invariants with comprehensive random testing
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { AgentFile } from './AgentFile'
import { encrypt, decrypt } from './encryption'
import { generateKeyPair, sign, verify } from './signature'

describe('Advanced Property-Based Tests', () => {
  describe('Round-Trip Invariants', () => {
    it('should preserve all message data through save/load', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              role: fc.constantFrom('user', 'assistant'),
              content: fc.string(),
              timestamp: fc.datetime().map((d) => d.toISOString()),
            }),
            { minLength: 1, maxLength: 100 }
          ),
          async (messages) => {
            const agentFile = await AgentFile.create({
              metadata: { title: 'Test' },
              sourceTool: { name: 'test', version: '1.0.0' },
            })

            await agentFile.addConversation(messages)
            const buffer = await agentFile.saveToBuffer()
            const loaded = await AgentFile.load(buffer)

            const loadedMessages = loaded.getConversation().messages

            expect(loadedMessages).toHaveLength(messages.length)

            for (let i = 0; i < messages.length; i++) {
              expect(loadedMessages[i].id).toBe(messages[i].id)
              expect(loadedMessages[i].role).toBe(messages[i].role)
              expect(loadedMessages[i].content).toBe(messages[i].content)
              expect(loadedMessages[i].timestamp).toBe(messages[i].timestamp)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve semantic map through save/load', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            files: fc.array(
              fc.record({
                path: fc.string(),
                language: fc.string(),
                size: fc.nat(),
                line_count: fc.nat(),
                last_modified: fc.datetime().map((d) => d.toISOString()),
              }),
              { maxLength: 50 }
            ),
            languages: fc.dictionary(
              fc.string(),
              fc.record({
                files: fc.nat(),
                lines: fc.nat(),
                percentage: fc.nat({ max: 100 }),
              })
            ),
            dependencies: fc.array(
              fc.record({
                name: fc.string(),
                version: fc.string(),
                type: fc.constantFrom('dependencies', 'devDependencies', 'peerDependencies'),
              }),
              { maxLength: 20 }
            ),
          }),
          async (semanticMap) => {
            const agentFile = await AgentFile.create({
              metadata: { title: 'Test' },
              sourceTool: { name: 'test', version: '1.0.0' },
            })

            await agentFile.addSemanticMap(semanticMap)
            const buffer = await agentFile.saveToBuffer()
            const loaded = await AgentFile.load(buffer)

            const loadedMap = loaded.getSemanticMap()

            expect(loadedMap.files).toEqual(semanticMap.files)
            expect(loadedMap.languages).toEqual(semanticMap.languages)
            expect(loadedMap.dependencies).toEqual(semanticMap.dependencies)
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  describe('Encryption Invariants', () => {
    it('encrypt/decrypt should be symmetric', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 1, maxLength: 10000 }),
          fc.string({ minLength: 8, maxLength: 100 }),
          async (data, password) => {
            const buffer = Buffer.from(data)
            const encrypted = encrypt(buffer, { password })
            const decrypted = decrypt(encrypted, password)

            expect(Buffer.compare(buffer, decrypted)).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('different passwords should produce different ciphertext', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 1, maxLength: 1000 }),
          fc.string({ minLength: 8 }),
          fc.string({ minLength: 8 }),
          async (data, password1, password2) => {
            fc.pre(password1 !== password2)

            const buffer = Buffer.from(data)
            const encrypted1 = encrypt(buffer, { password: password1 })
            const encrypted2 = encrypt(buffer, { password: password2 })

            expect(encrypted1.data.equals(encrypted2.data)).toBe(false)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('wrong password should fail decryption', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 1, maxLength: 1000 }),
          fc.string({ minLength: 8 }),
          fc.string({ minLength: 8 }),
          async (data, correctPassword, wrongPassword) => {
            fc.pre(correctPassword !== wrongPassword)

            const buffer = Buffer.from(data)
            const encrypted = encrypt(buffer, { password: correctPassword })

            expect(() => decrypt(encrypted, wrongPassword)).toThrow()
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  describe('Signature Invariants', () => {
    it('valid signature should verify', async () => {
      await fc.assert(
        fc.asyncProperty(fc.uint8Array({ minLength: 1, maxLength: 10000 }), async (data) => {
          const keyPair = generateKeyPair()
          const buffer = Buffer.from(data)
          const signature = sign(buffer, keyPair.secretKey)
          const isValid = verify(buffer, signature, keyPair.publicKey)

          expect(isValid).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it('wrong data should fail verification', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 1, maxLength: 1000 }),
          fc.uint8Array({ minLength: 1, maxLength: 1000 }),
          async (data1, data2) => {
            fc.pre(!Buffer.from(data1).equals(Buffer.from(data2)))

            const keyPair = generateKeyPair()
            const buffer1 = Buffer.from(data1)
            const buffer2 = Buffer.from(data2)
            const signature = sign(buffer1, keyPair.secretKey)

            const isValid = verify(buffer2, signature, keyPair.publicKey)

            expect(isValid).toBe(false)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('wrong key should fail verification', async () => {
      await fc.assert(
        fc.asyncProperty(fc.uint8Array({ minLength: 1, maxLength: 1000 }), async (data) => {
          const keyPair1 = generateKeyPair()
          const keyPair2 = generateKeyPair()
          const buffer = Buffer.from(data)
          const signature = sign(buffer, keyPair1.secretKey)

          const isValid = verify(buffer, signature, keyPair2.publicKey)

          expect(isValid).toBe(false)
        }),
        { numRuns: 50 }
      )
    })
  })

  describe('Ordering Invariants', () => {
    it('messages should maintain insertion order', async () => {
      await fc.assert(
        fc.asyncProperty(fc.nat({ max: 100 }), async (count) => {
          const agentFile = await AgentFile.create({
            metadata: { title: 'Order Test' },
            sourceTool: { name: 'test', version: '1.0.0' },
          })

          const messages = Array.from({ length: count }, (_, i) => ({
            id: `msg-${i}`,
            role: 'user' as const,
            content: `Message ${i}`,
            timestamp: new Date(Date.now() + i).toISOString(),
          }))

          await agentFile.addConversation(messages)
          const buffer = await agentFile.saveToBuffer()
          const loaded = await AgentFile.load(buffer)
          const conversation = loaded.getConversation()

          expect(conversation.messages).toHaveLength(count)

          for (let i = 0; i < count; i++) {
            expect(conversation.messages[i].id).toBe(`msg-${i}`)
          }
        }),
        { numRuns: 20 }
      )
    })
  })

  describe('Data Integrity Invariants', () => {
    it('metadata should be preserved', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            title: fc.string(),
            description: fc.option(fc.string(), { nil: undefined }),
            language: fc.option(fc.string(), { nil: undefined }),
            tags: fc.array(fc.string(), { maxLength: 10 }),
          }),
          async (metadata) => {
            const agentFile = await AgentFile.create({
              metadata,
              sourceTool: { name: 'test', version: '1.0.0' },
            })

            const buffer = await agentFile.saveToBuffer()
            const loaded = await AgentFile.load(buffer)
            const loadedMetadata = loaded.getManifest().metadata

            expect(loadedMetadata?.title).toBe(metadata.title)
            expect(loadedMetadata?.description).toBe(metadata.description ?? undefined)
            expect(loadedMetadata?.language).toBe(metadata.language ?? undefined)
            expect(loadedMetadata?.tags).toEqual(metadata.tags)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('version should always be 1.0.0', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string(), async (title) => {
          const agentFile = await AgentFile.create({
            metadata: { title },
            sourceTool: { name: 'test', version: '1.0.0' },
          })

          const manifest = agentFile.getManifest()
          expect(manifest.version).toBe('1.0.0')
          expect(manifest.format).toBe('agent')
        }),
        { numRuns: 20 }
      )
    })
  })

  describe('Size Invariants', () => {
    it('file size should correlate with content size', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.nat({ max: 50 }),
          fc.nat({ min: 10, max: 1000 }),
          async (messageCount, messageLength) => {
            const agentFile = await AgentFile.create({
              metadata: { title: 'Size Test' },
              sourceTool: { name: 'test', version: '1.0.0' },
            })

            const messages = Array.from({ length: messageCount }, (_, i) => ({
              id: `msg-${i}`,
              role: 'user' as const,
              content: 'A'.repeat(messageLength),
              timestamp: new Date().toISOString(),
            }))

            await agentFile.addConversation(messages)
            const buffer = await agentFile.saveToBuffer()

            // Should have content
            expect(buffer.byteLength).toBeGreaterThan(0)

            // More messages should produce larger files
            if (messageCount > 5) {
              const smallFile = await AgentFile.create({
                metadata: { title: 'Small' },
                sourceTool: { name: 'test', version: '1.0.0' },
              })

              await smallFile.addConversation(messages.slice(0, 5))
              const smallBuffer = await smallFile.saveToBuffer()

              expect(buffer.byteLength).toBeGreaterThan(smallBuffer.byteLength)
            }
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  describe('Task Dependency Invariants', () => {
    it('dependencies should be preserved', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.nat({ min: 1, max: 20 }),
          async (taskCount) => {
            const agentFile = await AgentFile.create({
              metadata: { title: 'Task Test' },
              sourceTool: { name: 'test', version: '1.0.0' },
            })

            const tasks = Array.from({ length: taskCount }, (_, i) => ({
              id: `task-${i}`,
              subject: `Task ${i}`,
              description: `Description ${i}`,
              status: 'pending' as const,
              priority: 'medium' as const,
              tags: [],
              blockedBy: i > 0 ? [`task-${i - 1}`] : [],
            }))

            await agentFile.addPlan({
              title: 'Test Plan',
              description: 'Test',
              status: 'pending',
              tasks,
            })

            const buffer = await agentFile.saveToBuffer()
            const loaded = await AgentFile.load(buffer)
            const plan = loaded.getPlan()

            expect(plan.tasks).toHaveLength(taskCount)

            for (let i = 1; i < taskCount; i++) {
              expect(plan.tasks[i].blockedBy).toContain(`task-${i - 1}`)
            }
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  describe('Terminal Session Invariants', () => {
    it('commands should be preserved', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              command: fc.string(),
              output: fc.string(),
              exit_code: fc.nat({ max: 255 }),
              timestamp: fc.datetime().map((d) => d.toISOString()),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          async (commands) => {
            const agentFile = await AgentFile.create({
              metadata: { title: 'Terminal Test' },
              sourceTool: { name: 'test', version: '1.0.0' },
            })

            await agentFile.addTerminalSession({
              id: 'session-1',
              start_time: new Date().toISOString(),
              end_time: new Date().toISOString(),
              working_directory: '/test',
              commands,
            })

            const buffer = await agentFile.saveToBuffer()
            const loaded = await AgentFile.load(buffer)
            const terminal = loaded.getTerminal()

            expect(terminal.sessions[0].commands).toHaveLength(commands.length)

            for (let i = 0; i < commands.length; i++) {
              expect(terminal.sessions[0].commands[i].command).toBe(commands[i].command)
              expect(terminal.sessions[0].commands[i].output).toBe(commands[i].output)
              expect(terminal.sessions[0].commands[i].exit_code).toBe(commands[i].exit_code)
            }
          }
        ),
        { numRuns: 50 }
      )
    })
  })
})
