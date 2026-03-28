/**
 * Additional coverage tests for AgentFile class
 * Tests edge cases, error handling, and advanced features
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AgentFile } from './AgentFile'
import * as fs from 'fs/promises'
import * as path from 'path'

describe('AgentFile - Coverage Tests', () => {
  const testDir = path.join(process.cwd(), 'test-temp-coverage')

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true })
  })

  describe('Edge Cases', () => {
    it('should handle very long titles', async () => {
      const longTitle = 'A'.repeat(10000)
      const agentFile = await AgentFile.create({
        metadata: { title: longTitle },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      const manifest = agentFile.getManifest()
      expect(manifest.metadata?.title).toBe(longTitle)
    })

    it('should handle special characters in metadata', async () => {
      const agentFile = await AgentFile.create({
        metadata: {
          title: 'Test with emojis 🎉 🚀 ⭐ and unicode 中文 عربي',
          description: 'Special chars: <>&"\'\\/\n\t\r',
          tags: ['tag-with-dash', 'tag_with_underscore', 'tag.with.dots'],
        },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      const manifest = agentFile.getManifest()
      expect(manifest.metadata?.title).toContain('🎉')
      expect(manifest.metadata?.tags).toEqual(['tag-with-dash', 'tag_with_underscore', 'tag.with.dots'])
    })

    it('should handle empty arrays in optional sections', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Empty Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      await agentFile.addSemanticMap({
        files: [],
        languages: {},
        dependencies: [],
      })

      const semanticMap = agentFile.getSemanticMap()
      expect(semanticMap.files).toHaveLength(0)
      expect(semanticMap.dependencies).toHaveLength(0)
    })

    it('should handle messages with empty content', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Empty Content Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      await agentFile.addConversation([
        { id: 'msg-1', role: 'user', content: '', timestamp: new Date().toISOString() },
        { id: 'msg-2', role: 'assistant', content: '   ', timestamp: new Date().toISOString() },
      ])

      const conversation = agentFile.getConversation()
      expect(conversation.messages).toHaveLength(2)
      expect(conversation.messages[0].content).toBe('')
    })

    it('should handle messages with only whitespace', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Whitespace Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      await agentFile.addConversation([
        { id: 'msg-1', role: 'user', content: '   \n\n\t   ', timestamp: new Date().toISOString() },
      ])

      const conversation = agentFile.getConversation()
      expect(conversation.messages[0].content).toBe('   \n\n\t   ')
    })

    it('should handle very long file paths in semantic map', async () => {
      const longPath = 'a'.repeat(200) + '/' + 'b'.repeat(200) + '.ts'

      const agentFile = await AgentFile.create({
        metadata: { title: 'Long Path Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      await agentFile.addSemanticMap({
        files: [
          {
            path: longPath,
            language: 'TypeScript',
            size: 1024,
            line_count: 50,
            last_modified: new Date().toISOString(),
          },
        ],
        languages: { TypeScript: { files: 1, lines: 50, percentage: 100 } },
        dependencies: [],
      })

      const semanticMap = agentFile.getSemanticMap()
      expect(semanticMap.files[0].path).toBe(longPath)
    })
  })

  describe('Message Content Variations', () => {
    it('should handle messages with newlines only', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Newlines Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      await agentFile.addConversation([
        { id: 'msg-1', role: 'user', content: '\n\n\n\n', timestamp: new Date().toISOString() },
      ])

      const conversation = agentFile.getConversation()
      expect(conversation.messages[0].content).toBe('\n\n\n\n')
    })

    it('should handle messages with mixed line endings', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Line Endings Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      await agentFile.addConversation([
        {
          id: 'msg-1',
          role: 'user',
          content: 'Line1\nLine2\r\nLine3\rLine4',
          timestamp: new Date().toISOString(),
        },
      ])

      const conversation = agentFile.getConversation()
      expect(conversation.messages[0].content).toContain('\n')
      expect(conversation.messages[0].content).toContain('\r\n')
    })

    it('should handle messages with null bytes', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Null Byte Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      await agentFile.addConversation([
        { id: 'msg-1', role: 'user', content: 'before\x00after', timestamp: new Date().toISOString() },
      ])

      const conversation = agentFile.getConversation()
      expect(conversation.messages[0].content).toContain('\x00')
    })
  })

  describe('Timestamp Edge Cases', () => {
    it('should handle ISO 8601 timestamps with timezone', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Timezone Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      const timestamps = [
        '2024-01-01T00:00:00.000Z',
        '2024-01-01T00:00:00.000+00:00',
        '2024-01-01T00:00:00.000-08:00',
        '2024-01-01T00:00:00.000+05:30',
      ]

      await agentFile.addConversation(
        timestamps.map((ts, i) => ({
          id: `msg-${i}`,
          role: 'user',
          content: `Message ${i}`,
          timestamp: ts,
        }))
      )

      const conversation = agentFile.getConversation()
      expect(conversation.messages).toHaveLength(4)
    })

    it('should handle timestamps with microseconds', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Microsecond Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      await agentFile.addConversation([
        {
          id: 'msg-1',
          role: 'user',
          content: 'Test',
          timestamp: '2024-01-01T00:00:00.123456Z',
        },
      ])

      const conversation = agentFile.getConversation()
      expect(conversation.messages[0].timestamp).toBe('2024-01-01T00:00:00.123456Z')
    })
  })

  describe('Semantic Map Variations', () => {
    it('should handle files with zero size', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Zero Size Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      await agentFile.addSemanticMap({
        files: [
          {
            path: 'empty.txt',
            language: 'text',
            size: 0,
            line_count: 0,
            last_modified: new Date().toISOString(),
          },
        ],
        languages: {},
        dependencies: [],
      })

      const semanticMap = agentFile.getSemanticMap()
      expect(semanticMap.files[0].size).toBe(0)
    })

    it('should handle very large file sizes', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Large Size Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      const largeSize = 10 * 1024 * 1024 * 1024 // 10GB

      await agentFile.addSemanticMap({
        files: [
          {
            path: 'huge.bin',
            language: 'binary',
            size: largeSize,
            line_count: 0,
            last_modified: new Date().toISOString(),
          },
        ],
        languages: {},
        dependencies: [],
      })

      const semanticMap = agentFile.getSemanticMap()
      expect(semanticMap.files[0].size).toBe(largeSize)
    })

    it('should handle unknown languages', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Unknown Language Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      await agentFile.addSemanticMap({
        files: [
          {
            path: 'file.xyz',
            language: 'Unknown',
            size: 1024,
            line_count: 50,
            last_modified: new Date().toISOString(),
          },
        ],
        languages: { Unknown: { files: 1, lines: 50, percentage: 100 } },
        dependencies: [],
      })

      const semanticMap = agentFile.getSemanticMap()
      expect(semanticMap.files[0].language).toBe('Unknown')
    })

    it('should handle dependencies without versions', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'No Version Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      await agentFile.addSemanticMap({
        files: [],
        languages: {},
        dependencies: [
          { name: 'local-package', version: '', type: 'dependencies' },
          { name: 'file:../local', version: 'file:../local', type: 'dependencies' },
        ],
      })

      const semanticMap = agentFile.getSemanticMap()
      expect(semanticMap.dependencies).toHaveLength(2)
      expect(semanticMap.dependencies[0].version).toBe('')
    })
  })

  describe('Terminal Session Variations', () => {
    it('should handle commands with no output', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'No Output Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      await agentFile.addTerminalSession({
        id: 'session-1',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        working_directory: '/test',
        commands: [
          {
            command: 'true',
            output: '',
            exit_code: 0,
            timestamp: new Date().toISOString(),
          },
        ],
      })

      const terminal = agentFile.getTerminal()
      expect(terminal.sessions[0].commands[0].output).toBe('')
    })

    it('should handle very long command output', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Long Output Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      const longOutput = 'A'.repeat(100000) // 100KB output

      await agentFile.addTerminalSession({
        id: 'session-1',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        working_directory: '/test',
        commands: [
          {
            command: 'cat large.log',
            output: longOutput,
            exit_code: 0,
            timestamp: new Date().toISOString(),
          },
        ],
      })

      const terminal = agentFile.getTerminal()
      expect(terminal.sessions[0].commands[0].output).toHaveLength(100000)
    })

    it('should handle non-zero exit codes', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Exit Code Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      const exitCodes = [1, 2, 127, 128, 255]

      for (const code of exitCodes) {
        await agentFile.addTerminalSession({
          id: `session-${code}`,
          start_time: new Date().toISOString(),
          end_time: new Date().toISOString(),
          working_directory: '/test',
          commands: [
            {
              command: `false ${code}`,
              output: `Error: exit code ${code}`,
              exit_code: code,
              timestamp: new Date().toISOString(),
            },
          ],
        })
      }

      const terminal = agentFile.getTerminal()
      expect(terminal.sessions).toHaveLength(exitCodes.length)
    })
  })

  describe('Plan Variations', () => {
    it('should handle tasks with no dependencies', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'No Dependencies Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      await agentFile.addPlan({
        title: 'Test Plan',
        description: 'Test',
        status: 'pending',
        tasks: [
          {
            id: 'task-1',
            subject: 'Independent task',
            description: 'No dependencies',
            status: 'pending',
            priority: 'medium',
            tags: [],
          },
        ],
      })

      const plan = agentFile.getPlan()
      expect(plan.tasks[0].blockedBy).toBeUndefined()
    })

    it('should handle circular dependencies', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Circular Deps Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      await agentFile.addPlan({
        title: 'Circular Plan',
        description: 'Test',
        status: 'pending',
        tasks: [
          {
            id: 'task-1',
            subject: 'Task 1',
            description: 'Test',
            status: 'pending',
            priority: 'medium',
            tags: [],
            blockedBy: ['task-2'],
          },
          {
            id: 'task-2',
            subject: 'Task 2',
            description: 'Test',
            status: 'pending',
            priority: 'medium',
            tags: [],
            blockedBy: ['task-1'],
          },
        ],
      })

      const plan = agentFile.getPlan()
      expect(plan.tasks[0].blockedBy).toContain('task-2')
      expect(plan.tasks[1].blockedBy).toContain('task-1')
    })

    it('should handle tasks with many tags', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Many Tags Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      const manyTags = Array.from({ length: 50 }, (_, i) => `tag-${i}`)

      await agentFile.addPlan({
        title: 'Tagged Plan',
        description: 'Test',
        status: 'pending',
        tasks: [
          {
            id: 'task-1',
            subject: 'Tagged Task',
            description: 'Test',
            status: 'pending',
            priority: 'medium',
            tags: manyTags,
          },
        ],
      })

      const plan = agentFile.getPlan()
      expect(plan.tasks[0].tags).toHaveLength(50)
    })

    it('should handle empty task lists', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Empty Tasks Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      await agentFile.addPlan({
        title: 'Empty Plan',
        description: 'No tasks',
        status: 'pending',
        tasks: [],
      })

      const plan = agentFile.getPlan()
      expect(plan.tasks).toHaveLength(0)
    })
  })

  describe('Source Tool Variations', () => {
    it('should handle custom source tools', async () => {
      const customTools = [
        { name: 'custom-tool', version: '1.0.0' },
        { name: 'another-tool', version: '2.3.4-beta' },
        { name: 'internal-tool', version: '0.0.1-dev' },
      ]

      for (const tool of customTools) {
        const agentFile = await AgentFile.create({
          metadata: { title: 'Custom Tool Test' },
          sourceTool: tool,
        })

        const manifest = agentFile.getManifest()
        expect(manifest.source_tool.name).toBe(tool.name)
        expect(manifest.source_tool.version).toBe(tool.version)
      }
    })
  })

  describe('File Operations', () => {
    it('should handle multiple save operations', async () => {
      const agentFile = await AgentFile.create({
        metadata: { title: 'Multiple Save Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      await agentFile.addConversation([
        { id: 'msg-1', role: 'user', content: 'Message 1', timestamp: new Date().toISOString() },
      ])

      const buffer1 = await agentFile.saveToBuffer()

      await agentFile.addConversation([
        { id: 'msg-2', role: 'assistant', content: 'Message 2', timestamp: new Date().toISOString() },
      ])

      const buffer2 = await agentFile.saveToBuffer()

      expect(buffer2.byteLength).toBeGreaterThan(buffer1.byteLength)

      // Load first buffer and verify
      const loaded1 = await AgentFile.load(buffer1)
      expect(loaded1.getConversation().messages).toHaveLength(1)

      // Load second buffer and verify
      const loaded2 = await AgentFile.load(buffer2)
      expect(loaded2.getConversation().messages).toHaveLength(2)
    })
  })

  describe('Round-Trip Tests', () => {
    it('should preserve data through save/load cycle', async () => {
      const originalFile = await AgentFile.create({
        metadata: {
          title: 'Round Trip Test',
          description: 'Testing data preservation',
          language: 'TypeScript',
          tags: ['test', 'round-trip'],
        },
        sourceTool: { name: 'test-tool', version: '1.0.0' },
      })

      await originalFile.addConversation([
        { id: 'msg-1', role: 'user', content: 'Hello 🎉', timestamp: '2024-01-01T00:00:00.000Z' },
        { id: 'msg-2', role: 'assistant', content: 'Hi there!', timestamp: '2024-01-01T00:00:01.000Z' },
      ])

      await originalFile.addSemanticMap({
        files: [
          {
            path: 'src/test.ts',
            language: 'TypeScript',
            size: 1024,
            line_count: 50,
            last_modified: '2024-01-01T00:00:00.000Z',
          },
        ],
        languages: { TypeScript: { files: 1, lines: 50, percentage: 100 } },
        dependencies: [{ name: 'react', version: '^18.0.0', type: 'dependencies' }],
      })

      await originalFile.addTerminalSession({
        id: 'session-1',
        start_time: '2024-01-01T00:00:00.000Z',
        end_time: '2024-01-01T00:00:10.000Z',
        working_directory: '/test',
        commands: [
          {
            command: 'npm test',
            output: 'PASS',
            exit_code: 0,
            timestamp: '2024-01-01T00:00:01.000Z',
          },
        ],
      })

      await originalFile.addPlan({
        title: 'Test Plan',
        description: 'Plan',
        status: 'pending',
        tasks: [
          {
            id: 'task-1',
            subject: 'Task 1',
            description: 'Description',
            status: 'pending',
            priority: 'medium',
            tags: ['test'],
          },
        ],
      })

      // Save and load
      const buffer = await originalFile.saveToBuffer()
      const loadedFile = await AgentFile.load(buffer)

      // Verify all data is preserved
      const originalManifest = originalFile.getManifest()
      const loadedManifest = loadedFile.getManifest()

      expect(loadedManifest.metadata).toEqual(originalManifest.metadata)
      expect(loadedManifest.source_tool).toEqual(originalManifest.source_tool)

      const originalConv = originalFile.getConversation()
      const loadedConv = loadedFile.getConversation()

      expect(loadedConv.messages).toEqual(originalConv.messages)

      const originalSemantic = originalFile.getSemanticMap()
      const loadedSemantic = loadedFile.getSemanticMap()

      expect(loadedSemantic.files).toEqual(originalSemantic.files)

      const originalTerminal = originalFile.getTerminal()
      const loadedTerminal = loadedFile.getTerminal()

      expect(loadedTerminal.sessions).toEqual(originalTerminal.sessions)

      const originalPlan = originalFile.getPlan()
      const loadedPlan = loadedFile.getPlan()

      expect(loadedPlan.tasks).toEqual(originalPlan.tasks)
    })
  })
})
