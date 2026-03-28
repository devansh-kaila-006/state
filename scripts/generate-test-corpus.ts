#!/usr/bin/env tsx

/**
 * Generate comprehensive test corpus
 * Creates 50+ realistic .agent files for testing
 */

import { AgentFile } from '@state/format'
import * as fs from 'fs/promises'
import * as path from 'path'
import { randomInt } from 'crypto'

interface TestScenario {
  name: string
  messageCount: number
  includeSemanticMap: boolean
  includeTerminal: boolean
  includePlan: boolean
  language?: string
  description: string
}

const testScenarios: TestScenario[] = [
  // Basic scenarios
  {
    name: 'minimal-conversation',
    messageCount: 2,
    includeSemanticMap: false,
    includeTerminal: false,
    includePlan: false,
    description: 'Minimal valid .agent file with just conversation',
  },
  {
    name: 'empty-conversation',
    messageCount: 0,
    includeSemanticMap: false,
    includeTerminal: false,
    includePlan: false,
    description: 'Edge case: empty conversation',
  },
  {
    name: 'single-message',
    messageCount: 1,
    includeSemanticMap: false,
    includeTerminal: false,
    includePlan: false,
    description: 'Single user message',
  },

  // Small projects
  {
    name: 'react-hello-world',
    messageCount: 15,
    includeSemanticMap: true,
    includeTerminal: true,
    includePlan: false,
    language: 'TypeScript',
    description: 'Simple React Hello World project',
  },
  {
    name: 'python-script',
    messageCount: 12,
    includeSemanticMap: true,
    includeTerminal: true,
    includePlan: false,
    language: 'Python',
    description: 'Python script development',
  },
  {
    name: 'rust-cli-tool',
    messageCount: 18,
    includeSemanticMap: true,
    includeTerminal: true,
    includePlan: false,
    language: 'Rust',
    description: 'Rust CLI tool development',
  },

  // Medium projects
  {
    name: 'next-js-fullstack',
    messageCount: 45,
    includeSemanticMap: true,
    includeTerminal: true,
    includePlan: true,
    language: 'TypeScript',
    description: 'Full-stack Next.js application',
  },
  {
    name: 'django-api',
    messageCount: 38,
    includeSemanticMap: true,
    includeTerminal: true,
    includePlan: true,
    language: 'Python',
    description: 'Django REST API development',
  },
  {
    name: 'vue-dashboard',
    messageCount: 42,
    includeSemanticMap: true,
    includeTerminal: true,
    includePlan: true,
    language: 'TypeScript',
    description: 'Vue.js dashboard application',
  },

  // Large conversations
  {
    name: 'long-debugging-session',
    messageCount: 150,
    includeSemanticMap: true,
    includeTerminal: true,
    includePlan: false,
    description: 'Extended debugging session',
  },
  {
    name: 'code-review-conversation',
    messageCount: 85,
    includeSemanticMap: true,
    includeTerminal: false,
    includePlan: false,
    description: 'Code review discussion',
  },

  // Special characters and edge cases
  {
    name: 'unicode-content',
    messageCount: 10,
    includeSemanticMap: false,
    includeTerminal: false,
    includePlan: false,
    description: 'Unicode and emoji content: 🚀 中文 عربي',
  },
  {
    name: 'code-heavy',
    messageCount: 25,
    includeSemanticMap: false,
    includeTerminal: false,
    includePlan: false,
    description: 'Multiple code blocks in various languages',
  },
  {
    name: 'markdown-features',
    messageCount: 15,
    includeSemanticMap: false,
    includeTerminal: false,
    includePlan: false,
    description: 'Tables, lists, GFM features',
  },

  // Multiple languages
  {
    name: 'go-microservice',
    messageCount: 32,
    includeSemanticMap: true,
    includeTerminal: true,
    includePlan: true,
    language: 'Go',
    description: 'Go microservice development',
  },
  {
    name: 'java-spring-boot',
    messageCount: 40,
    includeSemanticMap: true,
    includeTerminal: true,
    includePlan: true,
    language: 'Java',
    description: 'Java Spring Boot application',
  },
  {
    name: 'csharp-api',
    messageCount: 35,
    includeSemanticMap: true,
    includeTerminal: true,
    includePlan: true,
    language: 'C#',
    description: 'C# ASP.NET Core API',
  },
  {
    name: 'php-laravel',
    messageCount: 30,
    includeSemanticMap: true,
    includeTerminal: true,
    includePlan: true,
    language: 'PHP',
    description: 'PHP Laravel application',
  },

  // With complete sections
  {
    name: 'complete-small-project',
    messageCount: 20,
    includeSemanticMap: true,
    includeTerminal: true,
    includePlan: true,
    language: 'TypeScript',
    description: 'Complete project with all sections',
  },
  {
    name: 'complete-medium-project',
    messageCount: 60,
    includeSemanticMap: true,
    includeTerminal: true,
    includePlan: true,
    language: 'Python',
    description: 'Complete medium project with all sections',
  },

  // Error handling scenarios
  {
    name: 'very-long-message',
    messageCount: 3,
    includeSemanticMap: false,
    includeTerminal: false,
    includePlan: false,
    description: 'Contains extremely long message (100KB+)',
  },
  {
    name: 'special-filenames',
    messageCount: 10,
    includeSemanticMap: true,
    includeTerminal: false,
    includePlan: false,
    description: 'Files with special chars in names',
  },

  // Real-world scenarios
  {
    name: 'api-integration',
    messageCount: 28,
    includeSemanticMap: true,
    includeTerminal: true,
    includePlan: false,
    language: 'TypeScript',
    description: 'Third-party API integration',
  },
  {
    name: 'database-migration',
    messageCount: 22,
    includeSemanticMap: true,
    includeTerminal: true,
    includePlan: false,
    language: 'SQL',
    description: 'Database schema migration',
  },
  {
    name: 'authentication-system',
    messageCount: 55,
    includeSemanticMap: true,
    includeTerminal: true,
    includePlan: true,
    language: 'TypeScript',
    description: 'JWT authentication implementation',
  },
  {
    name: 'testing-strategy',
    messageCount: 18,
    includeSemanticMap: true,
    includeTerminal: true,
    includePlan: false,
    language: 'TypeScript',
    description: 'Setting up testing infrastructure',
  },

  // Different conversation patterns
  {
    name: 'pair-programming',
    messageCount: 40,
    includeSemanticMap: true,
    includeTerminal: true,
    includePlan: false,
    description: 'Back-and-forth pair programming',
  },
  {
    name: 'tutorial-follow-along',
    messageCount: 25,
    includeSemanticMap: false,
    includeTerminal: false,
    includePlan: false,
    description: 'Following a tutorial step by step',
  },
  {
    name: 'troubleshooting-session',
    messageCount: 65,
    includeSemanticMap: true,
    includeTerminal: true,
    includePlan: false,
    description: 'Debugging and fixing issues',
  },

  // Multiple file types in semantic map
  {
    name: 'polyglot-project',
    messageCount: 35,
    includeSemanticMap: true,
    includeTerminal: true,
    includePlan: false,
    description: 'Project with TypeScript, Python, Rust, and SQL',
  },
  {
    name: 'frontend-multiple-languages',
    messageCount: 30,
    includeSemanticMap: true,
    includeTerminal: false,
    includePlan: false,
    description: 'React + TypeScript + CSS + HTML',
  },

  // Task/plan scenarios
  {
    name: 'feature-with-tasks',
    messageCount: 20,
    includeSemanticMap: false,
    includeTerminal: false,
    includePlan: true,
    description: 'Feature implementation with task breakdown',
  },
  {
    name: 'bug-fix-plan',
    messageCount: 15,
    includeSemanticMap: false,
    includeTerminal: false,
    includePlan: true,
    description: 'Bug fix with step-by-step plan',
  },
  {
    name: 'refactoring-roadmap',
    messageCount: 25,
    includeSemanticMap: true,
    includeTerminal: false,
    includePlan: true,
    description: 'Code refactoring with roadmap',
  },

  // Terminal-heavy scenarios
  {
    name: 'deployment-session',
    messageCount: 12,
    includeSemanticMap: false,
    includeTerminal: true,
    includePlan: false,
    description: 'Deployment with terminal commands',
  },
  {
    name: 'git-workflow',
    messageCount: 18,
    includeSemanticMap: false,
    includeTerminal: true,
    includePlan: false,
    description: 'Git workflow with commands',
  },

  // Large file scenarios
  {
    name: 'large-conversation-500',
    messageCount: 500,
    includeSemanticMap: false,
    includeTerminal: false,
    includePlan: false,
    description: 'Large conversation with 500 messages',
  },
  {
    name: 'large-conversation-1000',
    messageCount: 1000,
    includeSemanticMap: false,
    includeTerminal: false,
    includePlan: false,
    description: 'Very large conversation with 1000 messages',
  },

  // Industry-specific scenarios
  {
    name: 'ml-model-training',
    messageCount: 45,
    includeSemanticMap: true,
    includeTerminal: true,
    includePlan: true,
    language: 'Python',
    description: 'Machine learning model development',
  },
  {
    name: 'data-pipeline',
    messageCount: 38,
    includeSemanticMap: true,
    includeTerminal: true,
    includePlan: true,
    language: 'Python',
    description: 'ETL data pipeline construction',
  },
  {
    name: 'smart-contract',
    messageCount: 42,
    includeSemanticMap: true,
    includeTerminal: true,
    includePlan: true,
    language: 'Solidity',
    description: 'Solidity smart contract development',
  },
  {
    name: 'game-development',
    messageCount: 55,
    includeSemanticMap: true,
    includeTerminal: true,
    includePlan: true,
    language: 'C++',
    description: 'Game development with C++',
  },

  // Additional edge cases
  {
    name: 'rapid-fire-questions',
    messageCount: 30,
    includeSemanticMap: false,
    includeTerminal: false,
    includePlan: false,
    description: 'Many short messages in quick succession',
  },
  {
    name: 'long-explanations',
    messageCount: 8,
    includeSemanticMap: false,
    includeTerminal: false,
    includePlan: false,
    description: 'Few but very long detailed responses',
  },

  // Complete scenarios with all features
  {
    name: 'complete-web-app',
    messageCount: 75,
    includeSemanticMap: true,
    includeTerminal: true,
    includePlan: true,
    language: 'TypeScript',
    description: 'Complete web app development cycle',
  },
  {
    name: 'complete-api-project',
    messageCount: 68,
    includeSemanticMap: true,
    includeTerminal: true,
    includePlan: true,
    language: 'Go',
    description: 'Complete API project lifecycle',
  },
]

