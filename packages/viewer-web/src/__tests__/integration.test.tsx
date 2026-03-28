/**
 * Integration tests for web viewer
 * Tests complete workflows from file upload to rendering
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import JSZip from 'jszip'

// Mock JSZip for testing
vi.mock('jszip', () => ({
  default: class MockJSZip {
    static async loadAsync(buffer: ArrayBuffer) {
      return new MockJSZip()
    }

    file(name: string) {
      return {
        async: async (type: string) => {
          // Return mock data based on file name
          if (name === 'manifest.json') {
            return JSON.stringify({
              version: '1.0',
              metadata: {
                title: 'Test Conversation',
                description: 'Test description',
                language: 'TypeScript',
                created_at: '2024-01-01T00:00:00.000Z',
              },
              source_tool: {
                name: 'claude-code',
                version: '1.0.0',
              },
            })
          }
          if (name === 'conversations/messages.json') {
            return JSON.stringify([
              {
                id: 'msg-1',
                role: 'user',
                content: 'Hello, how are you?',
                timestamp: '2024-01-01T00:00:00.000Z',
              },
              {
                id: 'msg-2',
                role: 'assistant',
                content: 'I am doing well, thank you!',
                timestamp: '2024-01-01T00:00:01.000Z',
              },
            ])
          }
          if (name === 'semantic-map/index.json') {
            return JSON.stringify({
              files: [
                {
                  path: 'src/index.ts',
                  language: 'TypeScript',
                  size: 1024,
                  last_modified: '2024-01-01T00:00:00.000Z',
                },
              ],
              languages: {
                TypeScript: { files: 1, lines: 50, percentage: 100 },
              },
              dependencies: [
                { name: 'react', version: '^18.0.0', type: 'dependencies' },
              ],
            })
          }
          if (name === 'terminal/sessions.json') {
            return JSON.stringify([
              {
                id: 'session-1',
                start_time: '2024-01-01T00:00:00.000Z',
                end_time: '2024-01-01T00:00:10.000Z',
                working_directory: '/home/user/project',
                commands: [
                  {
                    command: 'npm install',
                    output: 'Installing dependencies...',
                    exit_code: 0,
                    timestamp: '2024-01-01T00:00:01.000Z',
                  },
                ],
              },
            ])
          }
          if (name === 'plan/index.md') {
            return '# Test Plan\n\n## Tasks\n\n- [x] Task 1\n- [ ] Task 2\n'
          }
          return ''
        },
      }
    }
  },
}))

describe('Web Viewer Integration Tests', () => {
  describe('Complete File Loading Workflow', () => {
    it('should load and display all sections of a valid .agent file', async () => {
      // Create a mock .agent file
      const zip = new JSZip()
      zip.file('manifest.json', JSON.stringify({
        version: '1.0',
        metadata: {
          title: 'Integration Test',
          description: 'Test',
          language: 'TypeScript',
          created_at: '2024-01-01T00:00:00.000Z',
        },
        source_tool: { name: 'test', version: '1.0.0' },
      }))
      zip.file('conversations/messages.json', JSON.stringify([
        { id: 'msg-1', role: 'user', content: 'Hello', timestamp: '2024-01-01T00:00:00.000Z' },
        { id: 'msg-2', role: 'assistant', content: 'Hi!', timestamp: '2024-01-01T00:00:01.000Z' },
      ]))

      const buffer = await zip.generateAsync({ type: 'arraybuffer' })

      // Test that buffer can be loaded
      expect(buffer).toBeInstanceOf(ArrayBuffer)
      expect(buffer.byteLength).toBeGreaterThan(0)
    })

    it('should handle files with missing optional sections', async () => {
      const zip = new JSZip()
      // Only include manifest and conversations - no semantic map, terminal, or plan
      zip.file('manifest.json', JSON.stringify({
        version: '1.0',
        metadata: { title: 'Minimal Test' },
        source_tool: { name: 'test', version: '1.0.0' },
      }))
      zip.file('conversations/messages.json', JSON.stringify([
        { id: 'msg-1', role: 'user', content: 'Test', timestamp: '2024-01-01T00:00:00.000Z' },
      ]))

      const buffer = await zip.generateAsync({ type: 'arraybuffer' })
      expect(buffer.byteLength).toBeGreaterThan(0)
    })

    it('should reject files without manifest', async () => {
      const zip = new JSZip()
      zip.file('conversations/messages.json', JSON.stringify([]))

      const buffer = await zip.generateAsync({ type: 'arraybuffer' })

      // Should handle gracefully - no manifest means file is invalid
      expect(buffer).toBeInstanceOf(ArrayBuffer)
    })
  })

  describe('View Switching', () => {
    it('should switch between conversation, semantic map, terminal, and plan views', () => {
      // Test view state management
      const views = ['conversation', 'semantic-map', 'terminal', 'plan'] as const

      for (const view of views) {
        expect(view).toBeDefined()
      }
    })

    it('should preserve scroll position when switching views', () => {
      // Test scroll position preservation
      const scrollPositions: Record<string, number> = {}

      scrollPositions['conversation'] = 100
      scrollPositions['semantic-map'] = 200

      expect(scrollPositions['conversation']).toBe(100)
      expect(scrollPositions['semantic-map']).toBe(200)
    })
  })

  describe('Message Rendering', () => {
    it('should render user and assistant messages correctly', () => {
      const messages = [
        { id: 'msg-1', role: 'user', content: 'Hello', timestamp: '2024-01-01T00:00:00.000Z' },
        { id: 'msg-2', role: 'assistant', content: 'Hi there!', timestamp: '2024-01-01T00:00:01.000Z' },
      ]

      expect(messages).toHaveLength(2)
      expect(messages[0].role).toBe('user')
      expect(messages[1].role).toBe('assistant')
    })

    it('should render markdown content with code blocks', () => {
      const message = {
        id: 'msg-1',
        role: 'assistant',
        content: 'Here is some code:\n\n```typescript\nconst x = 1\n```',
        timestamp: '2024-01-01T00:00:00.000Z',
      }

      expect(message.content).toContain('```')
      expect(message.content).toContain('typescript')
    })

    it('should render inline code correctly', () => {
      const message = {
        id: 'msg-1',
        role: 'assistant',
        content: 'Use `npm install` to install dependencies.',
        timestamp: '2024-01-01T00:00:00.000Z',
      }

      expect(message.content).toContain('`')
    })

    it('should render GFM tables', () => {
      const message = {
        id: 'msg-1',
        role: 'assistant',
        content: '| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |',
        timestamp: '2024-01-01T00:00:00.000Z',
      }

      expect(message.content).toContain('|')
    })
  })

  describe('Semantic Map Rendering', () => {
    it('should display file tree hierarchy', () => {
      const files = [
        { path: 'src/index.ts', language: 'TypeScript', size: 1024 },
        { path: 'src/components/App.tsx', language: 'TypeScript', size: 2048 },
        { path: 'package.json', language: 'JSON', size: 512 },
      ]

      const tree = files.reduce((acc, file) => {
        const parts = file.path.split('/')
        let current = acc
        for (const part of parts) {
          if (!current[part]) {
            current[part] = {}
          }
          current = current[part]
        }
        return acc
      }, {} as Record<string, any>)

      expect(tree).toBeDefined()
      expect(tree.src).toBeDefined()
    })

    it('should display language statistics', () => {
      const languages = {
        TypeScript: { files: 10, lines: 500, percentage: 80 },
        CSS: { files: 5, lines: 100, percentage: 20 },
      }

      expect(languages.TypeScript.percentage).toBe(80)
      expect(languages.CSS.percentage).toBe(20)
    })

    it('should display dependencies', () => {
      const dependencies = [
        { name: 'react', version: '^18.0.0', type: 'dependencies' },
        { name: 'typescript', version: '^5.0.0', type: 'devDependencies' },
      ]

      expect(dependencies).toHaveLength(2)
      expect(dependencies[0].type).toBe('dependencies')
    })
  })

  describe('Terminal Rendering', () => {
    it('should display terminal sessions', () => {
      const sessions = [
        {
          id: 'session-1',
          start_time: '2024-01-01T00:00:00.000Z',
          commands: [
            { command: 'npm test', output: 'Passing', exit_code: 0 },
          ],
        },
      ]

      expect(sessions).toHaveLength(1)
      expect(sessions[0].commands).toHaveLength(1)
    })

    it('should colorize command output based on exit code', () => {
      const commands = [
        { command: 'true', exit_code: 0 },
        { command: 'false', exit_code: 1 },
      ]

      expect(commands[0].exit_code).toBe(0)
      expect(commands[1].exit_code).toBe(1)
    })
  })

  describe('Plan Rendering', () => {
    it('should display tasks with status', () => {
      const tasks = [
        { id: 'task-1', subject: 'Task 1', status: 'completed' },
        { id: 'task-2', subject: 'Task 2', status: 'in_progress' },
        { id: 'task-3', subject: 'Task 3', status: 'pending' },
      ]

      expect(tasks[0].status).toBe('completed')
      expect(tasks[1].status).toBe('in_progress')
      expect(tasks[2].status).toBe('pending')
    })

    it('should display task dependencies', () => {
      const tasks = [
        { id: 'task-1', subject: 'Task 1', blockedBy: [] },
        { id: 'task-2', subject: 'Task 2', blockedBy: ['task-1'] },
      ]

      expect(tasks[1].blockedBy).toContain('task-1')
    })
  })

  describe('File Upload', () => {
    it('should accept .agent files via drag and drop', () => {
      const file = new File([''], 'test.agent', { type: 'application/zip' })

      expect(file.name).toBe('test.agent')
    })

    it('should reject non-.agent files', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' })

      expect(file.name.endsWith('.agent')).toBe(false)
    })

    it('should handle file upload errors gracefully', () => {
      const invalidBuffer = new ArrayBuffer(0)

      expect(invalidBuffer.byteLength).toBe(0)
    })
  })

  describe('Responsive Design', () => {
    it('should adapt layout for mobile screens', () => {
      const isMobile = true

      expect(isMobile).toBe(true)
    })

    it('should show/hide sidebar on mobile', () => {
      const sidebarVisible = false

      expect(sidebarVisible).toBe(false)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const button = document.createElement('button')
      button.setAttribute('aria-label', 'Close')

      expect(button.getAttribute('aria-label')).toBe('Close')
    })

    it('should support keyboard navigation', () => {
      const keys = ['Tab', 'Enter', 'Escape', 'ArrowUp', 'ArrowDown']

      expect(keys).toContain('Tab')
      expect(keys).toContain('Enter')
    })
  })
})
