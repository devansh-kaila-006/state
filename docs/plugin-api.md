# State (.agent) Plugin API

## Overview

The State plugin API allows developers to extend the functionality of the .agent format with custom importers, viewers, and semantic map generators.

## Plugin Types

### 1. Importer Plugins

Import custom conversation formats into .agent files.

```typescript
interface ImporterPlugin {
  name: string
  version: string
  description: string

  // Detect if this plugin can handle the input
  detect(input: string | Buffer | object): Promise<boolean>

  // Parse input and return AgentFile
  import(input: any, options?: ImportOptions): Promise<AgentFile>

  // Optional: Validate input before importing
  validate?(input: any): Promise<ValidationResult>

  // Optional: Get metadata about the input
  getMetadata?(input: any): Promise<InputMetadata>
}

interface ImportOptions {
  title?: string
  description?: string
  language?: string
  includeSemanticMap?: boolean
  includeTerminal?: boolean
  includePlan?: boolean
}

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

interface InputMetadata {
  source: string
  format: string
  version?: string
  messageCount?: number
  hasSemanticMap?: boolean
  hasTerminal?: boolean
  hasPlan?: boolean
}
```

### Example: Custom Importer Plugin

```typescript
// plugins/importer-custom/src/index.ts
import { AgentFile } from '@state/format'
import type { ImporterPlugin, ImportOptions } from '@state/plugin-api'

export const customImporterPlugin: ImporterPlugin = {
  name: 'custom-importer',
  version: '1.0.0',
  description: 'Import conversations from custom format',

  async detect(input: any): Promise<boolean> {
    // Check if input matches your format
    return (
      typeof input === 'object' &&
      input.hasOwnProperty('messages') &&
      Array.isArray(input.messages)
    )
  },

  async import(input: any, options: ImportOptions = {}): Promise<AgentFile> {
    // Create AgentFile
    const agentFile = await AgentFile.create({
      metadata: {
        title: options.title || input.title || 'Imported Conversation',
        description: options.description || input.description,
        language: options.language || input.language,
      },
      sourceTool: {
        name: this.name,
        version: this.version,
      },
    })

    // Transform messages
    const messages = input.messages.map((msg: any, index: number) => ({
      id: msg.id || `msg-${index}`,
      role: msg.role || 'user',
      content: msg.content || '',
      timestamp: msg.timestamp || new Date().toISOString(),
    }))

    await agentFile.addConversation(messages)

    // Add optional sections
    if (input.semanticMap && options.includeSemanticMap) {
      await agentFile.addSemanticMap(input.semanticMap)
    }

    if (input.terminal && options.includeTerminal) {
      await agentFile.addTerminalSession(input.terminal)
    }

    if (input.plan && options.includePlan) {
      await agentFile.addPlan(input.plan)
    }

    return agentFile
  },

  async validate(input: any): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    if (!input.messages || !Array.isArray(input.messages)) {
      errors.push('Input must have a messages array')
    }

    if (input.messages && input.messages.length === 0) {
      warnings.push('No messages found in input')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  },

  async getMetadata(input: any): Promise<InputMetadata> {
    return {
      source: 'custom-format',
      format: 'json',
      version: input.version,
      messageCount: input.messages?.length,
      hasSemanticMap: !!input.semanticMap,
      hasTerminal: !!input.terminal,
      hasPlan: !!input.plan,
    }
  },
}
```

### 2. Viewer Plugins

Create custom viewers for .agent files.

```typescript
interface ViewerPlugin {
  name: string
  version: string
  description: string

  // Render the .agent file
  render(agentFile: AgentFile, container: HTMLElement): Promise<void>

  // Optional: Specify supported views
  supportedViews?: string[]

  // Optional: Custom theme
  theme?: ViewerTheme

  // Optional: Custom components
  components?: ViewerComponents
}

interface ViewerTheme {
  colors: {
    primary: string
    secondary: string
    background: string
    foreground: string
    border: string
  }
  fonts: {
    body: string
    code: string
    heading: string
  }
  spacing: {
    small: string
    medium: string
    large: string
  }
}

interface ViewerComponents {
  Message?: (props: MessageProps) => JSX.Element
  Sidebar?: (props: SidebarProps) => JSX.Element
  Header?: (props: HeaderProps) => JSX.Element
}
```

### Example: Custom Viewer Plugin

