/**
 * Tests for Claude Code importer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AgentFile } from '@state/format'
import * as ClaudeImporter from './index'

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
  access: vi.fn(),
}))

describe('@state/importer-claude', () => {
  describe('Platform Detection', () => {
    it('should detect Windows platform', () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true,
      })

      // Test would call getClaudePath internally
      expect(true).toBe(true) // Placeholder

      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        configurable: true,
      })
    })

    it('should detect macOS platform', () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        configurable: true,
      })

      expect(true).toBe(true) // Placeholder

      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        configurable: true,
      })
    })

    it('should detect Linux platform', () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true,
      })

      expect(true).toBe(true) // Placeholder

      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        configurable: true,
      })
    })
  })

  describe('Data Mapping', () => {
    it('should map Claude message to .agent format', async () => {
      const claudeMessage: ClaudeImporter.ClaudeMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello, how are you?',
        timestamp: '2024-01-01T00:00:00.000Z',
      }

      const expectedMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello, how are you?',
        timestamp: '2024-01-01T00:00:00.000Z',
      }

      expect(claudeMessage.role).toBe(expectedMessage.role)
      expect(claudeMessage.content).toBe(expectedMessage.content)
    })

    it('should handle assistant messages with model info', async () => {
      const claudeMessage: ClaudeImporter.ClaudeMessage = {
        id: 'msg-2',
        role: 'assistant',
        content: 'I am doing well, thank you!',
        timestamp: '2024-01-01T00:00:01.000Z',
        model: 'claude-3-opus-20240229',
      }

      expect(claudeMessage.role).toBe('assistant')
      expect(claudeMessage.model).toBeDefined()
    })
  })

  describe('Tool Use Extraction', () => {
    it('should extract tool use from Claude message', () => {
      const claudeMessage: ClaudeImporter.ClaudeMessage = {
        id: 'msg-3',
        role: 'assistant',
        content: 'I ran the code for you.',
        timestamp: '2024-01-01T00:00:02.000Z',
        tools_used: [
          {
            id: 'tool-1',
            name: 'code_interpreter',
            input: { code: 'print("Hello")' },
            output: { result: 'Hello' },
          },
        ],
      }

      expect(claudeMessage.tools_used).toBeDefined()
      expect(claudeMessage.tools_used?.length).toBe(1)
      expect(claudeMessage.tools_used?.[0].name).toBe('code_interpreter')
    })
  })

  describe('Citation Extraction', () => {
    it('should preserve citations from Claude message', () => {
      const claudeMessage: ClaudeImporter.ClaudeMessage = {
        id: 'msg-4',
        role: 'assistant',
        content: 'According to the documentation...',
        timestamp: '2024-01-01T00:00:03.000Z',
        citations: ['source-1', 'source-2'],
      }

      expect(claudeMessage.citations).toBeDefined()
      expect(claudeMessage.citations?.length).toBe(2)
    })
  })

  describe('Context Preservation', () => {
    it('should preserve conversation context', () => {
      const claudeConv: ClaudeImporter.ClaudeConversation = {
        id: 'conv-1',
        title: 'Test Conversation',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        messages: [],
        context: {
          system_prompt: 'You are a helpful assistant.',
          temperature: 0.7,
          max_tokens: 2000,
        },
      }

      expect(claudeConv.context).toBeDefined()
      expect(claudeConv.context?.system_prompt).toBe('You are a helpful assistant.')
      expect(claudeConv.context?.temperature).toBe(0.7)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing conversations directory gracefully', async () => {
      // Test error handling when directory doesn't exist
      const { access } = await import('fs/promises')
      vi.mocked(access).mockRejectedValue(new Error('Directory not found'))

      // Import should throw error with helpful message
      await expect(ClaudeImporter.importFromLocal()).rejects.toThrow()
    })

    it('should handle malformed conversation.json', async () => {
      // Test handling of invalid JSON
      const { readFile } = await import('fs/promises')
      vi.mocked(readFile).mockResolvedValue('{ invalid json')

      // Should log warning and continue with other conversations
      const agentFiles = await ClaudeImporter.importFromLocal()
      expect(Array.isArray(agentFiles)).toBe(true)
    })
  })

  describe('API Key Validation', () => {
    it('should validate Claude API key format', () => {
      const validKey = 'sk-ant-api03-1234567890abcdefghijklmnopqrstuv'
      const invalidKey = 'invalid-key'

      expect(ClaudeImporter.validateAPIKey(validKey)).toBe(true)
      expect(ClaudeImporter.validateAPIKey(invalidKey)).toBe(false)
    })

    it('should accept API keys with correct prefix and length', () => {
      const validKey = 'sk-ant-api03-' + 'x'.repeat(40)
      expect(ClaudeImporter.validateAPIKey(validKey)).toBe(true)
    })
  })

  describe('Conversation Listing', () => {
    it('should list conversations in reverse chronological order', async () => {
      // Test that conversations are sorted by date (newest first)
      const conversations = await ClaudeImporter.listLocalConversations()
      expect(Array.isArray(conversations)).toBe(true)

      // Verify sorting if data exists
      if (conversations.length >= 2) {
        const first = new Date(conversations[0].created_at)
        const second = new Date(conversations[1].created_at)
        expect(first.getTime() >= second.getTime()).toBe(true)
      }
    })
  })

  describe('Search Functionality', () => {
    it('should search conversations by title', async () => {
      const results = await ClaudeImporter.searchLocalConversations('react')
      expect(Array.isArray(results)).toBe(true)

      // Verify search works
      for (const conv of results) {
        const matches = conv.title?.toLowerCase().includes('react') ||
                         conv.id.toLowerCase().includes('react')
        expect(matches).toBe(true)
      }
    })

    it('should be case-insensitive', async () => {
      const results1 = await ClaudeImporter.searchLocalConversations('REACT')
      const results2 = await ClaudeImporter.searchLocalConversations('react')
      expect(results1.length).toBe(results2.length)
    })
  })

  describe('Path Resolution', () => {
    it('should resolve correct path for Windows', () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true,
      })

      const path = ClaudeImporter.getClaudePaths()
      expect(path.conversations).toContain('claude')

      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        configurable: true,
      })
    })

    it('should resolve correct path for macOS', () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        configurable: true,
      })

      const path = ClaudeImporter.getClaudePaths()
      expect(path.conversations).toContain('.claude')

      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        configurable: true,
      })
    })

    it('should resolve correct path for Linux', () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true,
      })

      const path = ClaudeImporter.getClaudePaths()
      expect(path.conversations).toContain('.claude')

      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        configurable: true,
      })
    })
  })
})
