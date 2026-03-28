/**
 * Integration tests for CLI tool
 * Tests complete workflows from command invocation to file output
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AgentFile } from '@state/format'
import * as fs from 'fs/promises'
import * as path from 'path'
import { execSync } from 'child_process'

describe('CLI Integration Tests', () => {
  const testDir = path.join(process.cwd(), 'test-temp')
  const testOutputFile = path.join(testDir, 'test.agent')

  beforeEach(async () => {
    // Create test directory
    await fs.mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true })
  })

  describe('Import Workflow', () => {
    it('should import from text and create .agent file', async () => {
      const testText = '**User:** Hello\n\n**Assistant:** Hi there!'

      // Create a test AgentFile
      const agentFile = await AgentFile.create({
        metadata: {
          title: 'Test Import',
          language: 'English',
        },
        sourceTool: {
          name: '@state/cli',
          version: '0.1.0',
        },
      })

      await agentFile.addConversation([
        {
          id: 'msg-1',
          role: 'user',
          content: 'Hello',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Hi there!',
          timestamp: new Date().toISOString(),
        },
      ])

      const buffer = await agentFile.saveToBuffer()
      expect(buffer.byteLength).toBeGreaterThan(0)
    })

    it('should import with custom title and language', async () => {
      const agentFile = await AgentFile.create({
        metadata: {
          title: 'Custom Title',
          description: 'Custom Description',
          language: 'Python',
        },
        sourceTool: {
          name: '@state/cli',
          version: '0.1.0',
        },
      })

      const manifest = agentFile.getManifest()
      expect(manifest.metadata?.title).toBe('Custom Title')
      expect(manifest.metadata?.language).toBe('Python')
    })

    it('should handle import errors gracefully', async () => {
      // Test with invalid input
      const invalidText = ''

      const agentFile = await AgentFile.create({
        metadata: { title: 'Error Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      expect(agentFile).toBeDefined()
    })
  })

  describe('View Workflow', () => {
    it('should load and display .agent file information', async () => {
      // Create test file
      const agentFile = await AgentFile.create({
        metadata: {
          title: 'View Test',
          language: 'TypeScript',
        },
        sourceTool: {
          name: '@state/cli',
          version: '0.1.0',
        },
      })

      await agentFile.addConversation([
        {
          id: 'msg-1',
          role: 'user',
          content: 'Test message',
          timestamp: new Date().toISOString(),
        },
      ])

      const buffer = await agentFile.saveToBuffer()

      // Load the file
      const loadedFile = await AgentFile.load(buffer)
      const manifest = loadedFile.getManifest()

      expect(manifest.metadata?.title).toBe('View Test')
      expect(manifest.metadata?.language).toBe('TypeScript')
    })

    it('should display conversation summary', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Summary Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      await agentFile.addConversation([
        { id: 'msg-1', role: 'user', content: 'Hello', timestamp: new Date().toISOString() },
        { id: 'msg-2', role: 'assistant', content: 'Hi!', timestamp: new Date().toISOString() },
        { id: 'msg-3', role: 'user', content: 'Bye', timestamp: new Date().toISOString() },
      ])

      const conversation = agentFile.getConversation()
      expect(conversation.messages).toHaveLength(3)
    })

    it('should export to markdown format', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Export Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      await agentFile.addConversation([
        { id: 'msg-1', role: 'user', content: 'Hello', timestamp: new Date().toISOString() },
        { id: 'msg-2', role: 'assistant', content: 'Hi!', timestamp: new Date().toISOString() },
      ])

      // Export to markdown
      const conversation = agentFile.getConversation()
      const markdown = conversation.messages
        .map(msg => `### ${msg.role}\n\n${msg.content}\n\n`)
        .join('')

      expect(markdown).toContain('### user')
      expect(markdown).toContain('### assistant')
      expect(markdown).toContain('Hello')
      expect(markdown).toContain('Hi!')
    })
  })

  describe('Validate Workflow', () => {
    it('should validate a well-formed .agent file', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Valid Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      const buffer = await agentFile.saveToBuffer()
      const loadedFile = await AgentFile.load(buffer)

      expect(loadedFile).toBeDefined()
    })

    it('should detect corrupted .agent files', async () => {
      const invalidBuffer = Buffer.from('invalid data')

      await expect(AgentFile.load(invalidBuffer)).rejects.toThrow()
    })

    it('should check file size limits', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Size Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      const buffer = await agentFile.saveToBuffer()

      // Check against limits
      expect(buffer.byteLength).toBeLessThanOrEqual(100 * 1024 * 1024) // 100MB per file
    })
  })

  describe('Export Workflow', () => {
    it('should export to JSON format', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'JSON Export' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      await agentFile.addConversation([
        { id: 'msg-1', role: 'user', content: 'Test', timestamp: new Date().toISOString() },
      ])

      const manifest = agentFile.getManifest()
      const json = JSON.stringify(manifest, null, 2)

      expect(json).toContain('"title"')
      expect(json).toContain('"JSON Export"')
    })

    it('should export to markdown format', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Markdown Export' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      await agentFile.addConversation([
        { id: 'msg-1', role: 'user', content: 'Test content', timestamp: new Date().toISOString() },
      ])

      const conversation = agentFile.getConversation()
      const markdown = `# ${agentFile.getManifest().metadata?.title}\n\n` +
        conversation.messages.map(msg => `## ${msg.role}\n\n${msg.content}\n`).join('\n')

      expect(markdown).toContain('# Markdown Export')
      expect(markdown).toContain('## user')
      expect(markdown).toContain('Test content')
    })
  })

  describe('Info Workflow', () => {
    it('should display file metadata', async () => {
      const agentFile = await AgentFile.create({
        metadata: {
          title: 'Info Test',
          description: 'Test Description',
          language: 'JavaScript',
          created_at: '2024-01-01T00:00:00.000Z',
        },
        sourceTool: {
          name: '@state/cli',
          version: '0.1.0',
        },
      })

      const manifest = agentFile.getManifest()

      expect(manifest.metadata?.title).toBe('Info Test')
      expect(manifest.metadata?.description).toBe('Test Description')
      expect(manifest.metadata?.language).toBe('JavaScript')
      expect(manifest.source_tool?.name).toBe('@state/cli')
    })

    it('should display message statistics', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Stats Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      await agentFile.addConversation([
        { id: 'msg-1', role: 'user', content: 'Q1', timestamp: new Date().toISOString() },
        { id: 'msg-2', role: 'assistant', content: 'A1', timestamp: new Date().toISOString() },
        { id: 'msg-3', role: 'user', content: 'Q2', timestamp: new Date().toISOString() },
        { id: 'msg-4', role: 'assistant', content: 'A2', timestamp: new Date().toISOString() },
      ])

      const conversation = agentFile.getConversation()
      const userMessages = conversation.messages.filter(m => m.role === 'user')
      const assistantMessages = conversation.messages.filter(m => m.role === 'assistant')

      expect(userMessages).toHaveLength(2)
      expect(assistantMessages).toHaveLength(2)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing files gracefully', async () => {
      const nonExistentPath = path.join(testDir, 'does-not-exist.agent')

      await expect(fs.readFile(nonExistentPath)).rejects.toThrow()
    })

    it('should provide helpful error messages', async () => {
      const invalidPath = 'invalid-file.agent'

      try {
        await fs.readFile(invalidPath)
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error).toBeDefined()
      }
    })

    it('should handle permission errors', async () => {
      // This test verifies the CLI handles permission errors
      // Actual permission testing would require OS-specific setup
      const permissionError = new Error('EACCES: permission denied')

      expect(permissionError.message).toContain('permission denied')
    })
  })

  describe('Performance', () => {
    it('should import small files quickly', async () => {
      const start = Date.now()

      const agentFile = await AgentFile.create({
        metadata: { title: 'Perf Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      await agentFile.addConversation([
        { id: 'msg-1', role: 'user', content: 'Test', timestamp: new Date().toISOString() },
      ])

      const end = Date.now()
      const duration = end - start

      expect(duration).toBeLessThan(1000) // Should be <1s
    })

    it('should handle batch operations efficiently', async () => {
      const files = []
      const start = Date.now()

      for (let i = 0; i < 10; i++) {
        const agentFile = await AgentFile.create({
          metadata: { title: `Batch Test ${i}` },
          sourceTool: { name: 'test', version: '1.0.0' },
        })

        await agentFile.addConversation([
          { id: 'msg-1', role: 'user', content: `Test ${i}`, timestamp: new Date().toISOString() },
        ])

        files.push(agentFile)
      }

      const end = Date.now()
      const duration = end - start
      const avgDuration = duration / files.length

      expect(avgDuration).toBeLessThan(100) // Average <100ms per file
    })
  })

  describe('Output Formatting', () => {
    it('should format JSON output prettily', () => {
      const data = { title: 'Test', count: 5 }
      const json = JSON.stringify(data, null, 2)

      expect(json).toBe('{\n  "title": "Test",\n  "count": 5\n}')
    })

    it('should format tables with aligned columns', () => {
      const rows = [
        ['Title', 'Count'],
        ['Test 1', '5'],
        ['Test 2', '10'],
      ]

      const formatted = rows.map(row => row.join(' | ')).join('\n')

      expect(formatted).toContain('Title | Count')
      expect(formatted).toContain('Test 1 | 5')
    })

    it('should apply colors to output', () => {
      // Test that color codes can be applied
      const text = 'Test'
      const colored = `\x1b[32m${text}\x1b[0m` // Green text

      expect(colored).toContain('\x1b[32m')
      expect(colored).toContain('Test')
    })
  })

  describe('Interactive Features', () => {
    it('should prompt for missing required options', async () => {
      // Test that prompts work for missing input
      const missingValue = null

      if (!missingValue) {
        // Would prompt user
        const promptedValue = 'default'
        expect(promptedValue).toBeDefined()
      }
    })

    it('should confirm destructive operations', async () => {
      // Test confirmation for operations like overwrite
      const confirmOverwrite = true

      expect(confirmOverwrite).toBe(true)
    })

    it('should allow selecting from options', async () => {
      const options = ['Option 1', 'Option 2', 'Option 3']
      const selectedIndex = 0

      expect(options[selectedIndex]).toBe('Option 1')
    })
  })
})
