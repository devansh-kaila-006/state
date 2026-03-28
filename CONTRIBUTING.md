# Contributing to State (.agent)

Thank you for your interest in contributing to the State project! We welcome contributions from developers of all skill levels.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Plugin Development](#plugin-development)
- [Pull Request Process](#pull-request-process)
- [Commit Messages](#commit-messages)

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- **Node.js**: 18.x, 20.x, or 22.x (LTS or Current)
- **pnpm**: 8.x or 9.x
- **Rust**: 1.70+ (for desktop viewer development)
- **Git**: 2.30+

### Setup Development Environment

```bash
# 1. Fork the repository
# Click "Fork" button on https://github.com/state-org/state

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/state.git
cd state

# 3. Install dependencies
pnpm install

# 4. Build all packages
pnpm build

# 5. Run tests to verify setup
pnpm test:all

# 6. Start development server (for web viewer)
cd packages/viewer-web
pnpm dev

# 7. Start desktop viewer (for Tauri development)
cd packages/viewer-desktop
pnpm tauri dev
```

### Development Commands

```bash
# Build all packages
pnpm build

# Watch mode for development
pnpm build --watch

# Run all tests
pnpm test:all

# Run specific test suites
pnpm test:unit
pnpm test:integration
pnpm test:e2e

# Run tests with coverage
pnpm test:coverage

# Type check
pnpm typecheck

# Lint
pnpm lint

# Format code
pnpm format

# Run comprehensive tests (includes property-based, fuzzing, etc.)
pnpm test:comprehensive
```

## Development Workflow

### 1. Create a Branch

```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Changes

- Write code following our [coding standards](#coding-standards)
- Add tests for your changes
- Ensure all tests pass
- Update documentation if needed

### 3. Test Your Changes

```bash
# Run all tests
pnpm test:all

# Run linter
pnpm lint

# Type check
pnpm typecheck

# Build packages
pnpm build
```

### 4. Commit Your Changes

Follow our [commit message guidelines](#commit-messages):

```bash
git add .
git commit -m "feat: add support for importing from Windsurf"
```

### 5. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create pull request on GitHub
# Visit: https://github.com/state-org/state/pulls
```

## Coding Standards

### TypeScript

- Use **TypeScript strict mode**
- Avoid `any` types - use `unknown` or proper types
- Use interfaces for public APIs, types for internal
- Prefer `const` assertions
- Use type guards for runtime validation

```typescript
// ✅ Good
interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

function isMessage(value: unknown): value is Message {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'role' in value &&
    'content' in value &&
    'timestamp' in value
  )
}

// ❌ Bad
function processMessage(value: any) {
  return value.content
}
```

### Code Style

- Use **2 spaces** for indentation (no tabs)
- Use **single quotes** for strings
- Use **semicolon** for statements
- Maximum line length: **100 characters**
- Use **prettier** for formatting (configured in `.prettierrc`)

```typescript
// ✅ Good
const messages: Message[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'Hello, world!',
    timestamp: new Date().toISOString(),
  },
]

// ❌ Bad
const messages=[{id:"msg-1",role:"user",content:"Hello"}]
```

### Naming Conventions

- **Files**: kebab-case (`agent-file.ts`, `message-viewer.tsx`)
- **Variables/Functions**: camelCase (`getUserMessages()`, `messageCount`)
- **Classes/Interfaces**: PascalCase (`AgentFile`, `MessageViewer`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_MESSAGE_COUNT`, `DEFAULT_TIMEOUT`)
- **Types/Interfaces**: PascalCase, prefix with `I` only for interfaces if needed
- **Private members**: prefix with `_` (`_internalCache`, `_parseData()`)

### Error Handling

- Always handle errors gracefully
- Provide meaningful error messages
- Use custom error types for domain-specific errors
- Log errors appropriately

```typescript
// ✅ Good
export class AgentFileError extends Error {
  constructor(
    message: string,
    public code: string,
    public cause?: Error
  ) {
    super(message)
    this.name = 'AgentFileError'
  }
}

async function loadAgentFile(path: string): Promise<AgentFile> {
  try {
    const buffer = await fs.readFile(path)
    return await AgentFile.load(buffer)
  } catch (error) {
    throw new AgentFileError(
      `Failed to load agent file from ${path}`,
      'LOAD_FAILED',
      error as Error
    )
  }
}

// ❌ Bad
async function loadAgentFile(path: string) {
  return fs.readFile(path) // No error handling
}
```

### Async/Await

- Prefer `async/await` over promises
- Always handle promise rejections
- Use `Promise.all()` for parallel operations

```typescript
// ✅ Good
async function loadMultipleFiles(paths: string[]): Promise<AgentFile[]> {
  const results = await Promise.allSettled(
    paths.map((path) => loadAgentFile(path))
  )

  return results
    .filter((result) => result.status === 'fulfilled')
    .map((result) => (result as PromiseFulfilledResult<AgentFile>).value)
}

// ❌ Bad
function loadMultipleFiles(paths: string[]) {
  return paths.map((path) => loadAgentFile(path)) // Returns array of promises
}
```

### Comments and Documentation

- Use JSDoc for public APIs
- Comment complex logic
- Keep comments up-to-date
- Prefer self-documenting code over comments

```typescript
/**
 * Loads an .agent file from the specified path.
 *
 * @param path - The file path to load from
 * @returns Promise resolving to the loaded AgentFile
 * @throws {AgentFileError} If the file cannot be loaded or parsed
 *
 * @example
 * ```ts
 * const agentFile = await loadAgentFile('./conversation.agent')
 * const messages = agentFile.getConversation().messages
 * ```
 */
async function loadAgentFile(path: string): Promise<AgentFile> {
  // Implementation...
}
```

## Testing Guidelines

### Test Structure

```typescript
// packages/format/src/example.test.ts
import { describe, it, expect, beforeEach } from 'vitest'

describe('AgentFile', () => {
  let agentFile: AgentFile

  beforeEach(async () => {
    agentFile = await AgentFile.create({
      metadata: { title: 'Test' },
      sourceTool: { name: 'test', version: '1.0.0' },
    })
  })

  describe('addConversation', () => {
    it('should add messages to the conversation', async () => {
      const messages = [
        { id: '1', role: 'user', content: 'Hello', timestamp: '2024-01-01' },
      ]

      await agentFile.addConversation(messages)

      const conversation = agentFile.getConversation()
      expect(conversation.messages).toHaveLength(1)
      expect(conversation.messages[0].content).toBe('Hello')
    })

    it('should throw if messages array is empty', async () => {
      await expect(agentFile.addConversation([])).rejects.toThrow()
    })
  })
})
```

### Test Coverage

- **Target**: 95%+ code coverage
- All new code must have tests
- Test both positive and negative cases
- Test edge cases and error conditions

### Test Categories

1. **Unit Tests**: Test individual functions/classes
2. **Integration Tests**: Test interactions between components
3. **E2E Tests**: Test complete workflows
4. **Property-Based Tests**: Test invariants with random inputs
5. **Fuzzing Tests**: Test robustness with malformed inputs
6. **Performance Tests**: Verify performance targets

### Running Tests

```bash
# Run all tests
pnpm test:all

# Run specific test file
pnpm test packages/format/src/AgentFile.test.ts

# Run with coverage
pnpm test:coverage

# Run in watch mode
pnpm test --watch

# Run property-based tests
pnpm test:properties

# Run fuzzing tests
pnpm test:fuzz

# Run cross-platform tests
pnpm test:cross-platform
```

### Test Best Practices

- Use `describe` blocks to group related tests
- Use `beforeEach` for setup, `afterEach` for cleanup
- Use descriptive test names (`should X when Y`)
- Test one thing per test
- Avoid test interdependence
- Mock external dependencies
- Use fixtures for complex test data

## Plugin Development

### Creating a Plugin

See [Plugin API Documentation](plugin-api.md) for detailed guide.

### Plugin Template

```bash
# Use plugin template
pnpm create state-plugin my-importer

# or manually
mkdir state-plugin-my-importer
cd state-plugin-my-importer
pnpm init
pnpm add @state/format @state/plugin-api
```

### Plugin Structure

```
state-plugin-my-importer/
├── src/
│   └── index.ts          # Main plugin implementation
├── test/
│   └── index.test.ts     # Plugin tests
├── package.json
├── README.md             # Plugin documentation
├── LICENSE
└── tsconfig.json
```

### Plugin Requirements

- Must have **90%+ test coverage**
- Must pass all linter checks
- Must include comprehensive README
- Must handle errors gracefully
- Must support TypeScript types

## Pull Request Process

### Before Submitting

1. **Check existing issues** - Ensure there's an issue for your change
2. **Update documentation** - Update README, docs, or comments
3. **Add tests** - Ensure coverage remains 95%+
4. **Run all checks**:
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm test:all
   pnpm build
   ```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issue
Fixes #123

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All tests passing
- [ ] Coverage at 95%+

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Commits follow guidelines
```

### Review Process

1. **Automated checks** must pass (CI/CD)
2. **Code review** by at least one maintainer
3. **Testing** on all supported platforms
4. **Approval** before merge

### Merge Policies

- **Squash commits** for cleaner history
- **Rebase** if commit history needs cleanup
- **No merge commits** (use squash or rebase)
- **Delete branch** after merge

## Commit Messages

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Test changes
- `chore`: Build/process changes
- `ci`: CI/CD changes

### Examples

```bash
# Feature
feat(importer): add support for Windsurf Codeium exports

# Bug fix
fix(viewer): handle empty semantic map gracefully

# Documentation
docs(readme): update installation instructions

# Refactoring
refactor(format): extract ZIP parsing to separate module

# Performance
perf(encrypt): optimize large file encryption

# Breaking change
feat(format)!: change message ID format to UUID

BREAKING CHANGE: Message IDs are now UUIDs instead of sequential integers
```

### Guidelines

- Use **imperative mood** ("add" not "added" or "adds")
- **Lowercase** after `type(`
- **Do not** end subject line with period
- **Limit** subject line to 72 characters
- **Explain** what and why in body
- **Reference** issues in footer

## Getting Help

- **GitHub Issues**: https://github.com/state-org/state/issues
- **Discord**: https://discord.gg/state
- **Email**: hello@state.dev

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Invited to the contributors team
- Eligible for contributor swag

Thank you for contributing to State! 🎉
