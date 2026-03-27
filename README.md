# State (.agent) - Portable Context Standard for AI Conversations

> The "PDF of the Agentic Era" - Package AI conversations, semantic maps, terminal history, and future plans into a single portable file.

[![CI](https://github.com/state-project/agent/workflows/CI/badge.svg)](https://github.com/state-project/agent/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Overview

**State** is a portable file format (`.agent`) that captures the complete context of AI coding sessions. It enables developers to:

- 📦 **Save** AI conversations with full context
- 🔍 **Search** across conversations
- 📤 **Share** context with teams
- 📚 **Document** decisions and reasoning
- 🔄 **Review** AI-generated code with context

---

## Features

### Portable Format

- **Single file**: Everything in one `.agent` file
- **ZIP-based**: Efficient compression and compatibility
- **Secure**: Encryption and digital signatures
- **Extensible**: Plugin system for custom importers

### Components

- **Conversations**: Full AI chat history with context
- **Semantic Maps**: Project structure and dependencies
- **Terminal History**: Commands and outputs
- **Future Plans**: Action items and next steps
- **Assets**: Images, files, and artifacts

### Security

- 🔒 AES-256-GCM encryption
- ✍️ Ed25519 digital signatures
- 🛡️ ZIP bomb protection
- 🔐 Path traversal prevention
- ✅ SHA-256 integrity checks

---

## Quick Start

### Installation

```bash
# Install CLI
npm install -g @state/cli

# Or use with a project
npm install @state/format
```

### Creating .agent Files

```bash
# From Claude Code
state import claude ~/.claude/conversations/my-conversation

# From ChatGPT export
state import chatgpt ~/Downloads/chatgpt-export.zip

# From clipboard
state import --clipboard

# From project
state init ./my-project
```

### Viewing .agent Files

```bash
# Open in desktop viewer
state view conversation.agent

# Start local web viewer
state server

# Export to markdown
state export conversation.agent --format md
```

---

## Packages

| Package | Description |
|---------|-------------|
| `@state/format` | Core .agent file format library |
| `@state/cli` | Command-line interface |
| `@state/importer-claude` | Claude Code importer |
| `@state/importer-chatgpt` | ChatGPT importer |
| `@state/viewer-web` | Web viewer |
| `@state/viewer-desktop` | Desktop viewer (Tauri) |

---

## Development

### Setup

```bash
# Clone repository
git clone https://github.com/state-project/agent.git
cd agent

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run linter
pnpm lint
```

### Project Structure

```
state/
├── packages/
│   ├── format/          # Core .agent format library
│   ├── cli/             # CLI tool
│   ├── importer/        # AI tool importers
│   │   ├── claude/
│   │   └── chatgpt/
│   ├── viewer-web/      # Web viewer (Next.js)
│   └── viewer-desktop/  # Desktop viewer (Tauri)
├── .agent/              # Format specification
│   └── spec/
├── docs/                # Documentation
└── examples/            # Example .agent files
```

---

## .agent File Format

### Structure

```
conversation.agent (ZIP archive)
├── manifest.json          # Metadata
├── conversation/
│   ├── messages.json      # AI conversation
│   └── context.json       # Conversation context
├── semantic-map/
│   ├── file-tree.json     # Project structure
│   ├── dependencies.json  # Dependency graph
│   └── summaries.json     # File summaries
├── terminal/
│   ├── sessions.json      # Terminal sessions
│   └── outputs.log        # Command outputs
├── future-plan/
│   ├── plan.md            # Markdown plan
│   └── tasks.json         # Task list
└── assets/
    └── blobs/             # Binary files
```

### Example Manifest

```json
{
  "version": "1.0.0",
  "format": "agent",
  "created_at": "2026-03-27T00:00:00Z",
  "source_tool": {
    "name": "claude",
    "version": "1.0.0",
    "model": "claude-3-opus-20240229"
  },
  "encryption": {
    "enabled": false
  },
  "metadata": {
    "title": "React Hooks Tutorial",
    "language": "TypeScript",
    "tags": ["react", "hooks", "tutorial"]
  }
}
```

---

## Supported AI Tools

### MVP (v1.0)
- ✅ **Claude Code**: Full support via API and local storage
- ✅ **ChatGPT**: Official export support
- ✅ **Manual/Clipboard**: Universal fallback

### Post-MVP (Community Plugins)
- ⏸️ **Cursor**: Deferred due to ToS (use clipboard instead)
- 🔜 **Windsurf/Codeium**: Planned
- 🔜 **GitHub Copilot Chat**: Monitoring for export features
- 🔜 **Continue.dev**: Community plugin

*See [cursor-alternatives.md](./cursor-alternatives.md) for details.*

---

## Technology Stack

- **Desktop**: [Tauri](https://tauri.app/) (Rust + WebView)
- **Web**: [Next.js 14](https://nextjs.org/) with App Router
- **ZIP**: [JSZip](https://stuk.github.io/jszip/) with security wrappers
- **Language**: TypeScript (strict mode)
- **Package Manager**: pnpm (workspaces)
- **License**: MIT

---

## Documentation

- [Format Specification](./.agent/spec/schema.json)
- [Versioning Strategy](./.agent/spec/versioning.md)
- [Contributing Guide](./.agent/spec/contributing.md)
- [API Documentation](https://docs.state.dev)
- [Implementation Plan](./implementation.md)

---

## Security

- ✅ ZIP bomb protection (compression ratio validation)
- ✅ Path traversal prevention
- ✅ Size limits (500MB total, 100MB per file)
- ✅ Input sanitization
- ✅ Encryption support (AES-256-GCM)
- ✅ Digital signatures (Ed25519)

See [implementation.md](./implementation.md) for complete security model.

---

## Roadmap

### v1.0 (MVP)
- [x] Phase 0: Research & Validation
- [ ] Phase 1: Foundation & Specification
- [ ] Phase 2: Core Format Implementation
- [ ] Phase 3: Importer Development (Claude + ChatGPT)
- [ ] Phase 4: Viewer Development (Web + Desktop)
- [ ] Phase 5: CLI Tool
- [ ] Phase 6: Integration & Testing
- [ ] Phase 7: Launch

### Post-v1.0
- Additional AI tool importers
- Plugin ecosystem
- Cloud sync (optional)
- Collaboration features
- Mobile viewers

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./.agent/spec/contributing.md) for details.

Quick start:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Acknowledgments

Built with:
- [Tauri](https://tauri.app/) - Desktop framework
- [Next.js](https://nextjs.org/) - Web framework
- [JSZip](https://stuk.github.io/jszip/) - ZIP library
- [TypeScript](https://www.typescriptlang.org/) - Type safety

---

## Links

- [GitHub](https://github.com/state-project/agent)
- [Documentation](https://docs.state.dev)
- [Discord](https://discord.gg/state)
- [Twitter](https://twitter.com/stateproject)

---

**Status**: ✅ Phase 0 Complete | 🚀 Phase 1 In Progress

**Last Updated**: 2026-03-27