async function generateConversation(count: number, language?: string): Promise<any[]> {
  const messages = []
  const userQuestions = [
    'How do I get started with this?',
    'What is the best approach for this?',
    'Can you explain this concept?',
    'How do I fix this error?',
    'What are the best practices?',
    'Can you show me an example?',
    'How do I test this?',
    'What dependencies do I need?',
    'How do I deploy this?',
    'Can you help optimize this?',
    'What is the error in my code?',
    'How do I add error handling?',
    'What about security concerns?',
    'How do I scale this?',
    'Can you review my code?',
  ]

  const assistantResponses = [
    (lang: string) => `Here's how to get started with ${lang}:\n\n\`\`\`${lang.toLowerCase()}\n// Example code\nfunction example() {\n  return "Hello";\n}\n\`\`\``,
    (lang: string) => `The best approach is to:\n\n1. First, set up the structure\n2. Then implement the core logic\n3. Finally, add tests\n\n\`\`\`${lang.toLowerCase()}\n// Implementation\nconst result = process();\n\`\`\``,
    (lang: string) => `This concept works by:\n\n- Separating concerns\n- Using modular design\n- Following patterns\n\nExample:\n\`\`\`${lang.toLowerCase()}\nclass Example {\n  constructor() {}\n}\n\`\`\``,
    (lang: string) => `The error is likely due to:\n\n1. Missing dependency\n2. Incorrect syntax\n3. Type mismatch\n\nFix:\n\`\`\`${lang.toLowerCase()}\nconst correct = "fixed";\n\`\`\``,
  ]

  for (let i = 0; i < count; i++) {
    const isUser = i % 2 === 0
    const lang = language || 'TypeScript'

    if (isUser) {
      messages.push({
        id: `msg-${i}`,
        role: 'user',
        content: userQuestions[i % userQuestions.length],
        timestamp: new Date(Date.now() - (count - i) * 60000).toISOString(),
      })
    } else {
      const responseIndex = Math.floor(i / 2) % assistantResponses.length
      messages.push({
        id: `msg-${i}`,
        role: 'assistant',
        content: assistantResponses[responseIndex](lang),
        timestamp: new Date(Date.now() - (count - i) * 60000).toISOString(),
      })
    }
  }

  return messages
}

