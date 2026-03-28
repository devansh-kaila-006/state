# Testing Documentation

Comprehensive testing infrastructure for the State (.agent) project.

## Overview

The testing suite includes:
- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions and workflows
- **E2E Tests**: Test complete user workflows across the system
- **Performance Tests**: Benchmark critical operations
- **Security Audits**: Automated security scanning

## Test Structure

```
test/
├── setup.ts                          # Global test configuration
├── test-data-generator.ts            # Test data generation utilities
├── e2e/
│   └── complete-workflows.test.ts   # End-to-end workflow tests
packages/
├── format/src/
│   ├── *.test.ts                    # Unit tests for format package
│   └── performance.test.ts          # Performance benchmarks
├── importer/claude/src/
│   └── index.test.ts                # Claude importer tests
├── importer/chatgpt/src/
│   └── index.test.ts                # ChatGPT importer tests
├── importer/manual/src/
│   └── index.test.ts                # Manual importer tests
├── cli/src/
│   └── __tests__/
│       └── integration.test.ts      # CLI integration tests
└── viewer-web/src/
    └── __tests__/
        └── integration.test.tsx     # Web viewer integration tests
```

## Running Tests

### Run All Tests

```bash
pnpm test
```

### Run Specific Test Types

```bash
# Unit tests only
pnpm test:unit

# Integration tests only
pnpm test:integration

# E2E tests only
pnpm test:e2e

# All tests (unit + integration + e2e)
pnpm test:all
```

### Watch Mode

```bash
# Run tests in watch mode (re-run on file changes)
pnpm test:watch

# Watch with UI
pnpm test:ui
```

### Coverage Report

```bash
# Generate coverage report
pnpm test:coverage

# Report outputs to:
# - Terminal (text summary)
# - coverage/ directory (HTML report)
# - coverage/lcov.info (for CI tools)
```

### Performance Benchmarks

```bash
# Run performance tests
pnpm test:benchmark
```

## Test Data Generation

### Generate Test Corpus

Generate a set of realistic test files:

```bash
# Generate 20 test files in ./test-corpus
pnpm test:generate-corpus

# Custom directory and count
tsx test/test-data-generator.ts corpus ./my-corpus 50
```

### Generate Large Test File

Generate a large file for performance testing:

```bash
# Generate file with 1000 messages
pnpm test:generate-large

# Custom size
tsx test/test-data-generator.ts large 5000
```

## Test Coverage Goals

Current thresholds (configured in `vitest.config.ts`):

- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

### View Coverage

After running `pnpm test:coverage`:

1. Open `coverage/index.html` in a browser
2. Navigate through packages to see detailed coverage
3. Look for red/pink indicators to find untested code

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest'
import { encrypt, decrypt } from '@state/format'

describe('Encryption', () => {
  it('should encrypt and decrypt data', () => {
    const data = Buffer.from('Hello, World!')
    const password = 'test-password'

    const encrypted = encrypt(data, { password })
    const decrypted = decrypt(encrypted, password)

    expect(Buffer.compare(data, decrypted)).toBe(0)
  })
})
```

### Integration Test Example

```typescript
import { describe, it, expect } from 'vitest'
import { AgentFile } from '@state/format'

describe('File Import Workflow', () => {
  it('should create and load .agent file', async () => {
    const agentFile = await AgentFile.create({
      metadata: { title: 'Test' },
      sourceTool: { name: 'test', version: '1.0.0' },
    })

    await agentFile.addConversation([
      { id: 'msg-1', role: 'user', content: 'Hello', timestamp: new Date().toISOString() },
    ])

    const buffer = await agentFile.saveToBuffer()
    const loaded = await AgentFile.load(buffer)

    expect(loaded.getConversation().messages).toHaveLength(1)
  })
})
```

### E2E Test Example

```typescript
describe('Complete Workflow: Import → View → Export', () => {
  it('should complete full workflow', async () => {
    // 1. Import from text
    const messages = parseText('**User:** Hello\n\n**Assistant:** Hi!')

    // 2. Create .agent file
    const agentFile = await AgentFile.create({ ... })
    await agentFile.addConversation(messages)
    const buffer = await agentFile.saveToBuffer()

    // 3. View the file
    const loaded = await AgentFile.load(buffer)
    expect(loaded.getConversation().messages).toHaveLength(2)

    // 4. Export to markdown
    const markdown = exportToMarkdown(loaded)
    expect(markdown).toContain('Hello')
  })
})
```

## Test Utilities

### Test Data Generator

```typescript
import { generateTestAgentFile } from './test-data-generator'

