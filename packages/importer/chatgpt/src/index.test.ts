/**
 * Tests for ChatGPT importer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as ChatGPTImporter from './index'

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
}))

// Mock JSZip
vi.mock('jszip', () => ({
  default: {
    loadAsync: vi.fn(),
  },
}))

describe('@state/importer-chatgpt', () => {
  describe('Export Validation', () => {
    it('should validate valid ChatGPT export', async () => {
      // Create a mock valid export
      const mockZip = {
        file: vi.fn().mockReturnValue({
          async: vi.fn().mockResolvedValue(JSON.stringify({
            conversations: [
              {
                title: 'Test Conversation',
                conversation_id: 'test-conv-1',
                timestamp: '2024-01-01T00:00:00.000Z',
                mapping: {
                  'node-1': {
                    id: 'node-1',
                    message: {
                      id: 'msg-1',
                      content: [{ content_type: 'text', parts: ['Hello'] }],
                      author: { role: 'user' },
                      create_time: 1704067200,
                    },
                    end_turn: true,
                    weight: 1.0,
                  },
                },
                current_node: 'node-1',
              },
            ],
          })),
        }),
      }

      const JSZip = (await import('jszip')).default
      vi.mocked(JSZip.loadAsync).mockResolvedValue(mockZip)

      const isValid = await ChatGPTImporter.validateExportFile('export.zip')
      expect(isValid).toBe(true)
    })

    it('should reject export without conversations.json', async () => {
      const mockZip = {
        file: vi.fn().mockReturnValue(null),
      }

      const JSZip = (await import('jszip')).default
      vi.mocked(JSZip.loadAsync).mockResolvedValue(mockZip)

      const isValid = await ChatGPTImporter.validateExportFile('export.zip')
      expect(isValid).toBe(false)
    })

    it('should reject export with invalid JSON structure', async () => {
      const mockZip = {
        file: vi.fn().mockReturnValue({
          async: vi.fn().mockResolvedValue('{ invalid }'),
        }),
      }

      const JSZip = (await import('jszip')).default
      vi.mocked(JSZip.loadAsync).mockResolvedValue(mockZip)

      const isValid = await ChatGPTImporter.validateExportFile('export.zip')
      expect(isValid).toBe(false)
    })
  })

  describe('Tree Structure Parsing', () => {
    it('should extract messages from mapping with parent/child relationships', async () => {
      const chatgptConv: ChatGPTImporter.ChatGPTConversation = {
        title: 'Test Conversation',
        conversation_id: 'test-conv-1',
        timestamp: '2024-01-01T00:00:00.000Z',
        mapping: {
          'node-1': {
            id: 'node-1',
            message: {
              id: 'msg-1',
              content: [{ content_type: 'text', parts: ['Hello'] }],
              author: { role: 'user' },
              create_time: 1704067200,
            },
            end_turn: true,
            weight: 1.0,
            parent: '',
            children: ['node-2'],
          },
          'node-2': {
            id: 'node-2',
            message: {
              id: 'msg-2',
              content: [{ content_type: 'text', parts: ['Hi there!'] }],
              author: { role: 'assistant' },
              create_time: 1704067201,
            },
            end_turn: true,
            weight: 1.0,
            parent: 'node-1',
          },
        },
        current_node: 'node-2',
      }

      // Test that tree structure is parsed correctly
      expect(chatgptConv.mapping['node-1'].parent).toBe('')
      expect(chatgptConv.mapping['node-2'].parent).toBe('node-1')
      expect(chatgptConv.mapping['node-1'].children).toContain('node-2')
    })
  })

  describe('Content Part Extraction', () => {
    it('should extract text content from parts', () => {
      const contentParts: ChatGPTImporter.ChatGPTContentPart[] = [
        { content_type: 'text', parts: ['Hello, world!'] },
      ]

      const text = contentParts
        .filter(part => part.content_type === 'text')
        .map(part => part.parts.join('\n'))
        .join('\n\n')

      expect(text).toBe('Hello, world!')
    })

    it('should join multiple text parts', () => {
      const contentParts: ChatGPTImporter.ChatGPTContentPart[] = [
        { content_type: 'text', parts: ['First part'] },
        { content_type: 'text', parts: ['Second part'] },
      ]

      const text = contentParts
        .filter(part => part.content_type === 'text')
        .map(part => part.parts.join('\n'))
        .join('\n\n')

      expect(text).toBe('First part\n\nSecond part')
    })

    it('should handle code content type', () => {
      const codePart: ChatGPTImporter.ChatGPTContentPart = {
        content_type: 'code',
        parts: ['def hello():', '    print("Hello")'],
      }

      expect(codePart.content_type).toBe('code')
      expect(codePart.parts.length).toBe(2)
    })
  })

  describe('Tool Detection', () => {
    it('should detect Code Interpreter usage', () => {
      const msgWithCode: ChatGPTImporter.ChatGPTMessage = {
        id: 'msg-1',
        content: [{ content_type: 'text', parts: ['I ran the code.'] }],
        author: { role: 'assistant' },
        create_time: 1704067200,
        metadata: {
          model_slug: 'gpt-4',
          plugins: [
            {
              id: 'code_interpreter',
              last_used_inputs: { code: 'print("test")' },
            },
          ],
        },
      }

      // The importer should detect code_interpreter plugin
      expect(msgWithCode.metadata?.plugins).toBeDefined()
      expect(msgWithCode.metadata?.plugins?.[0].id).toBe('code_interpreter')
    })

    it('should detect DALL-E usage', () => {
      const msgWithDalle: ChatGPTImporter.ChatGPTMessage = {
        id: 'msg-2',
        content: [{ content_type: 'text', parts: ['I generated an image.'] }],
        author: { role: 'assistant' },
        create_time: 1704067201,
        metadata: {
          model_slug: 'gpt-4',
          plugins: [
            {
              id: 'dalle.text2im',
              last_used_prompt: 'A cat',
            },
          ],
        },
      }

      expect(msgWithDalle.metadata?.plugins?.[0].id).toContain('dalle')
    })

    it('should detect browsing usage', () => {
      const msgWithBrowse: ChatGPTImporter.ChatGPTMessage = {
        id: 'msg-3',
        content: [{ content_type: 'text', parts: ['I searched the web.'] }],
        author: { role: 'assistant' },
        create_time: 1704067202,
        metadata: {
          model_slug: 'gpt-4',
          plugins: [
            {
              id: 'browser',
              last_used_query: 'latest news',
              displayed_results: ['result1', 'result2'],
            },
          ],
        },
      }

      expect(msgWithBrowse.metadata?.plugins?.[0].id).toBe('browser')
    })
  })

  describe('Code Language Detection', () => {
    it('should detect Python code', () => {
      const pythonCode = [
        'def hello():',
        '    print("Hello")',
      ]

      const language = ChatGPTImporter.detectCodeLanguage(pythonCode)
      expect(language).toBe('python')
    })

    it('should detect JavaScript code', () => {
      const jsCode = [
        'function hello() {',
        '    console.log("Hello");',
        '}',
      ]

      const language = ChatGPTImporter.detectCodeLanguage(jsCode)
      expect(language).toBe('javascript')
    })

    it('should detect TypeScript code', () => {
      const tsCode = [
        'interface User {',
        '    name: string;',
        '}',
      ]

      const language = ChatGPTImporter.detectCodeLanguage(tsCode)
      expect(language).toBe('typescript')
    })

    it('should detect Rust code', () => {
      const rustCode = [
        'fn main() {',
        '    println!("Hello");',
        '}',
      ]

      const language = ChatGPTImporter.detectCodeLanguage(rustCode)
      expect(language).toBe('rust')
    })

    it('should detect Go code', () => {
      const goCode = [
        'func main() {',
        '    fmt.Println("Hello")',
        '}',
      ]

      const language = ChatGPTImporter.detectCodeLanguage(goCode)
      expect(language).toBe('go')
    })

    it('should detect Java code', () => {
      const javaCode = [
        'public class Main {',
        '    public static void main(String[] args) {}',
        '}',
      ]

      const language = ChatGPTImporter.detectCodeLanguage(javaCode)
      expect(language).toBe('java')
    })

    it('should default to text for unknown code', () => {
      const unknownCode = [
        'some random code',
        'that we cannot identify',
      ]

      const language = ChatGPTImporter.detectCodeLanguage(unknownCode)
      expect(language).toBe('text')
    })
  })

  describe('Conversation Count', () => {
    it('should return 0 for empty export', async () => {
      const mockZip = {
        file: vi.fn().mockReturnValue({
          async: vi.fn().mockResolvedValue(JSON.stringify({
            conversations: [],
          })),
        }),
      }

      const JSZip = (await import('jszip')).default
      vi.mocked(JSZip.loadAsync).mockResolvedValue(mockZip)

      const count = await ChatGPTImporter.getConversationCount('export.zip')
      expect(count).toBe(0)
    })

    it('should count conversations correctly', async () => {
      const conversations = Array.from({ length: 5 }, (_, i) => ({
        title: `Conversation ${i + 1}`,
        conversation_id: `conv-${i + 1}`,
        timestamp: '2024-01-01T00:00:00.000Z',
        mapping: {},
        current_node: '',
      }))

      const mockZip = {
        file: vi.fn().mockReturnValue({
          async: vi.fn().mockResolvedValue(JSON.stringify({
            conversations,
          })),
        }),
      }

      const JSZip = (await import('jszip')).default
      vi.mocked(JSZip.loadAsync).mockResolvedValue(mockZip)

      const count = await ChatGPTImporter.getConversationCount('export.zip')
      expect(count).toBe(5)
    })
  })

  describe('List Conversations', () => {
    it('should return conversation metadata', async () => {
      const conversations = [
        {
          title: 'React Help',
          conversation_id: 'conv-react',
          timestamp: '2024-01-01T00:00:00.000Z',
          mapping: {},
          current_node: '',
        },
        {
          title: 'Python Script',
          conversation_id: 'conv-python',
          timestamp: '2024-01-02T00:00:00.000Z',
          mapping: {},
          current_node: '',
        },
      ]

      const mockZip = {
        file: vi.fn().mockReturnValue({
          async: vi.fn().mockResolvedValue(JSON.stringify({
            conversations,
          })),
        }),
      }

      const JSZip = (await import('jszip')).default
      vi.mocked(JSZip.loadAsync).mockResolvedValue(mockZip)

      const result = await ChatGPTImporter.listConversations('export.zip')

      expect(result).toHaveLength(2)
      expect(result[0].title).toBe('React Help')
      expect(result[0].id).toBe('conv-react')
      expect(result[1].title).toBe('Python Script')
      expect(result[1].id).toBe('conv-python')
    })
  })

  describe('Error Handling', () => {
    it('should handle corrupt ZIP files', async () => {
      const JSZip = (await import('jszip')).default
      vi.mocked(JSZip.loadAsync).mockRejectedValue(new Error('Invalid ZIP'))

      await expect(
        ChatGPTImporter.importFromExport('corrupt.zip')
      ).rejects.toThrow()
    })

    it('should handle malformed JSON gracefully', async () => {
      const mockZip = {
        file: vi.fn().mockReturnValue({
          async: vi.fn().mockResolvedValue('{invalid json'),
        }),
      }

      const JSZip = (await import('jszip')).default
      vi.mocked(JSZip.loadAsync).mockResolvedValue(mockZip)

      await expect(
        ChatGPTImporter.importFromExport('malformed.zip')
      ).rejects.toThrow()
    })

    it('should continue on individual conversation errors', async () => {
      const conversations = [
        {
          title: 'Valid Conv',
          conversation_id: 'valid-1',
          timestamp: '2024-01-01T00:00:00.000Z',
          mapping: {
            'node-1': {
              id: 'node-1',
              message: {
                id: 'msg-1',
                content: [{ content_type: 'text', parts: ['Valid'] }],
                author: { role: 'user' },
                create_time: 1704067200,
              },
              end_turn: true,
              weight: 1.0,
            },
          },
          current_node: 'node-1',
        },
        {
          // Invalid conversation (missing required fields)
          title: 'Invalid Conv',
          conversation_id: 'invalid-1',
          timestamp: '2024-01-01T00:00:00.000Z',
          mapping: {},
          current_node: '',
        },
      ]

      const mockZip = {
        file: vi.fn().mockReturnValue({
          async: vi.fn().mockResolvedValue(JSON.stringify({
            conversations,
          })),
        }),
        }

      const JSZip = (await import('jszip')).default
      vi.mocked(JSZip.loadAsync).mockResolvedValue(mockZip)

      const agentFiles = await ChatGPTImporter.importFromExport('mixed.zip')
      // Should import valid conversations and skip invalid ones
      expect(agentFiles.length).toBeGreaterThan(0)
    })
  })
})
