/**
 * Test data generator
 * Creates realistic .agent files for testing
 */

import { AgentFile } from '@state/format'
import * as fs from 'fs/promises'
import * as path from 'path'

export interface TestDataOptions {
  messageCount?: number
  includeSemanticMap?: boolean
  includeTerminal?: boolean
  includePlan?: boolean
  language?: string
}

/**
 * Generate a realistic test .agent file
 */
export async function generateTestAgentFile(
  title: string,
  options: TestDataOptions = {}
): Promise<Buffer> {
  const {
    messageCount = 10,
    includeSemanticMap = true,
    includeTerminal = true,
    includePlan = true,
    language = 'TypeScript',
  } = options

  const agentFile = await AgentFile.create({
    metadata: {
      title,
      description: `Test conversation about ${title}`,
      language,
      tags: ['test', 'generated'],
    },
    sourceTool: {
      name: '@state/test-generator',
      version: '0.1.0',
    },
  })

  // Generate conversation
  const messages = []
  for (let i = 0; i < messageCount; i++) {
    const isUser = i % 2 === 0
    messages.push({
      id: `msg-${i}`,
      role: isUser ? ('user' as const) : ('assistant' as const),
      content: generateMessageContent(isUser, i),
      timestamp: new Date(Date.now() - (messageCount - i) * 60000).toISOString(),
    })
  }

  await agentFile.addConversation(messages)

  // Add semantic map if requested
  if (includeSemanticMap) {
    await agentFile.addSemanticMap({
      files: generateFileList(15),
      languages: {
        TypeScript: { files: 10, lines: 500, percentage: 70 },
        JavaScript: { files: 3, lines: 150, percentage: 20 },
        CSS: { files: 2, lines: 80, percentage: 10 },
      },
      dependencies: [
        { name: 'react', version: '^18.2.0', type: 'dependencies' },
        { name: 'typescript', version: '^5.0.0', type: 'devDependencies' },
        { name: 'vitest', version: '^1.0.0', type: 'devDependencies' },
      ],
    })
  }

  // Add terminal session if requested
  if (includeTerminal) {
    await agentFile.addTerminalSession({
      id: 'session-1',
      start_time: new Date(Date.now() - 300000).toISOString(),
      end_time: new Date(Date.now() - 60000).toISOString(),
      working_directory: '/home/user/test-project',
      environment: {
        SHELL: '/bin/bash',
        NODE_VERSION: 'v20.0.0',
        LANG: 'en_US.UTF-8',
      },
      commands: generateTerminalCommands(),
    })
  }

  // Add plan if requested
  if (includePlan) {
    await agentFile.addPlan({
      title: `Complete ${title}`,
      description: 'Implementation plan for the feature',
      status: 'in_progress',
      tasks: generateTasks(),
    })
  }

  return agentFile.saveToBuffer()
}

/**
 * Generate realistic message content
 */
function generateMessageContent(isUser: boolean, index: number): string {
  if (isUser) {
    const userQuestions = [
      'How do I implement this feature?',
      'Can you help me debug this error?',
      'What is the best way to structure this code?',
      'How can I optimize this function?',
      'What dependencies do I need?',
      'Can you write tests for this?',
      'How do I deploy this application?',
      'What is the error in this code?',
      'Can you explain this concept?',
      'How do I fix this bug?',
    ]
    return userQuestions[index % userQuestions.length]
  } else {
    const assistantResponses = [
      `Here's how you can implement this feature:\n\n\`\`\`typescript\nfunction example() {\n  // Implementation\n}\n\`\`\``,
      `The error is occurring because:\n\n1. Issue one\n2. Issue two\n\nTo fix it, you need to:\n\`\`\`typescript\nconst solution = "fixed"\n\`\`\``,
      `The best way to structure this code is:\n\n- Separate concerns\n- Use modules\n- Follow SOLID principles`,
      `To optimize this function, consider:\n\n1. Memoization\n2. Caching\n3. Algorithmic improvements`,
      `You need these dependencies:\n\n\`\`\`json\n{\n  "dependencies": {\n    "package": "^1.0.0"\n  }\n}\n\`\`\``,
      `Here are the tests:\n\n\`\`\`typescript\ndescribe('test', () => {\n  it('should work', () => {\n    expect(true).toBe(true)\n  })\n})\n\`\`\``,
      `To deploy:\n\n1. Build the project\n2. Run tests\n3. Deploy to production`,
      `The error is a TypeError. Check your type definitions.`,
      `This concept works by:\n\n- First step\n- Second step\n- Third step`,
      `The bug is on line 42. Change:\n\`\`\`typescript\nconst x = 1\n\`\`\`\nto:\n\`\`\`typescript\nconst x = 2\n\`\`\``,
    ]
    return assistantResponses[index % assistantResponses.length]
  }
}

/**
 * Generate a list of files for semantic map
 */