// Generate a realistic test file
const buffer = await generateTestAgentFile('Test Conversation', {
  messageCount: 20,
  includeSemanticMap: true,
  includeTerminal: true,
  includePlan: true,
  language: 'TypeScript',
})
```

### Mock File System

```typescript
import * as fs from 'fs/promises'
import * as path from 'path'

// Create temporary test directory
const testDir = path.join(process.cwd(), 'test-temp')
await fs.mkdir(testDir, { recursive: true })

// Clean up after test
await fs.rm(testDir, { recursive: true, force: true })
```

## Security Testing

### Run Security Audit

```bash
# Full security audit
pnpm audit:security

# Dependency vulnerability scan
pnpm audit:dependencies

# License check
pnpm audit:licenses
```

### Security Audit Checks

The security audit (`scripts/security-audit.ts`) checks for:

1. **Hardcoded Secrets**
   - Passwords, API keys, tokens
   - GitHub tokens, AWS keys
   - OpenAI API keys

2. **Vulnerable Dependencies**
   - Known CVEs in dependencies
   - Outdated packages with security issues

3. **Dangerous Code Patterns**
   - `eval()` usage
   - `innerHTML` assignments
   - Command execution without validation
   - Weak random number generation

4. **Exposed Sensitive Files**
   - `.env` files in git
   - Private keys tracked
   - Missing `.gitignore` entries

5. **Input Validation**
   - File operations without validation
   - User input not sanitized

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm test:all
      - run: pnpm test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Debugging Tests

### Run Tests in Debug Mode

```bash
# Enable debug output
DEBUG=1 pnpm test

# Run single test file
pnpm test packages/format/src/encryption.test.ts

# Run tests matching pattern
pnpm test --grep "encryption"
```

### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run", "--reporter=verbose"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

## Best Practices

### 1. Test Isolation

Each test should be independent:

```typescript
beforeEach(async () => {
  // Fresh state for each test
  await setupTestData()
})

afterEach(async () => {
  // Clean up after each test
  await cleanupTestData()
})
```

### 2. Descriptive Test Names

```typescript
// Good ✅
it('should reject files larger than 100MB', async () => { ... })

// Bad ❌
it('should work', async () => { ... })
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('should calculate total correctly', () => {
  // Arrange
  const cart = new Cart()
  cart.addItem({ price: 10 }, 2)

  // Act
  const total = cart.calculateTotal()

  // Assert
  expect(total).toBe(20)
})
```

### 4. Test Edge Cases

```typescript
describe('Input Validation', () => {
  it('should handle empty input', () => { ... })
  it('should handle null input', () => { ... })
  it('should handle very large input', () => { ... })
  it('should handle special characters', () => { ... })
})
```

### 5. Mock External Dependencies

```typescript
import { vi } from 'vitest'

vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}))
```

## Performance Benchmarking

### Running Benchmarks

```bash
pnpm test:benchmark
```

### Benchmark Results

Results are output to console:

```
AgentFile Creation
  ✓ should create quickly (45ms)
  ✓ should create with 1000 messages (234ms)

Encryption
  ✓ should encrypt 1MB quickly (567ms)
  ✓ should decrypt 1MB quickly (234ms)
```

## Troubleshooting

### Tests Timing Out

Increase timeout in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    testTimeout: 30000, // 30 seconds
  },
})
```

### Import Errors

Check `tsconfig.paths` and `vitest.config.ts` alias configuration:

```typescript
resolve: {
  alias: {
    '@state/format': path.resolve(__dirname, './packages/format/src'),
  },
}
```

### Coverage Not Generated

Install coverage provider:

```bash
pnpm add -D @vitest/coverage-v8
```

## Contributing Tests

When adding new features:

1. Write tests first (TDD approach)
2. Ensure coverage doesn't drop below thresholds
3. Add integration tests for workflows
4. Update this documentation if adding new test types

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Node.js Test Best Practices](https://github.com/goldbergyoni/nodebestpractices)
