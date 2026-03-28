# @state/example-importer

Example importer plugin for State (.agent).

This is a reference implementation demonstrating how to create a custom importer plugin for the State (.agent) format.

## What is State?

State is a portable file format for packaging AI conversations, code context, and project understanding into a single `.agent` file. Think of it as the PDF of the agentic era.

Learn more at [state.dev](https://state.dev).

## Plugin Overview

This plugin imports conversations from a simple JSON format into `.agent` files.

### Input Format

```json
{
  "title": "Conversation Title",
  "description": "Optional description",
  "language": "TypeScript",
  "messages": [
    { "role": "user", "content": "Hello", "timestamp": "2024-01-01T00:00:00.000Z" },
    { "role": "assistant", "content": "Hi there!", "timestamp": "2024-01-01T00:00:01.000Z" }
  ],
  "semanticMap": { ... },
  "terminal": { ... },
  "plan": { ... }
}
```

## Installation

```bash
npm install @state/example-importer
```

## Usage

### Programmatic Usage

```typescript
import { exampleImporterPlugin } from '@state/example-importer'
import { registerImporter } from '@state/plugin-api'

// Register the plugin
registerImporter(exampleImporterPlugin)

// Use the plugin
const input = {
  title: 'My Conversation',
  messages: [
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: 'Hi there!' }
  ]
}

// Detect if this plugin can handle the input
if (await exampleImporterPlugin.detect(input)) {
  // Import the conversation
  const agentFile = await exampleImporterPlugin.import(input)

  // Save to file
  const buffer = await agentFile.saveToBuffer()
  await fs.writeFile('conversation.agent', buffer)
}
```

### CLI Usage

```bash
# Register the plugin globally
state plugin register @state/example-importer

# Import a file
state import example input.json

# Or use with stdin
cat input.json | state import example
```

## API

### `detect(input: unknown): Promise<boolean>`

Determines if this plugin can handle the input data.

```typescript
const canImport = await exampleImporterPlugin.detect(input)
```

### `import(input: ExampleInput, options?: ImportOptions): Promise<AgentFile>`

Imports the input data and converts to `.agent` format.

```typescript
const agentFile = await exampleImporterPlugin.import(input, {
  title: 'Custom Title',
  description: 'Custom Description',
  language: 'TypeScript',
  includeSemanticMap: true,
  includeTerminal: true,
  includePlan: true
})
```

### `validate(input: unknown): Promise<ValidationResult>`

Validates the input data.

```typescript
const result = await exampleImporterPlugin.validate(input)

if (!result.valid) {
  console.error('Errors:', result.errors)
  console.warn('Warnings:', result.warnings)
}
```

### `getMetadata(input: ExampleInput): Promise<InputMetadata>`

Gets metadata about the input.

```typescript
const metadata = await exampleImporterPlugin.getMetadata(input)
console.log(`Message count: ${metadata.messageCount}`)
console.log(`Has semantic map: ${metadata.hasSemanticMap}`)
```

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/state-org/plugins.git
cd plugins/packages/example-importer

# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test
```

### Project Structure

```
example-importer/
├── src/
│   ├── index.ts           # Main plugin implementation
│   └── index.test.ts      # Plugin tests
├── package.json
├── tsconfig.json
└── README.md
```

## Creating Your Own Importer

Use this plugin as a template:

1. **Copy this package**
2. **Modify `src/index.ts`**:
   - Update plugin metadata (name, version, description)
   - Implement `detect()` for your format
   - Implement `import()` to convert your format
   - Implement `validate()` for input validation
   - Implement `getMetadata()` for metadata extraction
3. **Update tests** in `src/index.test.ts`
4. **Update `package.json`** with your plugin details
5. **Publish** to npm

### Minimal Plugin Template

```typescript
import type { ImporterPlugin } from '@state/plugin-api'

export const myImporter: ImporterPlugin = {
  name: 'my-importer',
  version: '1.0.0',
  description: 'My custom importer',

  async detect(input) {
    // Return true if this plugin can handle the input
    return true
  },

  async import(input, options = {}) {
    // Convert input to AgentFile
    const agentFile = await AgentFile.create({
      metadata: { title: 'Imported' },
      sourceTool: { name: this.name, version: this.version },
    })

    // Transform and add messages
    const messages = transformMessages(input)
    await agentFile.addConversation(messages)

    return agentFile
  },
}
```

## Testing

```bash
# Run tests
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test --watch
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](https://github.com/state-org/state/blob/main/CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](https://github.com/state-org/state/blob/main/LICENSE) for details.

## Links

- **State Project**: https://state.dev
- **GitHub**: https://github.com/state-org/state
- **Plugin API Docs**: https://docs.state.dev/plugin-api
- **Discord**: https://discord.gg/state

## Support

- **Issues**: https://github.com/state-org/plugins/issues
- **Discord**: https://discord.gg/state
- **Email**: hello@state.dev