async function generateSemanticMap(language: string = 'TypeScript'): Promise<any> {
  const fileCount = randomInt(10, 50)
  const files = []

  const extensions: Record<string, string[]> = {
    TypeScript: ['ts', 'tsx', 'json'],
    Python: ['py', 'txt', 'json'],
    JavaScript: ['js', 'jsx', 'json'],
    Go: ['go', 'mod', 'json'],
    Rust: ['rs', 'toml', 'json'],
    Java: ['java', 'xml', 'json'],
    'C#': ['cs', 'csproj', 'json'],
    PHP: ['php', 'json', 'xml'],
    SQL: ['sql', 'txt'],
    Solidity: ['sol', 'json'],
    'C++': ['cpp', 'h', 'json'],
  }

  const langExtensions = extensions[language] || extensions.TypeScript
  const directories = ['src', 'components', 'utils', 'tests', 'config', 'docs']

  for (let i = 0; i < fileCount; i++) {
    const ext = langExtensions[i % langExtensions.length]
    const dir = directories[i % directories.length]
    files.push({
      path: `${dir}/file${i}.${ext}`,
      language: ext === 'tsx' || ext === 'ts' ? 'TypeScript' :
               ext === 'py' ? 'Python' :
               ext === 'js' || ext === 'jsx' ? 'JavaScript' :
               ext === 'go' ? 'Go' :
               ext === 'rs' ? 'Rust' :
               ext === 'java' ? 'Java' :
               ext === 'cs' ? 'C#' :
               ext === 'php' ? 'PHP' :
               ext === 'sol' ? 'Solidity' :
               ext === 'cpp' || ext === 'h' ? 'C++' :
               ext === 'sql' ? 'SQL' : language,
      size: randomInt(500, 10000),
      line_count: randomInt(20, 300),
      last_modified: new Date(Date.now() - randomInt(0, 86400000)).toISOString(),
    })
  }

  return {
    files,
    languages: {
      [language]: {
        files: Math.floor(fileCount * 0.7),
        lines: randomInt(500, 3000),
        percentage: 70,
      },
      Other: {
        files: Math.floor(fileCount * 0.3),
        lines: randomInt(100, 1000),
        percentage: 30,
      },
    },
    dependencies: [
      { name: 'package-a', version: '^1.0.0', type: 'dependencies' },
      { name: 'package-b', version: '^2.0.0', type: 'dependencies' },
      { name: 'package-c', version: '^3.0.0', type: 'devDependencies' },
    ],
  }
}