function generateFileList(count: number) {
  const files = []
  const paths = [
    'src/index.ts',
    'src/App.tsx',
    'src/components/Header.tsx',
    'src/components/Footer.tsx',
    'src/utils/helpers.ts',
    'src/api/client.ts',
    'src/hooks/useData.ts',
    'src/types/index.ts',
    'tests/App.test.tsx',
    'tests/utils.test.ts',
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'README.md',
    '.gitignore',
  ]

  for (let i = 0; i < count; i++) {
    const filePath = paths[i % paths.length]
    const ext = path.extname(filePath)
    let language = 'text'

    switch (ext) {
      case '.ts':
      case '.tsx':
        language = 'TypeScript'
        break
      case '.js':
      case '.jsx':
        language = 'JavaScript'
        break
      case '.json':
        language = 'JSON'
        break
      case '.css':
        language = 'CSS'
        break
      case '.md':
        language = 'Markdown'
        break
    }

    files.push({
      path: filePath,
      language,
      size: Math.floor(Math.random() * 5000) + 500,
      line_count: Math.floor(Math.random() * 200) + 20,
      last_modified: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    })
  }

  return files
}

/**
 * Generate terminal commands
 */
function generateTerminalCommands() {
  return [
    {
      command: 'npm install',
      output: 'added 1423 packages in 32s',
      exit_code: 0,
      timestamp: new Date(Date.now() - 250000).toISOString(),
      duration_ms: 32000,
    },
    {
      command: 'npm run dev',
      output: '  VITE v5.0.0  ready in 234 ms\n\n  ➜  Local:   http://localhost:5173/\n  ➜  Network: use --host to expose',
      exit_code: 0,
      timestamp: new Date(Date.now() - 200000).toISOString(),
      duration_ms: 234,
    },
    {
      command: 'npm run test',
      output: 'PASS src/App.test.tsx\nPASS src/utils.test.ts\n\n Test Files  2 passed (2)\n     Tests  15 passed (15)',
      exit_code: 0,
      timestamp: new Date(Date.now() - 150000).toISOString(),
      duration_ms: 5432,
    },
    {
      command: 'npm run build',
      output: 'dist/index.html                   0.46 kB\n/dist/assets/index-abc123.css      12.34 kB\n/dist/assets/index-def456.js     145.67 kB\n\nbuild in 3.45s',
      exit_code: 0,
      timestamp: new Date(Date.now() - 100000).toISOString(),
      duration_ms: 3450,
    },
  ]
}

/**
 * Generate tasks for plan
 */
function generateTasks() {
  return [
    {
      id: 'task-1',
      subject: 'Set up project structure',
      description: 'Create directories and initialize configuration files',
      status: 'completed',
      priority: 'high' as const,
      tags: ['setup', 'infrastructure'],
    },
    {
      id: 'task-2',
      subject: 'Implement core features',
      description: 'Build the main functionality',
      status: 'in_progress',
      priority: 'high' as const,
      tags: ['feature', 'implementation'],
      blockedBy: ['task-1'],
    },
    {
      id: 'task-3',
      subject: 'Add tests',
      description: 'Write unit and integration tests',
      status: 'pending',
      priority: 'medium' as const,
      tags: ['testing'],
      blockedBy: ['task-2'],
    },
    {
      id: 'task-4',
      subject: 'Documentation',
      description: 'Write README and API documentation',
      status: 'pending',
      priority: 'low' as const,
      tags: ['docs'],
      blockedBy: ['task-2'],
    },
  ]
}

/**
 * Generate multiple test files and save to directory
 */
export async function generateTestCorpus(
  outputDir: string,
  count: number = 10
): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true })

  const titles = [
    'React Component Development',
    'API Integration',
    'Database Schema Design',
    'Authentication System',
    'Testing Strategy',
    'Performance Optimization',
    'Deployment Pipeline',
    'Error Handling',
    'State Management',
    'UI/UX Improvements',
  ]

  for (let i = 0; i < count; i++) {
    const title = titles[i % titles.length]
    const buffer = await generateTestAgentFile(title, {
      messageCount: Math.floor(Math.random() * 20) + 5,
      includeSemanticMap: Math.random() > 0.2,
      includeTerminal: Math.random() > 0.3,
      includePlan: Math.random() > 0.4,
    })

    const fileName = `${i + 1}-${title.toLowerCase().replace(/\s+/g, '-')}.agent`
    const filePath = path.join(outputDir, fileName)

    await fs.writeFile(filePath, Buffer.from(buffer))
    console.log(`Generated: ${fileName}`)
  }
}

/**
 * Generate a large test file for performance testing
 */
export async function generateLargeTestFile(
  messageCount: number = 1000
): Promise<Buffer> {
  return generateTestAgentFile('Large Performance Test', {
    messageCount,
    includeSemanticMap: true,
    includeTerminal: false,
    includePlan: false,
  })
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2]
  const args = process.argv.slice(3)

  switch (command) {
    case 'corpus':
      const corpusDir = args[0] || './test-corpus'
      const corpusCount = parseInt(args[1]) || 10
      generateTestCorpus(corpusDir, corpusCount)
      break

    case 'large':
      const largeSize = parseInt(args[0]) || 1000
      generateLargeTestFile(largeSize).then(buffer => {
        console.log(`Generated large file with ${largeSize} messages`)
        console.log(`Size: ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB`)
      })
      break

    default:
      console.log('Usage:')
      console.log('  node test-data-generator.js corpus [dir] [count]')
      console.log('  node test-data-generator.js large [messageCount]')
  }
}
