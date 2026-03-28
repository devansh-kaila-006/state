/**
 * Tests for Manual/Clipboard importer
 */

import { describe, it, expect, vi } from 'vitest'
import * as ManualImporter from './index'

// Mock clipboardy
vi.mock('clipboardy', () => ({
  default: {
    read: vi.fn(),
    write: vi.fn(),
  },
}))

describe('@state/importer-manual', () => {
  describe('Format Detection', () => {
    it('should detect Claude JSON format', () => {
      const claudeJson = JSON.stringify({
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
        ],
      })

      const format = ManualImporter.detectFormat(claudeJson)
      expect(format).toBe('claude-json')
    })

    it('should detect ChatGPT markdown format', () => {
      const chatgptMd = '**User:** Hello\n\n**Assistant:** Hi there!'
      const format = ManualImporter.detectFormat(chatgptMd)
      expect(format).toBe('chatgpt-markdown')
    })

    it('should detect generic markdown format', () => {
      const genericMd = '### User\nHello\n\n### Assistant\nHi there!'
      const format = ManualImporter.detectFormat(genericMd)
      expect(format).toBe('generic-markdown')
    })

    it('should return unknown for unrecognized format', () => {
      const unknownText = 'Just some random text that is not structured'
      const format = ManualImporter.detectFormat(unknownText)
      expect(format).toBe('unknown')
    })

    it('should handle empty string', () => {
      const format = ManualImporter.detectFormat('')
      expect(format).toBe('unknown')
    })
  })

  describe('Claude JSON Parsing', () => {
    it('should parse Claude JSON messages array', async () => {
      const claudeJson = JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'Hello, how are you?',
            timestamp: '2024-01-01T00:00:00.000Z',
          },
          {
            role: 'assistant',
            content: 'I am doing well, thank you!',
            timestamp: '2024-01-01T00:00:01.000Z',
          },
        ],
      })

      const result = await ManualImporter.importFromText(claudeJson)
      expect(result.format).toBe('claude-json')
      expect(result.messageCount).toBe(2)
    })

    it('should handle Claude tree structure', async () => {
      const claudeTree = JSON.stringify({
        mapping: {
          'node-1': {
            id: 'node-1',
            message: {
              id: 'msg-1',
              content: [{ content_type: 'text', parts: ['Hello'] }],
              author: { role: 'user' },
              create_time: 1704067200,
            },
            parent: '',
          },
        },
      })

      const result = await ManualImporter.importFromText(claudeTree)
      expect(result.format).toBe('claude-json')
      expect(result.messageCount).toBe(1)
    })
  })

  describe('ChatGPT Markdown Parsing', () => {
    it('should parse ChatGPT-style markdown', async () => {
      const chatgptMd =
        '**User:** Create a todo list\n\n' +
        '**Assistant:** Here\'s your todo list:\n' +
        '- Task 1\n' +
        '- Task 2\n'

      const result = await ManualImporter.importFromText(chatgptMd)
      expect(result.format).toBe('chatgpt-markdown')
      expect(result.messageCount).toBe(2) // user + assistant
    })

    it('should handle code blocks in ChatGPT format', async () => {
      const chatgptWithCode =
        '**User:** Write a function\n\n' +
        '**Assistant:** ```javascript\n' +
        'function hello() {\n' +
        '  console.log("Hello");\n' +
        '}\n' +
        '```\n'

      const result = await ManualImporter.importFromText(chatgptWithCode)
      expect(result.format).toBe('chatgpt-markdown')
      expect(result.messageCount).toBe(2)
    })
  })

  describe('Generic Markdown Parsing', () => {
    it('should parse generic markdown with headers', async () => {
      const genericMd =
        '### User\nCreate a todo app\n\n' +
        '### Assistant\nHere is a simple todo app implementation:\n'

      const result = await ManualImporter.importFromText(genericMd)
      expect(result.format).toBe('generic-markdown')
      expect(result.messageCount).toBe(2)
    })

    it('should parse generic markdown with list markers', async () => {
      const genericList =
        '- User: Hello\n' +
        '- Assistant: Hi there!\n'

      const result = await ManualImporter.importFromText(genericList)
      expect(result.format).toBe('generic-markdown')
      expect(result.messageCount).toBe(2)
    })

    it('should handle code blocks in generic markdown', async () => {
      const genericWithCode =
        '### User\nWrite code\n\n' +
        '### Assistant\n```python\n' +
        'def hello():\n' +
        '    print("Hello")\n' +
        '```\n'

      const result = await ManualImporter.importFromText(genericWithCode)
      expect(result.format).toBe('generic-markdown')
      expect(result.messageCount).toBe(2)
    })
  })

  describe('Unknown Format Handling', () => {
    it('should treat unknown format as single user message', async () => {
      const unknownText = 'Some random unstructured text'
      const result = await ManualImporter.importFromText(unknownText)

      expect(result.format).toBe('unknown')
      expect(result.messageCount).toBe(1)
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('should include warning for unknown format', async () => {
      const unknownText = 'Random text'
      const result = await ManualImporter.importFromText(unknownText)

      const hasUnknownWarning = result.warnings.some(w =>
        w.includes('Could not detect format')
      )
      expect(hasUnknownWarning).toBe(true)
    })
  })

  describe('Clipboard Import', () => {
    it('should read from clipboard', async () => {
      const clipboardy = (await import('clipboardy')).default
      vi.mocked(clipboardy.read).mockResolvedValue('**User:** Hello\n\n**Assistant:** Hi!')

      const result = await ManualImporter.importFromClipboard()
      expect(result.format).toBe('chatgpt-markdown')
    })

    it('should handle clipboard access errors', async () => {
      const clipboardy = (await import('clipboardy')).default
      vi.mocked(clipboardy.read).mockRejectedValue(new Error('Access denied'))

      await expect(ManualImporter.importFromClipboard()).rejects.toThrow()
    })

    it('should provide helpful error message on clipboard failure', async () => {
      const clipboardy = (await import('clipboardy')).default
      vi.mocked(clipboardy.read).mockRejectedValue(new Error('Access denied'))

      try {
        await ManualImporter.importFromClipboard()
      } catch (error) {
        expect((error as Error).message).toContain('clipboard access')
      }
    })
  })

  describe('Title Generation', () => {
    it('should generate title from first user message', async () => {
      const text = '**User:** How do I create a React component?\n\n**Assistant:** Here is how...'
      const result = await ManualImporter.importFromText(text, {})

      const agentFile = result.agentFile
      const manifest = agentFile.getManifest()
      expect(manifest.metadata?.title).toBeDefined()
    })

    it('should truncate long titles', async () => {
      const longMessage = 'A'.repeat(100)
      const text = `**User:** ${longMessage}\n\n**Assistant:** Response`

      const result = await ManualImporter.importFromText(text)
      const manifest = result.agentFile.getManifest()
      const title = manifest.metadata?.title || ''

      expect(title.length).toBeLessThanOrEqual(50)
    })
  })

  describe('Language Detection', () => {
    it('should detect language from code blocks', async () => {
      const codeInChatGPT =
        '**User:** Write Python code\n\n' +
        '**Assistant:** ```python\n' +
        'def hello():\n' +
        '    print("Hello")\n' +
        '```\n'

      const result = await ManualImporter.importFromText(codeInChatGPT)
      const manifest = result.agentFile.getManifest()
      expect(manifest.metadata?.language).toBeDefined()
    })
  })

  describe('CLI Wrapper Functions', () => {
    it('should import text with CLI wrapper', async () => {
      const text = '**User:** Test\n\n**Assistant:** Response'

      const result = await ManualImporter.cliImportText({
        text,
      })

      expect(result.format).toBeDefined()
      expect(result.messageCount).toBeGreaterThan(0)
    })

    it('should support output option in CLI wrapper', async () => {
      const text = '**User:** Test\n\n**Assistant:** Response'

      const result = await ManualImporter.cliImportText({
        text,
        output: 'test.agent',
      })

      // File should be saved
      expect(result).toBeDefined()
    })

    it('should support title option in CLI wrapper', async () => {
      const text = 'Random conversation'

      const result = await ManualImporter.cliImportText({
        text,
        title: 'Custom Title',
      })

      const manifest = result.agentFile.getManifest()
      expect(manifest.metadata?.title).toBe('Custom Title')
    })

    it('should support language option in CLI wrapper', async () => {
      const text = 'Code discussion'

      const result = await ManualImporter.cliImportText({
        text,
        language: 'Python',
      })

      const manifest = result.agentFile.getManifest()
      expect(manifest.metadata?.language).toBe('Python')
    })
  })

  describe('Error Handling', () => {
    it('should collect warnings for parsing issues', async () => {
      const malformedText = 'Some text that generates warnings'

      const result = await ManualImporter.importFromText(malformedText)
      expect(result.warnings).toBeDefined()
      expect(Array.isArray(result.warnings)).toBe(true)
    })

    it('should still import even with warnings', async () => {
      const textWithIssues = '**User:** Test\n\n**Assistant:** Response'

      const result = await ManualImporter.importFromText(textWithIssues)
      expect(result.agentFile).toBeDefined()
      expect(result.messageCount).toBeGreaterThan(0)
    })

    it('should handle empty content gracefully', async () => {
      const result = await ManualImporter.importFromText('')

      expect(result).toBeDefined()
      expect(result.format).toBe('unknown')
    })
  })

  describe('Supported Formats', () => {
    it('should return list of supported formats', () => {
      const formats = ManualImporter.getSupportedFormats()
      expect(Array.isArray(formats)).toBe(true)
      expect(formats.length).toBeGreaterThan(0)

      for (const fmt of formats) {
        expect(fmt.format).toBeDefined()
        expect(fmt.description).toBeDefined()
        expect(fmt.example).toBeDefined()
      }
    })

    it('should include claude-json in supported formats', () => {
      const formats = ManualImporter.getSupportedFormats()
      const claudeFormat = formats.find(f => f.format === 'claude-json')
      expect(claudeFormat).toBeDefined()
    })

    it('should include chatgpt-markdown in supported formats', () => {
      const formats = ManualImporter.getSupportedFormats()
      const chatgptFormat = formats.find(f => f.format === 'chatgpt-markdown')
      expect(chatgptFormat).toBeDefined()
    })

    it('should include generic-markdown in supported formats', () => {
      const formats = ManualImporter.getSupportedFormats()
      const genericFormat = formats.find(f => f.format === 'generic-markdown')
      expect(genericFormat).toBeDefined()
    })
  })

  describe('Utility Functions', () => {
    it('should validate clipboard access', async () => {
      const clipboardy = (await import('clipboardy')).default
      vi.mocked(clipboardy.read).mockResolvedValue('test')

      const canAccess = await ManualImporter.validateClipboardAccess()
      expect(canAccess).toBe(true)
    })

    it('should return false when clipboard fails', async () => {
      const clipboardy = (await import('clipboardy')).default
      vi.mocked(clipboardy.read).mockRejectedValue(new Error('Failed'))

      const canAccess = await ManualImporter.validateClipboardAccess()
      expect(canAccess).toBe(false)
    })
  })
})