async function generateTerminalSession(): Promise<any> {
  const commands = [
    { cmd: 'npm install', output: 'added 1423 packages in 32s' },
    { cmd: 'npm run dev', output: 'ready in 234 ms\n\n➜  Local:   http://localhost:5173/' },
    { cmd: 'npm run test', output: 'PASS src/App.test.tsx\nTests: 15 passed' },
    { cmd: 'npm run build', output: 'dist/index.html                   0.46 kB\ndist/assets/index.js     145.67 kB\n\nbuild in 3.45s' },
    { cmd: 'git status', output: 'On branch main\nChanges not staged for commit:\n  modified: src/App.tsx' },
    { cmd: 'git add .', output: '' },
    { cmd: 'git commit -m "feat: add feature"', output: '[main abc123] feat: add feature\n 5 files changed, 234 insertions(+)' },
    { cmd: 'pytest', output: 'PASSED test_app.py::test_home\nPASSED test_app.py::test_api\n\n2 passed in 1.23s' },
    { cmd: 'cargo build', output: 'Compiling project v0.1.0\nFinished dev [unoptimized + debuginfo] target(s) in 2.34s' },
    { cmd: 'go test', output: 'PASS: TestExample (0.23s)\nPASS: TestAnother (0.12s)\n\nok\tproject\t0.456s' },
    { cmd: 'mvn test', output: 'Tests run: 15, Failures: 0, Errors: 0, Skipped: 0' },
  ]

  const selectedCommands = commands.sort(() => Math.random() - 0.5).slice(0, randomInt(3, 8))

  return {
    id: 'session-1',
    start_time: new Date(Date.now() - 300000).toISOString(),
    end_time: new Date(Date.now() - 60000).toISOString(),
    working_directory: '/home/user/project',
    environment: {
      SHELL: '/bin/bash',
      NODE_VERSION: 'v20.0.0',
      LANG: 'en_US.UTF-8',
    },
    commands: selectedCommands.map((cmd, i) => ({
      command: cmd.cmd,
      output: cmd.output,
      exit_code: 0,
      timestamp: new Date(Date.now() - 250000 + i * 30000).toISOString(),
      duration_ms: randomInt(500, 5000),
    })),
  }
}

