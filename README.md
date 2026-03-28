# State (.agent) - The Portable Context Standard for AI Conversations

<div align="center">

**The PDF of the Agentic Era** - Package AI conversations, semantic maps, terminal history, and future plans into a single portable file.

[![CI Status](https://img.shields.io/github/state-org/state/workflows/test/badge.svg)](https://github.com/state-org/state/actions)
[![NPM Version](https://img.shields.io/npm/v/@state/cli)](https://www.npmjs.com/package/@state/cli)
[![License: MIT](https://img.shields.io/npm/l/@state/cli)](https://github.com/state-org/state/blob/main/LICENSE)
[![Coverage](https://img.shields.io/codecov/c/github/state-org/state/main)](https://codecov.io/gh/state-org/state)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Discord](https://img.shields.io/discord/7988508097344122939)](https://discord.gg/state)

</div>

## 🎯 What is State?

**State** is a portable file format for packaging AI conversations, code context, and project understanding into a single `.agent` file. Think of it as the PDF of the agentic era - you can create it once and view it anywhere.

### Why State?

- **📦 Portable**: Single file contains everything - conversations, semantic maps, terminal history, and future plans
- **🔒 Secure**: AES-256-GCM encryption with password protection
- **✍️ Authentic**: Ed25519 digital signatures verify source and prevent tampering
- **🚀 Fast**: Load 1000 messages in under 1 second
- **🎨 Beautiful**: Web and desktop viewers with syntax highlighting and markdown rendering
- **🔌 Extensible**: Plugin system for custom importers, viewers, and semantic map generators
- **✅ Tested**: 95%+ code coverage with comprehensive test suite

## 🚀 Quick Start

### Installation

```bash
# Install CLI tool globally
npm install -g @state/cli

# Or use with npx (no installation needed)
npx @state/cli --help
```

### Basic Usage

```bash
# Import from Claude Code
state import claude

# Import from ChatGPT export
state import chatgpt conversations.zip

# Import from clipboard/text
state import clipboard

# View .agent file
state view conversation.agent

# View in web browser
state view conversation.agent --web

# Export to Markdown
state export conversation.agent --format markdown --output conversation.md
```

## 📦 File Format

A `.agent` file is a ZIP archive containing:

```
conversation.agent
├── manifest.json          # Metadata, timestamps, tool info
├── conversations/
│   └── messages.json     # AI conversation history
├── semantic-map/
│   └── index.json         # Project structure & code graph
├── terminal/
│   └── sessions.json      # Command outputs
└── future-plan/
    └── index.json         # Next steps & action items
```

### Example

```typescript
import { AgentFile } from '@state/format'

// Create .agent file
const agentFile = await AgentFile.create({
  metadata: {
    title: 'Building a React App',
    description: 'Creating a todo application with React',
    language: 'TypeScript',
  },
  sourceTool: {
    name: 'claude-code',
    version: '1.0.0',
  },
})

// Add conversation
await agentFile.addConversation([
  {
    id: 'msg-1',
    role: 'user',
    content: 'Help me build a React todo app',
    timestamp: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: 'I\'ll help you build a React todo app...',
    timestamp: '2024-01-01T00:00:01.000Z',
  },
])

// Save to file
const buffer = await agentFile.saveToBuffer()
await fs.writeFile('my-conversation.agent', buffer)
```

## 🔌 Importers

### Built-in Importers

- **Claude Code**: Direct import from Claude Code local storage
- **ChatGPT**: Import from official ChatGPT data export
- **Manual/Clipboard**: Paste conversations or import from text files

### Usage

```bash
# Claude Code
state import claude [output-dir] --max 10

# ChatGPT
state import chatgpt conversations.zip [output-dir]

# Clipboard
state import clipboard

# Text file
state import text input.txt --format markdown
```

## 🖥️ Viewers

### Web Viewer

Access from any browser at https://viewer.state.dev

Features:
- 💬 Beautiful conversation view with syntax highlighting
- 🗺️ Interactive semantic map with file tree
- ⌨️ Terminal session viewer with command history
- 📋 Future plan viewer with task tracking
- 🌙 Dark mode support
- 📱 Responsive design

### Desktop Viewer

Native desktop application built with Tauri (96% smaller than Electron).

```bash
# Install
npm install -g @state/viewer-desktop

# Launch
state-viewer

# Open file
state-viewer conversation.agent
```

### CLI Viewer

```bash
# View file information
state view conversation.agent --info

# View in web browser
state view conversation.agent --web

# View specific section
state view conversation.agent --section conversation
state view conversation.agent --section semantic-map
state view conversation.agent --section terminal
state view conversation.agent --section plan
```

## 🔐 Security

### Encryption

Protect your conversations with AES-256-GCM encryption:

```typescript
import { AgentFile } from '@state/format'

const agentFile = await AgentFile.create({ ... })

// Save with password
const buffer = await agentFile.saveToBuffer({
  password: 'my-secure-password'
})
```

### Digital Signatures

Verify authenticity with Ed25519 signatures:

```typescript
import { generateKeyPair, sign, verify } from '@state/format'

// Generate key pair
const keyPair = generateKeyPair()

// Sign .agent file
const signature = sign(buffer, keyPair.secretKey)

// Verify signature
const isValid = verify(buffer, signature, keyPair.publicKey)
```

## 🔌 Plugin System

Create custom importers, viewers, and semantic map generators.

### Example: Custom Importer

```typescript
import type { ImporterPlugin } from '@state/plugin-api'

export const myImporter: ImporterPlugin = {
  name: 'my-importer',
  version: '1.0.0',
  description: 'Import from my custom format',

  async detect(input: any): Promise<boolean> {
    return input && typeof input === 'object' && input.messages
  },

  async import(input: any): Promise<AgentFile> {
    const agentFile = await AgentFile.create({
      metadata: {
        title: input.title || 'Imported Conversation',
      },
      sourceTool: {
        name: this.name,
        version: this.version,
      },
    })

    await agentFile.addConversation(input.messages)
    return agentFile
  },
}
```

See [Plugin API Documentation](https://docs.state.dev/plugin-api) for details.

## 📊 Performance

| Operation | Performance |
|-----------|-------------|
| AgentFile creation | <50ms |
| Add 100 messages | <500ms |
| Load 1000 messages | <1000ms |
| Encrypt 1MB | <500ms |
| Decrypt 1MB | <300ms |
| Sign 1MB | <50ms |
| Verify 1MB | <50ms |

## 🧪 Testing

Comprehensive test suite with **95%+ code coverage**:

```bash
# Run all tests
pnpm test:all

# Run with coverage
pnpm test:coverage

# Run specific test types
pnpm test:unit
pnpm test:integration
pnpm test:e2e
pnpm test:properties
pnpm test:fuzz
pnpm test:cross-platform
```

## 📚 Documentation

- [Getting Started Guide](https://docs.state.dev/getting-started)
- [CLI Reference](https://docs.state.dev/cli-reference)
- [Plugin API](https://docs.state.dev/plugin-api)
- [Format Specification](https://docs.state.dev/spec)
- [Contributing Guide](https://docs.state.dev/contributing)

## 🏗️ Project Structure

```
state/
├── packages/
│   ├── format/              # Core .agent format library
│   ├── cli/                 # CLI tool
│   ├── importer/            # AI tool importers
│   │   ├── claude/
│   │   ├── chatgpt/
│   │   └── manual/
│   ├── viewer-web/          # Web viewer (Next.js)
│   └── viewer-desktop/     # Desktop viewer (Tauri)
├── .agent/                  # Format specification
│   └── spec/
├── docs/                   # Documentation
├── test/                   # Test suite
├── scripts/                # Build/utility scripts
└── website/                # Landing page
```

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Development

```bash
# Clone repository
git clone https://github.com/state-org/state.git
cd state

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test:all

# Run linter
pnpm lint
```

## 📋 Roadmap

### v1.0 (Current) ✅
- ✅ Phase 0: Research & Validation
- ✅ Phase 1: Foundation & Specification
- ✅ Phase 2: Core Format Implementation
- ✅ Phase 3: Importer Development (Claude + ChatGPT + Manual)
- ✅ Phase 4: Viewer Development (Web + Desktop)
- ✅ Phase 5: CLI Tool
- ✅ Phase 6: Integration & Testing
- ✅ Phase 7: Launch & Ecosystem

### Post-v1.0 (Future)
- 🔜 Additional AI tool importers (Windsurf, Tabnine, Cody)
- 🔜 Cloud sync (optional)
- 🔜 Collaboration features
- 🔜 Mobile viewers
- 🔜 Advanced analytics

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

Built with love by the State Project contributors:

- [Vitest](https://vitest.dev/) - Testing framework
- [Tauri](https://tauri.app/) - Desktop framework
- [Next.js](https://nextjs.org/) - Web framework
- [JSZip](https://stuk.github.io/jszip/) - ZIP library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [fast-check](https://github.com/dubzzz/fast-check) - Property-based testing

## 📮 Contact

- **Website**: https://state.dev
- **GitHub**: https://github.com/state-org/state
- **Discord**: https://discord.gg/state
- **Email**: hello@state.dev
- **Twitter**: [@stateproject](https://twitter.com/stateproject)

---

<div align="center">

**[⭐ Star us on GitHub](https://github.com/state-org/state)** •
**[🐦 Follow on Twitter](https://twitter.com/stateproject)** •
**[💬 Join Discord](https://discord.gg/state)**

Made with ❤️ by the State Project

**Status**: ✅ All Phases Complete | 🚀 Production Ready

**Last Updated**: 2026-03-27

</div>
