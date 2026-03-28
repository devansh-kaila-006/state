/**
 * Cross-platform validation tests for @state/format
 * Tests behavior across different platforms and environments
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AgentFile } from './AgentFile'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'

describe('Cross-Platform Tests', () => {
  const testDir = path.join(os.tmpdir(), 'state-cross-platform-test')

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true })
  })

  describe('File Path Handling', () => {
    it('should handle Windows-style paths', async () => {
      const windowsPaths = [
        'C:\\Users\\test\\file.ts',
        'D:\\Projects\\my-app\\src\\index.ts',
        '\\\\server\\share\\file.txt',
        'C:/mixed/slashes/file.ts',
      ]

      for (const filePath of windowsPaths) {
        const agentFile = await AgentFile.create({
          metadata: { title: 'Windows Path Test' },
          sourceTool: { name: 'test', version: '1.0.0' },
        })

        await agentFile.addSemanticMap({
          files: [
            {
              path: filePath,
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

        expect(loaded.getSemanticMap().files[0].path).toBe(filePath)
      }
    })

    it('should handle Unix-style paths', async () => {
      const unixPaths = [
        '/home/user/file.ts',
        '/usr/local/bin/script',
        '~/Documents/file.txt',
        './relative/path/file.ts',
        '../parent/file.ts',
        '../../deep/nest/file.ts',
      ]

      for (const filePath of unixPaths) {
        const agentFile = await AgentFile.create({
          metadata: { title: 'Unix Path Test' },
          sourceTool: { name: 'test', version: '1.0.0' },
        })

        await agentFile.addSemanticMap({
          files: [
            {
              path: filePath,
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

        expect(loaded.getSemanticMap().files[0].path).toBe(filePath)
      }
    })

    it('should handle paths with special characters', async () => {
      const specialPaths = [
        'file with spaces.ts',
        'file-with-dashes.ts',
        'file_with_underscores.ts',
        'file.with.dots.ts',
        'file(multiple).ts',
        'file[brackets].ts',
        'file{braces}.ts',
        'file\'single\'quote.ts',
        'file"double"quote.ts',
        'file`backtick`.ts',
      ]

      for (const filePath of specialPaths) {
        const agentFile = await AgentFile.create({
          metadata: { title: 'Special Path Test' },
          sourceTool: { name: 'test', version: '1.0.0' },
        })

        await agentFile.addSemanticMap({
          files: [
            {
              path: filePath,
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

        expect(loaded.getSemanticMap().files[0].path).toBe(filePath)
      }
    })

    it('should handle very long paths', async () => {
      // Windows has a 260 character path limit (MAX_PATH)
      // Unix systems typically allow much longer paths
      const segment = 'very-long-segment-name-'.repeat(10)
      const longPath = path.join(
        ...Array.from({ length: 10 }, () => segment)
      )

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
        languages: {},
        dependencies: [],
      })

      const buffer = await agentFile.saveToBuffer()
      const loaded = await AgentFile.load(buffer)

      expect(loaded.getSemanticMap().files[0].path).toBe(longPath)
    })
  })

  describe('Line Ending Handling', () => {
    it('should preserve CRLF line endings', async () => {
      const content = 'Line1\r\nLine2\r\nLine3'

      const agentFile = await AgentFile.create({
        metadata: { title: 'CRLF Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

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
    })

    it('should preserve LF line endings', async () => {
      const content = 'Line1\nLine2\nLine3'

      const agentFile = await AgentFile.create({
        metadata: { title: 'LF Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

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
    })

    it('should preserve CR line endings', async () => {
      const content = 'Line1\rLine2\rLine3'

      const agentFile = await AgentFile.create({
        metadata: { title: 'CR Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

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
    })

    it('should preserve mixed line endings', async () => {
      const content = 'Line1\nLine2\r\nLine3\rLine4\n\rLine5'

      const agentFile = await AgentFile.create({
        metadata: { title: 'Mixed Line Endings Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

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
    })
  })

  describe('Platform-Specific Features', () => {
    it('should handle platform-specific environment variables in terminal', async () => {
      const envVars = {
        Windows: {
          PATH: 'C:\\Windows\\system32;C:\\Windows',
          USERPROFILE: 'C:\\Users\\test',
          HOMEDRIVE: 'C:',
          HOMEPATH: '\\Users\\test',
        },
        Darwin: {
          PATH: '/usr/local/bin:/usr/bin:/bin',
          HOME: '/Users/test',
          USER: 'test',
        },
        Linux: {
          PATH: '/usr/local/bin:/usr/bin:/bin',
          HOME: '/home/test',
          USER: 'test',
        },
      }

      for (const [platform, vars] of Object.entries(envVars)) {
        const agentFile = await AgentFile.create({
          metadata: { title: `${platform} Env Test` },
          sourceTool: { name: 'test', version: '1.0.0' },
        })

        await agentFile.addTerminalSession({
          id: 'session-1',
          start_time: new Date().toISOString(),
          end_time: new Date().toISOString(),
          working_directory: platform === 'Windows' ? 'C:\\test' : '/tmp/test',
          environment: vars,
          commands: [],
        })

        const buffer = await agentFile.saveToBuffer()
        const loaded = await AgentFile.load(buffer)

        const session = loaded.getTerminal().sessions[0]
        expect(session.environment).toEqual(vars)
      }
    })

    it('should handle platform-specific working directories', async () => {
      const workingDirs = [
        'C:\\Projects\\my-app',
        'D:\\work\\project',
        '/home/user/projects/my-app',
        '/Users/username/work/project',
        '~/projects/my-app',
        './relative/path',
        '../parent/project',
      ]

      for (const dir of workingDirs) {
        const agentFile = await AgentFile.create({
          metadata: { title: 'Working Dir Test' },
          sourceTool: { name: 'test', version: '1.0.0' },
        })

        await agentFile.addTerminalSession({
          id: 'session-1',
          start_time: new Date().toISOString(),
          end_time: new Date().toISOString(),
          working_directory: dir,
          commands: [],
        })

        const buffer = await agentFile.saveToBuffer()
        const loaded = await AgentFile.load(buffer)

        expect(loaded.getTerminal().sessions[0].working_directory).toBe(dir)
      }
    })
  })

  describe('File System Operations', () => {
    it('should save and load files consistently across platforms', async () => {
      const testFile = path.join(testDir, 'cross-platform.agent')

      const agentFile = await AgentFile.create({
        metadata: {
          title: 'Cross-Platform Test',
          description: 'Testing file system operations',
          language: 'TypeScript',
          tags: ['cross-platform', 'fs'],
        },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      await agentFile.addConversation([
        {
          id: 'msg-1',
          role: 'user',
          content: 'Hello from cross-platform test!',
          timestamp: new Date().toISOString(),
        },
      ])

      await agentFile.addSemanticMap({
        files: [
          {
            path: os.platform() === 'win32' ? 'C:\\test\\file.ts' : '/tmp/test/file.ts',
            language: 'TypeScript',
            size: 1024,
            line_count: 50,
            last_modified: new Date().toISOString(),
          },
        ],
        languages: { TypeScript: { files: 1, lines: 50, percentage: 100 } },
        dependencies: [{ name: 'test', version: '1.0.0', type: 'dependencies' }],
      })

      await agentFile.addTerminalSession({
        id: 'session-1',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        working_directory: os.platform() === 'win32' ? 'C:\\test' : '/tmp/test',
        environment: {
          PATH: os.platform() === 'win32' ? 'C:\\Windows' : '/usr/bin',
          HOME: os.platform() === 'win32' ? 'C:\\Users\\test' : '/home/test',
        },
        commands: [
          {
            command: os.platform() === 'win32' ? 'dir' : 'ls',
            output: 'test output',
            exit_code: 0,
            timestamp: new Date().toISOString(),
          },
        ],
      })

      await agentFile.addPlan({
        title: 'Cross-Platform Plan',
        description: 'Test plan',
        status: 'pending',
        tasks: [
          {
            id: 'task-1',
            subject: 'Test task',
            description: 'Test',
            status: 'pending',
            priority: 'medium',
            tags: [],
          },
        ],
      })

      // Save to file
      const buffer = await agentFile.saveToBuffer()
      await fs.writeFile(testFile, Buffer.from(buffer))

      // Load from file
      const fileContent = await fs.readFile(testFile)
      const loaded = await AgentFile.load(Buffer.from(fileContent))

      // Verify all data
      const manifest = loaded.getManifest()
      expect(manifest.metadata?.title).toBe('Cross-Platform Test')

      const conversation = loaded.getConversation()
      expect(conversation.messages).toHaveLength(1)

      const semanticMap = loaded.getSemanticMap()
      expect(semanticMap.files).toHaveLength(1)

      const terminal = loaded.getTerminal()
      expect(terminal.sessions).toHaveLength(1)

      const plan = loaded.getPlan()
      expect(plan.tasks).toHaveLength(1)
    })
  })

  describe('Encoding Handling', () => {
    it('should handle UTF-8 encoded content', async () => {
      const utf8Content = 'UTF-8 Content: 你好 مرحبا שלום'

      const agentFile = await AgentFile.create({
        metadata: { title: 'UTF-8 Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      await agentFile.addConversation([
        {
          id: 'msg-1',
          role: 'user',
          content: utf8Content,
          timestamp: new Date().toISOString(),
        },
      ])

      const buffer = await agentFile.saveToBuffer()
      const loaded = await AgentFile.load(buffer)

      expect(loaded.getConversation().messages[0].content).toBe(utf8Content)
    })

    it('should handle emoji in metadata', async () => {
      const agentFile = await AgentFile.create({
        metadata: {
          title: 'Emoji Test 🎉 🚀 ⭐',
          tags: ['emoji', 'test', '🔥'],
        },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      const buffer = await agentFile.saveToBuffer()
      const loaded = await AgentFile.load(buffer)

      const metadata = loaded.getManifest().metadata
      expect(metadata?.title).toContain('🎉')
      expect(metadata?.tags).toContain('🔥')
    })
  })

  describe('Time Zone Handling', () => {
    it('should preserve timestamps across timezones', async () => {
      const timestamps = [
        '2024-01-01T00:00:00.000Z', // UTC
        '2024-01-01T00:00:00.000+08:00', // UTC+8
        '2024-01-01T00:00:00.000-05:00', // UTC-5
        '2024-01-01T00:00:00.000+00:00', // UTC±0
      ]

      for (const ts of timestamps) {
        const agentFile = await AgentFile.create({
          metadata: { title: 'Timezone Test' },
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

        const buffer = await agentFile.saveToBuffer()
        const loaded = await AgentFile.load(buffer)

        expect(loaded.getConversation().messages[0].timestamp).toBe(ts)
      }
    })
  })

  describe('Performance Characteristics', () => {
    it('should have consistent performance across platforms', async () => {
      const messageCount = 100
      const start = Date.now()

      const agentFile = await AgentFile.create({
        metadata: { title: 'Perf Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })

      const messages = Array.from({ length: messageCount }, (_, i) => ({
        id: `msg-${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
        timestamp: new Date().toISOString(),
      }))

      await agentFile.addConversation(messages)
      const buffer = await agentFile.saveToBuffer()
      const loaded = await AgentFile.load(buffer)

      const end = Date.now()
      const duration = end - start

      // Should complete in reasonable time on all platforms
      expect(duration).toBeLessThan(5000) // 5 seconds
      expect(loaded.getConversation().messages).toHaveLength(messageCount)
    })
  })
})