async function generatePlan(): Promise<any> {
  const taskTemplates = [
    { subject: 'Set up project structure', status: 'completed', priority: 'high' as const },
    { subject: 'Implement core features', status: 'in_progress', priority: 'high' as const },
    { subject: 'Add error handling', status: 'pending', priority: 'high' as const },
    { subject: 'Write unit tests', status: 'pending', priority: 'medium' as const },
    { subject: 'Add integration tests', status: 'pending', priority: 'medium' as const },
    { subject: 'Write documentation', status: 'pending', priority: 'low' as const },
    { subject: 'Performance optimization', status: 'pending', priority: 'medium' as const },
    { subject: 'Security review', status: 'pending', priority: 'high' as const },
    { subject: 'Deploy to staging', status: 'pending', priority: 'medium' as const },
    { subject: 'User acceptance testing', status: 'pending', priority: 'low' as const },
  ]

  const taskCount = randomInt(4, 10)
  const tasks = taskTemplates
    .sort(() => Math.random() - 0.5)
    .slice(0, taskCount)
    .map((task, i) => ({
      id: `task-${i}`,
      subject: task.subject,
      description: `Detailed description for ${task.subject.toLowerCase()}`,
      status: task.status,
      priority: task.priority,
      tags: [task.priority === 'high' ? 'critical' : 'normal', 'development'],
      blockedBy: i > 0 ? [`task-${i - 1}`] : [],
    }))

  return {
    title: 'Project Implementation Plan',
    description: 'Step-by-step plan for completing the project',
    status: tasks.some((t) => t.status === 'in_progress') ? 'in_progress' : 'pending',
    tasks,
  }
}

