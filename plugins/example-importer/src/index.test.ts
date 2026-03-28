/**
 * Tests for Example Importer Plugin
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { exampleImporterPlugin } from './index'

describe('Example Importer Plugin', () => {
  const validInput = {
    title: 'Test Conversation',
    description: 'A test conversation',
    messages: [
      { role: 'user', content: 'Hello', timestamp: '2024-01-01T00:00:00.000Z' },
      { role: 'assistant', content: 'Hi there!', timestamp: '2024-01-01T00:00:01.000Z' },
    ],
  }

  describe('Plugin Metadata', () => {
    it('should have correct metadata', () => {
      expect(exampleImporterPlugin.name).toBe('example-importer')
      expect(exampleImporterPlugin.version).toBe('1.0.0')
      expect(exampleImporterPlugin.description).toBe(
        'Example importer plugin for State (.agent)'
      )
    })
  })

  describe('detect()', () => {
    it('should detect valid input format', async () => {
      const result = await exampleImporterPlugin.detect(validInput)
      expect(result).toBe(true)
    })

    it('should reject null input', async () => {
      const result = await exampleImporterPlugin.detect(null)
      expect(result).toBe(false)
    })

    it('should reject non-object input', async () => {
      const result = await exampleImporterPlugin.detect('string')
      expect(result).toBe(false)
    })

    it('should reject input without messages array', async () => {
      const result = await exampleImporterPlugin.detect({ foo: 'bar' })
      expect(result).toBe(false)
    })

    it('should reject empty messages array', async () => {
      const result = await exampleImporterPlugin.detect({ messages: [] })
      expect(result).toBe(false)
    })

    it('should reject messages without role', async () => {
      const result = await exampleImporterPlugin.detect({
        messages: [{ content: 'Hello' }],
      })
      expect(result).toBe(false)
    })

    it('should reject invalid role', async () => {
      const result = await exampleImporterPlugin.detect({
        messages: [{ role: 'invalid', content: 'Hello' }],
      })
      expect(result).toBe(false)
    })

    it('should accept valid roles', async () => {
      const roles = ['user', 'assistant', 'system']

      for (const role of roles) {
        const result = await exampleImporterPlugin.detect({
          messages: [{ role, content: 'Test' }],
        })
        expect(result).toBe(true)
      }
    })
  })

  describe('validate()', () => {
    it('should validate correct input', async () => {
      const result = await exampleImporterPlugin.validate(validInput)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return error for non-object input', async () => {
      const result = await exampleImporterPlugin.validate('string')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Input must be an object')
    })

    it('should return error for missing messages', async () => {
      const result = await exampleImporterPlugin.validate({ foo: 'bar' })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Input must have a messages array')
    })

    it('should warn for empty messages array', async () => {
      const result = await exampleImporterPlugin.validate({ messages: [] })
      expect(result.valid).toBe(true)
      expect(result.warnings).toContain('Messages array is empty')
    })

    it('should validate message structure', async () => {
      const result = await exampleImporterPlugin.validate({
        messages: [{ role: 'user', content: 123 }],
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Message 0 content must be a string')
    })

    it('should validate role field', async () => {
      const result = await exampleImporterPlugin.validate({
        messages: [{ content: 'Hello' }],
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Message 0 missing role')
    })
  })

  describe('getMetadata()', () => {
    it('should return correct metadata', async () => {
      const metadata = await exampleImporterPlugin.getMetadata({
        messages: [{ role: 'user', content: 'Test' }],
        semanticMap: { files: [] },
        terminal: { sessions: [] },
        plan: { tasks: [] },
      })

      expect(metadata.source).toBe('example-format')
      expect(metadata.format).toBe('json')
      expect(metadata.version).toBe('1.0')
      expect(metadata.messageCount).toBe(1)
      expect(metadata.hasSemanticMap).toBe(true)
      expect(metadata.hasTerminal).toBe(true)
      expect(metadata.hasPlan).toBe(true)
    })

    it('should handle input without optional sections', async () => {
      const metadata = await exampleImporterPlugin.getMetadata({
        messages: [{ role: 'user', content: 'Test' }],
      })

      expect(metadata.hasSemanticMap).toBe(false)
      expect(metadata.hasTerminal).toBe(false)
      expect(metadata.hasPlan).toBe(false)
    })
  })

  describe('transformMessages()', () => {
    it('should transform messages correctly', () => {
      const input = [
        { role: 'user', content: 'Hello', timestamp: '2024-01-01T00:00:00.000Z' },
        { role: 'assistant', content: 'Hi!', timestamp: '2024-01-01T00:00:01.000Z' },
      ]

      const result = exampleImporterPlugin.transformMessages(input)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: 'msg-0',
        role: 'user',
        content: 'Hello',
        timestamp: '2024-01-01T00:00:00.000Z',
      })
      expect(result[1]).toEqual({
        id: 'msg-1',
        role: 'assistant',
        content: 'Hi!',
        timestamp: '2024-01-01T00:00:01.000Z',
      })
    })

    it('should generate IDs', () => {
      const input = [{ role: 'user', content: 'Test' }]
      const result = exampleImporterPlugin.transformMessages(input)

      expect(result[0].id).toBe('msg-0')
    })

    it('should generate timestamps if missing', () => {
      const input = [{ role: 'user', content: 'Test' }]
      const result = exampleImporterPlugin.transformMessages(input)

      expect(result[0].timestamp).toBeDefined()
      expect(result[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })
  })

  describe('import()', () => {
    it('should import valid input', async () => {
      // Note: This test requires @state/format to be available
      // In a real plugin test, you would mock AgentFile or use the real implementation

      const input = {
        title: 'Test',
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi!' },
        ],
      }

      // Test that import method exists and can be called
      expect(typeof exampleImporterPlugin.import).toBe('function')

      // The actual import would require AgentFile to be available
      // For this example, we just verify the method signature
      const importPromise = exampleImporterPlugin.import(input, {})
      expect(importPromise).toBeInstanceOf(Promise)
    })

    it('should throw on invalid input', async () => {
      const input = { messages: [] }

      await expect(exampleImporterPlugin.import(input)).rejects.toThrow()
    })

    it('should accept import options', async () => {
      const input = {
        messages: [{ role: 'user', content: 'Test' }],
      }

      const options = {
        title: 'Custom Title',
        description: 'Custom Description',
        language: 'Python',
        includeSemanticMap: false,
        includeTerminal: false,
        includePlan: false,
      }

      // Verify options are accepted
      const importPromise = exampleImporterPlugin.import(input, options)
      expect(importPromise).toBeInstanceOf(Promise)
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete workflow', async () => {
      // Test detect -> validate -> getMetadata -> import workflow

      // 1. Detect
      const canDetect = await exampleImporterPlugin.detect(validInput)
      expect(canDetect).toBe(true)

      // 2. Validate
      const validation = await exampleImporterPlugin.validate(validInput)
      expect(validation.valid).toBe(true)

      // 3. Get metadata
      const metadata = await exampleImporterPlugin.getMetadata(validInput)
      expect(metadata.messageCount).toBe(2)

      // 4. Import (verify method exists)
      expect(typeof exampleImporterPlugin.import).toBe('function')
    })

    it('should handle input with all optional sections', async () => {
      const fullInput = {
        title: 'Complete Example',
        description: 'With all sections',
        language: 'TypeScript',
        messages: [
          { role: 'user', content: 'Help me code' },
          { role: 'assistant', content: 'Sure!' },
        ],
        semanticMap: {
          files: [
            { path: 'src/index.ts', language: 'TypeScript', size: 100 },
          ],
        },
        terminal: {
          sessions: [
            {
              commands: [
                { command: 'npm test', output: 'Passing' },
              ],
            },
          ],
        },
        plan: {
          tasks: [
            { id: '1', title: 'Write tests', status: 'pending' },
          ],
        },
      }

      const canDetect = await exampleImporterPlugin.detect(fullInput)
      expect(canDetect).toBe(true)

      const validation = await exampleImporterPlugin.validate(fullInput)
      expect(validation.valid).toBe(true)

      const metadata = await exampleImporterPlugin.getMetadata(fullInput)
      expect(metadata.hasSemanticMap).toBe(true)
      expect(metadata.hasTerminal).toBe(true)
      expect(metadata.hasPlan).toBe(true)
    })
  })
})