```typescript
// plugins/viewer-custom/src/index.tsx
import type { ViewerPlugin, ViewerTheme } from '@state/plugin-api'
import type { AgentFile } from '@state/format'

export const customViewerPlugin: ViewerPlugin = {
  name: 'custom-viewer',
  version: '1.0.0',
  description: 'Custom viewer with unique styling',

  supportedViews: ['conversation', 'semantic-map', 'terminal', 'plan'],

  theme: {
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      background: '#0f172a',
      foreground: '#f1f5f9',
      border: '#1e293b',
    },
    fonts: {
      body: 'Inter, system-ui, sans-serif',
      code: 'Fira Code, monospace',
      heading: 'Inter, system-ui, sans-serif',
    },
    spacing: {
      small: '0.5rem',
      medium: '1rem',
      large: '2rem',
    },
  },

  async render(agentFile: AgentFile, container: HTMLElement): Promise<void> {
    const manifest = agentFile.getManifest()
    const conversation = agentFile.getConversation()

    // Render custom UI
    container.innerHTML = `
      <div class="custom-viewer">
        <h1>${manifest.metadata?.title || 'Untitled'}</h1>
        <div class="messages">
          ${conversation.messages
            .map(
              (msg) => `
            <div class="message ${msg.role}">
              <div class="content">${msg.content}</div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `

    // Apply custom styles
    const style = document.createElement('style')
    style.textContent = `
      .custom-viewer {
        font-family: ${this.theme?.fonts.body};
        color: ${this.theme?.colors.foreground};
      }
      .message.user {
        background: ${this.theme?.colors.primary};
      }
      .message.assistant {
        background: ${this.theme?.colors.secondary};
      }
    `
    document.head.appendChild(style)
  },
}
```

### 3. Semantic Map Generator Plugins

Generate semantic maps from project structures.

```typescript
interface SemanticMapPlugin {
  name: string
  version: string
  description: string

  // Generate semantic map from project directory
  generate(projectPath: string): Promise<SemanticMap>

  // Optional: Supported project types
  supportedProjects?: string[]

  // Optional: Configuration options
  defaultOptions?: SemanticMapOptions
}

interface SemanticMap {
  files: SemanticFile[]
  languages: Record<string, LanguageStats>
  dependencies: Dependency[]
  modules?: Module[]
  architecture?: Architecture
}

interface SemanticFile {
  path: string
  language: string
  size: number
  line_count: number
  last_modified: string
  imports?: string[]
  exports?: string[]
  complexity?: number
}

interface LanguageStats {
  files: number
  lines: number
  percentage: number
}

interface Dependency {
  name: string
  version: string
  type: 'dependencies' | 'devDependencies' | 'peerDependencies'
}
```

### Example: Semantic Map Generator Plugin

```typescript
// plugins/semantic-custom/src/index.ts
import type { SemanticMapPlugin, SemanticMap } from '@state/plugin-api'
import * as fs from 'fs/promises'
import * as path from 'path'

export const customSemanticPlugin: SemanticMapPlugin = {
  name: 'custom-semantic-generator',
  version: '1.0.0',
  description: 'Generate semantic maps with custom metrics',

  supportedProjects: ['typescript', 'python', 'rust'],

  defaultOptions: {
    includeComplexity: true,
    includeImports: true,
    maxDepth: 10,
  },

  async generate(projectPath: string): Promise<SemanticMap> {
    const files = await this.scanFiles(projectPath)
    const languages = this.analyzeLanguages(files)
    const dependencies = await this.extractDependencies(projectPath)

    return {
      files,
      languages,
      dependencies,
    }
  },

  async scanFiles(projectPath: string): Promise<SemanticFile[]> {
    const files: SemanticFile[] = []

    async function scanDir(dir: string, depth = 0) {
      if (depth > 10) return // Prevent infinite recursion

      const entries = await fs.readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
          // Skip node_modules, .git, etc.
          if (
            !['node_modules', '.git', '.idea', 'dist', 'build'].includes(
              entry.name
            )
          ) {
            await scanDir(fullPath, depth + 1)
          }
        } else {
          const ext = path.extname(entry.name)
          const language = detectLanguage(ext)

          if (language) {
            const stats = await fs.stat(fullPath)
            const content = await fs.readFile(fullPath, 'utf-8')

            files.push({
              path: fullPath.replace(projectPath, ''),
              language,
              size: stats.size,
              line_count: content.split('\n').length,
              last_modified: stats.mtime.toISOString(),
            })
          }
        }
      }
    }

    await scanDir(projectPath)
    return files
  },

  analyzeLanguages(files: SemanticFile[]): Record<string, LanguageStats> {
    const languages: Record<string, LanguageStats> = {}

    for (const file of files) {
      if (!languages[file.language]) {
        languages[file.language] = {
          files: 0,
          lines: 0,
          percentage: 0,
        }
      }

      languages[file.language].files++
      languages[file.language].lines += file.line_count
    }

    // Calculate percentages
    const totalLines = Object.values(languages).reduce(
      (sum, lang) => sum + lang.lines,
      0
    )

    for (const lang of Object.values(languages)) {
      lang.percentage = Math.round((lang.lines / totalLines) * 100)
    }

    return languages
  },

  async extractDependencies(
    projectPath: string
  ): Promise<Dependency[]> {
    const packageJsonPath = path.join(projectPath, 'package.json')

    try {
      const content = await fs.readFile(packageJsonPath, 'utf-8')
      const pkg = JSON.parse(content)

      const dependencies: Dependency[] = []

      if (pkg.dependencies) {
        for (const [name, version] of Object.entries(pkg.dependencies)) {
          dependencies.push({ name, version: version as string, type: 'dependencies' })
        }
      }

      if (pkg.devDependencies) {
        for (const [name, version] of Object.entries(pkg.devDependencies)) {
          dependencies.push({
            name,
            version: version as string,
            type: 'devDependencies',
          })
        }
      }

      return dependencies
    } catch {
      return []
    }
  },
}