async function main() {
  const outputDir = process.argv[2] || './test-corpus'
  await fs.mkdir(outputDir, { recursive: true })

  console.log(`🧪 Generating test corpus in ${outputDir}/`)
  console.log(`📝 Creating ${testScenarios.length} test scenarios...\n`)

  let created = 0
  let totalSize = 0

  for (const scenario of testScenarios) {
    try {
      console.log(`  Creating: ${scenario.name}`)

      const agentFile = await AgentFile.create({
        metadata: {
          title: scenario.name.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          description: scenario.description,
          language: scenario.language || 'TypeScript',
          tags: ['test', 'auto-generated'],
        },
        sourceTool: {
          name: '@state/test-generator',
          version: '0.1.0',
        },
      })

      // Generate conversation
      const messages = await generateConversation(scenario.messageCount, scenario.language)

      // Handle edge cases
      if (scenario.name === 'empty-conversation') {
        messages.length = 0
      } else if (scenario.name === 'single-message') {
        messages.length = 1
      } else if (scenario.name === 'very-long-message') {
        messages[1] = {
          ...messages[1],
          content: 'A'.repeat(100000), // 100KB message
        }
      } else if (scenario.name === 'unicode-content') {
        messages[0].content = 'Hello 🚀 世界 مرحبا שלום'
        messages[1].content = 'Response with emojis: 🎉 ⭐ 🌟 💫'
      } else if (scenario.name === 'code-heavy') {
        for (let i = 0; i < messages.length; i++) {
          if (messages[i].role === 'assistant') {
            messages[i].content = `
\`\`\`typescript
function example${i}(x: number): string {
  return \`Value: \${x}\`;
}

const result${i} = example${i}(${i});
\`\`\`

\`\`\`python
def example${i}(x):
    return f"Value: {x}"

result${i} = example${i}(${i})
\`\`\`

\`\`\`rust
fn example${i}(x: i32) -> String {
    format!("Value: {}", x)
}

let result${i} = example${i}(${i});
\`\`\`
            `.trim()
          }
        }
      } else if (scenario.name === 'markdown-features') {
        messages[1].content = `
# Heading 1

## Heading 2

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| Data 4   | Data 5   | Data 6   |

- List item 1
- List item 2
  - Nested item
- List item 3

1. Numbered item 1
2. Numbered item 2
3. Numbered item 3

> Blockquote text

**Bold text** and *italic text*

\`\`\`code block\`\`\`
        `.trim()
      } else if (scenario.name === 'rapid-fire-questions') {
        for (let i = 0; i < messages.length; i++) {
          messages[i].content = messages[i].content.substring(0, 50)
        }
      } else if (scenario.name === 'long-explanations') {
        for (let i = 0; i < messages.length; i++) {
          if (messages[i].role === 'assistant') {
            messages[i].content = 'Detailed explanation '.repeat(100) + '\n\n' +
              'A'.repeat(5000) + '\n\n' +
              'More details '.repeat(100)
          }
        }
      }

      await agentFile.addConversation(messages)

      // Add optional sections
      if (scenario.includeSemanticMap) {
        const semanticMap = await generateSemanticMap(scenario.language)

        // Special case for polyglot project
        if (scenario.name === 'polyglot-project') {
          semanticMap.files = [
            { path: 'src/main.ts', language: 'TypeScript', size: 2048, line_count: 89, last_modified: new Date().toISOString() },
            { path: 'src/analyzer.py', language: 'Python', size: 1536, line_count: 67, last_modified: new Date().toISOString() },
            { path: 'src/processor.rs', language: 'Rust', size: 3072, line_count: 134, last_modified: new Date().toISOString() },
            { path: 'db/schema.sql', language: 'SQL', size: 1024, line_count: 45, last_modified: new Date().toISOString() },
          ]
          semanticMap.languages = {
            TypeScript: { files: 1, lines: 89, percentage: 25 },
            Python: { files: 1, lines: 67, percentage: 25 },
            Rust: { files: 1, lines: 134, percentage: 25 },
            SQL: { files: 1, lines: 45, percentage: 25 },
          }
        }

        await agentFile.addSemanticMap(semanticMap)
      }

      if (scenario.includeTerminal) {
        await agentFile.addTerminalSession(await generateTerminalSession())
      }

      if (scenario.includePlan) {
        await agentFile.addPlan(await generatePlan())
      }

      // Save file
      const buffer = await agentFile.saveToBuffer()
      const fileName = `${scenario.name}.agent`
      const filePath = path.join(outputDir, fileName)

      await fs.writeFile(filePath, Buffer.from(buffer))

      created++
      totalSize += buffer.byteLength

      console.log(`    ✅ ${fileName} (${(buffer.byteLength / 1024).toFixed(2)} KB)`)
    } catch (error: any) {
      console.error(`    ❌ Failed to create ${scenario.name}: ${error.message}`)
    }
  }

  console.log(`\n✨ Test corpus generation complete!`)
  console.log(`📊 Statistics:`)
  console.log(`   Files created: ${created}/${testScenarios.length}`)
  console.log(`   Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`)
  console.log(`   Average size: ${(totalSize / created / 1024).toFixed(2)} KB`)
  console.log(`   Location: ${path.resolve(outputDir)}/`)
}

main().catch(console.error)
