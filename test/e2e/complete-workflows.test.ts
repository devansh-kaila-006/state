/**
 * End-to-End tests for State (.agent) format
 * Tests complete workflows across all components
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AgentFile } from '@state/format'
import * as fs from 'fs/promises'
import * as path from 'path'
import JSZip from 'jszip'

describe('E2E Tests: Complete Workflows', () => {
  const testDir = path.join(process.cwd(), 'test-e2e-temp')

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true })
  })

  describe('Workflow: Import → View → Export', () => {
    it('should complete full workflow: import from text, view, export to markdown', async () => {
      // Step 1: Import from text
      const textContent = `**User:** How do I create a React component?

**Assistant:** Here's a simple React component:

\`\`\`typescript
interface Props {
  title: string
}

export function MyComponent({ title }: Props) {
  return <div>{title}</div>
}
\`\`\`

**User:** Thanks! How do I use it?

**Assistant:** Import and use it like this:

\`\`\`typescript
import { MyComponent } from './MyComponent'

function App() {
  return <MyComponent title="Hello" />
}
\`\`\``

      // Parse the text (simulating importer)
      const messages = [
        {
          id: 'msg-1',
          role: 'user' as const,
          content: 'How do I create a React component?',
          timestamp: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'msg-2',
          role: 'assistant' as const,
          content: `Here's a simple React component:\n\n\`\`\`typescript\ninterface Props {\n  title: string\n}\n\nexport function MyComponent({ title }: Props) {\n  return <div>{title}</div>\n}\n\`\`\``,
          timestamp: '2024-01-01T00:00:01.000Z',
        },
        {
          id: 'msg-3',
          role: 'user' as const,
          content: 'Thanks! How do I use it?',
          timestamp: '2024-01-01T00:00:02.000Z',
        },
        {
          id: 'msg-4',
          role: 'assistant' as const,
          content: `Import and use it like this:\n\n\`\`\`typescript\nimport { MyComponent } from './MyComponent'\n\nfunction App() {\n  return <MyComponent title="Hello" />\n}\n\`\`\``,
          timestamp: '2024-01-01T00:00:03.000Z',
        },
      ]

      // Step 2: Create .agent file
      const agentFile = await AgentFile.create({
        metadata: {
          title: 'React Component Help',
          description: 'How to create and use a React component',
          language: 'TypeScript',
        },
        sourceTool: {
          name: '@state/importer-manual',
          version: '0.1.0',
        },
      })

      await agentFile.addConversation(messages)

      // Step 3: Verify file was created
      const buffer = await agentFile.saveToBuffer()
      expect(buffer.byteLength).toBeGreaterThan(0)

      // Step 4: Load the file (viewing)
      const loadedFile = await AgentFile.load(buffer)
      const manifest = loadedFile.getManifest()
      expect(manifest.metadata?.title).toBe('React Component Help')

      const conversation = loadedFile.getConversation()
      expect(conversation.messages).toHaveLength(4)

      // Step 5: Export to markdown
      const markdownOutput = `# ${manifest.metadata?.title}\n\n${
        manifest.metadata?.description || ''
      }\n\n## Conversation\n\n${conversation.messages
        .map(msg => `### ${msg.role}\n\n${msg.content}\n\n`)
        .join('')}`

      expect(markdownOutput).toContain('# React Component Help')
      expect(markdownOutput).toContain('### user')
      expect(markdownOutput).toContain('### assistant')
      expect(markdownOutput).toContain('How do I create a React component?')
      expect(markdownOutput).toContain('interface Props')
    })
  })

  describe('Workflow: Import with Semantic Map', () => {
    it('should create file with semantic map data', async () => {
      const agentFile = await AgentFile.create({
        metadata: {
          title: 'Project with Semantic Map',
          language: 'TypeScript',
        },
        sourceTool: {
          name: '@state/importer-claude',
          version: '0.1.0',
        },
      })

      // Add conversation
      await agentFile.addConversation([
        {
          id: 'msg-1',
          role: 'user',
          content: 'What files are in this project?',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'The project has 15 TypeScript files totaling 2,345 lines of code.',
          timestamp: new Date().toISOString(),
        },
      ])

      // Add semantic map
      await agentFile.addSemanticMap({
        files: [
          {
            path: 'src/index.ts',
            language: 'TypeScript',
            size: 1024,
            line_count: 45,
            last_modified: '2024-01-01T00:00:00.000Z',
          },
          {
            path: 'src/components/App.tsx',
            language: 'TypeScript',
            size: 2048,
            line_count: 89,
            last_modified: '2024-01-01T00:00:00.000Z',
          },
          {
            path: 'package.json',
            language: 'JSON',
            size: 512,
            line_count: 25,
            last_modified: '2024-01-01T00:00:00.000Z',
          },
        ],
        languages: {
          TypeScript: {
            files: 2,
            lines: 134,
            percentage: 84,
          },
          JSON: {
            files: 1,
            lines: 25,
            percentage: 16,
          },
        },
        dependencies: [
          {
            name: 'react',
            version: '^18.2.0',
            type: 'dependencies',
          },
          {
            name: 'typescript',
            version: '^5.0.0',
            type: 'devDependencies',
          },
        ],
      })

      const buffer = await agentFile.saveToBuffer()

      // Verify semantic map is included
      const zip = await JSZip.loadAsync(buffer)
      const semanticMapFile = zip.file('semantic-map/index.json')
      expect(semanticMapFile).toBeDefined()

      const semanticMapContent = await semanticMapFile!.async('string')
      const semanticMap = JSON.parse(semanticMapContent)
      expect(semanticMap.files).toHaveLength(3)
      expect(semanticMap.languages.TypeScript.files).toBe(2)
    })
  })

  describe('Workflow: Import with Terminal History', () => {
    it('should create file with terminal sessions', async () => {
      const agentFile = await AgentFile.create({
        metadata: {
          title: 'Session with Terminal',
          language: 'TypeScript',
        },
        sourceTool: {
          name: '@state/importer-claude',
          version: '0.1.0',
        },
      })

      await agentFile.addConversation([
        {
          id: 'msg-1',
          role: 'user',
          content: 'Run the tests',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Running tests...',
          timestamp: new Date().toISOString(),
        },
      ])

      // Add terminal history
      await agentFile.addTerminalSession({
        id: 'session-1',
        start_time: '2024-01-01T00:00:00.000Z',
        end_time: '2024-01-01T00:00:15.000Z',
        working_directory: '/home/user/project',
        environment: {
          SHELL: '/bin/bash',
          NODE_VERSION: 'v20.0.0',
        },
        commands: [
          {
            command: 'npm test',
            output: 'PASS src/App.test.tsx\nPASS src/utils.test.ts\n\nTests: 2 passed, 2 total',
            exit_code: 0,
            timestamp: '2024-01-01T00:00:01.000Z',
            duration_ms: 2345,
          },
          {
            command: 'npm run lint',
            output: 'No linting errors found.',
            exit_code: 0,
            timestamp: '2024-01-01T00:00:05.000Z',
            duration_ms: 892,
          },
        ],
      })

      const buffer = await agentFile.saveToBuffer()

      // Verify terminal data is included
      const zip = await JSZip.loadAsync(buffer)
      const terminalFile = zip.file('terminal/sessions.json')
      expect(terminalFile).toBeDefined()

      const terminalContent = await terminalFile!.async('string')
      const sessions = JSON.parse(terminalContent)
      expect(sessions).toHaveLength(1)
      expect(sessions[0].commands).toHaveLength(2)
      expect(sessions[0].commands[0].command).toBe('npm test')
    })
  })

  describe('Workflow: Import with Future Plan', () => {
    it('should create file with plan data', async () => {
      const agentFile = await AgentFile.create({
        metadata: {
          title: 'Project with Plan',
          language: 'TypeScript',
        },
        sourceTool: {
          name: '@state/importer-claude',
          version: '0.1.0',
        },
      })

      await agentFile.addConversation([
        {
          id: 'msg-1',
          role: 'user',
          content: 'What are the next steps?',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Here is the plan for completing this feature.',
          timestamp: new Date().toISOString(),
        },
      ])

      // Add plan
      await agentFile.addPlan({
        title: 'Complete Feature Implementation',
        description: 'Implement the new feature with tests',
        status: 'in_progress',
        tasks: [
          {
            id: 'task-1',
            subject: 'Set up project structure',
            description: 'Create necessary directories and files',
            status: 'completed',
            priority: 'high',
            tags: ['setup', 'infrastructure'],
          },
          {
            id: 'task-2',
            subject: 'Implement core functionality',
            description: 'Write the main feature code',
            status: 'in_progress',
            priority: 'high',
            tags: ['feature', 'implementation'],
            blockedBy: ['task-1'],
          },
          {
            id: 'task-3',
            subject: 'Add tests',
            description: 'Write unit and integration tests',
            status: 'pending',
            priority: 'medium',
            tags: ['testing'],
            blockedBy: ['task-2'],
          },
        ],
      })

      const buffer = await agentFile.saveToBuffer()

      // Verify plan is included
      const zip = await JSZip.loadAsync(buffer)
      const planFile = zip.file('plan/index.json')
      expect(planFile).toBeDefined()

      const planContent = await planFile!.async('string')
      const plan = JSON.parse(planContent)
      expect(plan.tasks).toHaveLength(3)
      expect(plan.tasks[0].status).toBe('completed')
      expect(plan.tasks[1].status).toBe('in_progress')
      expect(plan.tasks[1].blockedBy).toContain('task-1')
    })
  })

  describe('Workflow: Complete File with All Sections', () => {
    it('should create comprehensive .agent file with all data', async () => {
      const agentFile = await AgentFile.create({
        metadata: {
          title: 'Complete Project Export',
          description: 'Full export with conversations, semantic map, terminal, and plan',
          language: 'TypeScript',
          tags: ['react', 'typescript', 'testing'],
        },
        sourceTool: {
          name: '@state/importer-claude',
          version: '0.1.0',
        },
      })

      // Add conversation
      await agentFile.addConversation([
        {
          id: 'msg-1',
          role: 'user',
          content: 'Export this project',
          timestamp: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'I will create a comprehensive export.',
          timestamp: '2024-01-01T00:00:01.000Z',
        },
      ])

      // Add semantic map
      await agentFile.addSemanticMap({
        files: [
          {
            path: 'src/App.tsx',
            language: 'TypeScript',
            size: 2048,
            line_count: 89,
            last_modified: '2024-01-01T00:00:00.000Z',
          },
        ],
        languages: {
          TypeScript: { files: 1, lines: 89, percentage: 100 },
        },
        dependencies: [
          { name: 'react', version: '^18.2.0', type: 'dependencies' },
        ],
      })

      // Add terminal session
      await agentFile.addTerminalSession({
        id: 'session-1',
        start_time: '2024-01-01T00:00:00.000Z',
        end_time: '2024-01-01T00:00:05.000Z',
        working_directory: '/project',
        commands: [
          {
            command: 'npm run build',
            output: 'Build successful',
            exit_code: 0,
            timestamp: '2024-01-01T00:00:01.000Z',
          },
        ],
      })

      // Add plan
      await agentFile.addPlan({
        title: 'Future Work',
        description: 'Planned improvements',
        status: 'pending',
        tasks: [
          {
            id: 'task-1',
            subject: 'Add more features',
            description: 'Implement additional functionality',
            status: 'pending',
            priority: 'medium',
            tags: ['enhancement'],
          },
        ],
      })

      const buffer = await agentFile.saveToBuffer()

      // Verify all sections are present
      const zip = await JSZip.loadAsync(buffer)

      expect(zip.file('manifest.json')).toBeDefined()
      expect(zip.file('conversations/messages.json')).toBeDefined()
      expect(zip.file('semantic-map/index.json')).toBeDefined()
      expect(zip.file('terminal/sessions.json')).toBeDefined()
      expect(zip.file('plan/index.json')).toBeDefined()

      // Load and verify
      const loadedFile = await AgentFile.load(buffer)
      const manifest = loadedFile.getManifest()
      expect(manifest.metadata?.title).toBe('Complete Project Export')

      const conversation = loadedFile.getConversation()
      expect(conversation.messages).toHaveLength(2)

      const semanticMap = loadedFile.getSemanticMap()
      expect(semanticMap.files).toHaveLength(1)

      const terminal = loadedFile.getTerminal()
      expect(terminal.sessions).toHaveLength(1)

      const plan = loadedFile.getPlan()
      expect(plan.tasks).toHaveLength(1)
    })
  })

  describe('Workflow: Encryption and Decryption', () => {
    it('should encrypt and decrypt .agent file', async () => {
      const agentFile = await AgentFile.create({
        metadata: {
          title: 'Secret Project',
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
          content: 'This is confidential information',
          timestamp: new Date().toISOString(),
        },
      ])

      // Encrypt with password
      const password = 'secure-password-123'
      const encryptedBuffer = await agentFile.saveToBuffer({ password })

      // Verify encrypted file is different
      const unencryptedBuffer = await agentFile.saveToBuffer()
      expect(encryptedBuffer.equals(unencryptedBuffer)).toBe(false)

      // Decrypt and verify
      const { decrypt } = await import('@state/format')
      const decryptedBuffer = decrypt(
        { data: encryptedBuffer, salt: Buffer.alloc(16), iv: Buffer.alloc(12) },
        password
      )

      expect(decryptedBuffer).toBeDefined()
    })
  })

  describe('Workflow: Large File Performance', () => {
    it('should handle file with many messages efficiently', async () => {
      const agentFile = await AgentFile.create({
        metadata: {
          title: 'Large Conversation',
          language: 'English',
        },
        sourceTool: {
          name: 'test',
          version: '1.0.0',
        },
      })

      // Add 1000 messages
      const messages = []
      for (let i = 0; i < 1000; i++) {
        messages.push({
          id: `msg-${i}`,
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message number ${i}`,
          timestamp: new Date().toISOString(),
        })
      }

      const start = Date.now()
      await agentFile.addConversation(messages)
      const buffer = await agentFile.saveToBuffer()
      const end = Date.now()

      const duration = end - start

      // Should complete in reasonable time
      expect(duration).toBeLessThan(5000) // <5s

      // Verify loading is also fast
      const loadStart = Date.now()
      const loadedFile = await AgentFile.load(buffer)
      const conversation = loadedFile.getConversation()
      const loadEnd = Date.now()

      expect(conversation.messages).toHaveLength(1000)
      expect(loadEnd - loadStart).toBeLessThan(2000) // <2s
    })
  })

  describe('Workflow: Cross-Platform Compatibility', () => {
    it('should create files compatible across platforms', async () => {
      const agentFile = await AgentFile.create({
        metadata: {
          title: 'Cross-Platform Test',
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
          content: 'Test message with Windows path C:\\Users\\test',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Test message with Unix path /home/user/test',
          timestamp: new Date().toISOString(),
        },
      ])

      const buffer = await agentFile.saveToBuffer()

      // File should be loadable regardless of platform
      const loadedFile = await AgentFile.load(buffer)
      const conversation = loadedFile.getConversation()

      expect(conversation.messages).toHaveLength(2)
      expect(conversation.messages[0].content).toContain('C:\\Users\\test')
      expect(conversation.messages[1].content).toContain('/home/user/test')
    })
  })

  describe('Workflow: Error Recovery', () => {
    it('should handle and recover from various error conditions', async () => {
      // Test 1: Empty conversation
      const agentFile1 = await AgentFile.create({
        metadata: { title: 'Empty Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })
      await agentFile1.addConversation([])
      const buffer1 = await agentFile1.saveToBuffer()
      expect(buffer1.byteLength).toBeGreaterThan(0)

      // Test 2: Very long message
      const agentFile2 = await AgentFile.create({
        metadata: { title: 'Long Message Test' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })
      await agentFile2.addConversation([
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'A'.repeat(100000), // 100KB message
          timestamp: new Date().toISOString(),
        },
      ])
      const buffer2 = await agentFile2.saveToBuffer()
      expect(buffer2.byteLength).toBeGreaterThan(0)

      // Test 3: Special characters
      const agentFile3 = await AgentFile.create({
        metadata: { title: 'Special Chars 测试 🎉' },
        sourceTool: { name: 'test', version: '1.0.0' },
      })
      await agentFile3.addConversation([
        {
          id: 'msg-1',
          role: 'user',
          content: 'Test with emojis 🚀 and unicode 中文',
          timestamp: new Date().toISOString(),
        },
      ])
      const buffer3 = await agentFile3.saveToBuffer()

      const loadedFile3 = await AgentFile.load(buffer3)
      const manifest3 = loadedFile3.getManifest()
      expect(manifest3.metadata?.title).toContain('测试')
    })
  })
})