function detectLanguage(ext: string): string | null {
  const languageMap: Record<string, string> = {
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript',
    '.js': 'JavaScript',
    '.jsx': 'JavaScript',
    '.py': 'Python',
    '.rs': 'Rust',
    '.go': 'Go',
    '.java': 'Java',
    '.cs': 'C#',
    '.cpp': 'C++',
    '.cc': 'C++',
    '.h': 'C++',
    '.hpp': 'C++',
    '.c': 'C',
  }

  return languageMap[ext] || null
}
```

## Plugin Registry

Plugins are registered in a central registry:

```typescript
// plugins/registry.ts
import type { ImporterPlugin, ViewerPlugin, SemanticMapPlugin } from '@state/plugin-api'

interface PluginRegistry {
  importers: Record<string, ImporterPlugin>
  viewers: Record<string, ViewerPlugin>
  semanticGenerators: Record<string, SemanticMapPlugin>
}

const registry: PluginRegistry = {
  importers: {},
  viewers: {},
  semanticGenerators: {},
}

export function registerImporter(plugin: ImporterPlugin): void {
  registry.importers[plugin.name] = plugin
}

export function registerViewer(plugin: ViewerPlugin): void {
  registry.viewers[plugin.name] = plugin
}

export function registerSemanticGenerator(plugin: SemanticMapPlugin): void {
  registry.semanticGenerators[plugin.name] = plugin
}

export function getImporter(name: string): ImporterPlugin | undefined {
  return registry.importers[name]
}

export function getViewer(name: string): ViewerPlugin | undefined {
  return registry.viewers[name]
}

export function getSemanticGenerator(
  name: string
): SemanticMapPlugin | undefined {
  return registry.semanticGenerators[name]
}

export function listImporters(): ImporterPlugin[] {
  return Object.values(registry.importers)
}

export function listViewers(): ViewerPlugin[] {
  return Object.values(registry.viewers)
}

export function listSemanticGenerators(): SemanticMapPlugin[] {
  return Object.values(registry.semanticGenerators)
}
```

## Using Plugins

### CLI Usage

```bash
# Register a plugin
state plugin register ./my-plugin

# List available plugins
state plugin list

# Use specific importer
state import custom ./input.json --plugin my-importer

# Use specific viewer
state view file.agent --viewer my-viewer
```

### Programmatic Usage

```typescript
import { registerImporter, getImporter } from '@state/plugin-api'
import { myCustomImporter } from './my-plugin'

// Register plugin
registerImporter(myCustomImporter)

// Use plugin
const importer = getImporter('my-importer')
if (await importer.detect(input)) {
  const agentFile = await importer.import(input)
}
```

## Plugin Development

### Setup

```bash
# Create plugin package
mkdir state-plugin-my-importer
cd state-plugin-my-importer
pnpm init

# Install dependencies
pnpm add @state/format @state/plugin-api

# Create plugin
# (see examples above)
```

### Package Structure

```
state-plugin-my-importer/
├── package.json
├── src/
│   └── index.ts
├── README.md
└── LICENSE
```

### Publishing

```bash
# Build
pnpm build

# Publish to npm
pnpm publish
```

### Plugin Discovery

Plugins are automatically discovered from:

1. npm packages matching `@state/plugin-*` pattern
2. Local `plugins/` directory
3. User-specified plugin directories

## Testing Plugins

```typescript
import { describe, it, expect } from 'vitest'
import { myPlugin } from './my-plugin'

describe('My Plugin', () => {
  it('should detect supported format', async () => {
    const input = { messages: [{ role: 'user', content: 'Hello' }] }
    expect(await myPlugin.detect(input)).toBe(true)
  })

  it('should import to AgentFile', async () => {
    const input = { messages: [{ role: 'user', content: 'Hello' }] }
    const agentFile = await myPlugin.import(input)

    const conversation = agentFile.getConversation()
    expect(conversation.messages).toHaveLength(1)
  })
})
```

## Best Practices

1. **Error Handling**: Always handle errors gracefully and provide helpful error messages
2. **Validation**: Validate input before processing
3. **Performance**: Use streaming for large files
4. **Documentation**: Provide comprehensive README and examples
5. **Testing**: Include comprehensive tests
6. **Versioning**: Follow semantic versioning
7. **Type Safety**: Use TypeScript for type safety
8. **Options**: Provide sensible defaults and allow customization

## Plugin Guidelines

- **Importer Plugins**:
  - Support multiple input formats
  - Preserve metadata
  - Handle edge cases
  - Provide progress feedback

- **Viewer Plugins**:
  - Responsive design
  - Accessibility (ARIA labels)
  - Performance (lazy loading)
  - Theme customization

- **Semantic Map Plugins**:
  - Handle large projects efficiently
  - Provide meaningful metrics
  - Support multiple languages
  - Caching for performance

## Community Contribution

1. Fork the main repository
2. Create plugin in `plugins/` directory
3. Follow plugin template
4. Add tests and documentation
5. Submit pull request

For more information, see [CONTRIBUTING.md](../CONTRIBUTING.md).
