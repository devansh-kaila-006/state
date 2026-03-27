# Contributing to .agent Format

**Version**: 1.0.0
**Last Updated**: 2026-03-27

---

## Overview

This document explains how to contribute to the .agent format specification, add support for new AI tools, and extend the format.

---

## Ways to Contribute

### 1. Add Support for a New AI Tool

Create an importer for a new AI coding tool.

#### Steps

1. **Research the tool**:
   - Document export mechanism
   - Review Terms of Service
   - Assess legal feasibility
   - Note data availability

2. **Create importer package**:
   ```bash
   mkdir packages/importer/tool-name
   cd packages/importer/tool-name
   npm init
   ```

3. **Implement importer interface**:
   ```typescript
   interface Importer {
     name: string;
     version: string;

     // Import from local data
     importFromLocal(path: string): Promise<AgentFile>;

     // Import from API (if available)
     importFromAPI(config: APIConfig): Promise<AgentFile>;

     // Validate data
     validate(data: unknown): ValidationResult;
   }
   ```

4. **Add tool to source_tool enum** in schema:
   ```json
   {
     "source_tool": {
       "name": {
         "enum": ["claude", "chatgpt", "manual", "your-tool"]
       }
     }
   }
   ```

5. **Write tests** with sample data
6. **Document usage** in user guide

#### Example: Adding Windsurf Importer

```typescript
// packages/importer/windsurf/src/index.ts
import { AgentFile } from '@state/format';

export class WindsurfImporter implements Importer {
  name = 'windsurf';
  version = '1.0.0';

  async importFromLocal(path: string): Promise<AgentFile> {
    // Read Windsurf local storage
    const conversations = await this.readConversations(path);

    // Create .agent file
    const agentFile = new AgentFile();
    agentFile.addConversation(conversations);

    return agentFile;
  }

  private async readConversations(path: string) {
    // Implementation specific to Windsurf
  }
}
```

---

### 2. Propose Format Changes

Extend or modify the .agent format.

#### Process

1. **Check existing issues** for similar proposals
2. **Create RFC document**:
   ```markdown
   # RFC: Feature Name

   ## Summary
   Brief description

   ## Motivation
   Why this change is needed

   ## Proposed Format
   JSON schema examples

   ## Backwards Compatibility
   Impact on existing files

   ## Migration Path
   How to upgrade

   ## Alternatives Considered
   Other approaches
   ```

3. **Submit RFC** as GitHub issue
4. **Gather feedback** from community
5. **Refine proposal** based on feedback
6. **Implementation** (if approved)

#### Format Change Guidelines

**MINOR version changes** (backwards compatible):
- Adding optional fields
- Adding new source tools
- Adding new metadata
- Extending enums

**MAJOR version changes** (breaking):
- Removing fields
- Changing field types
- Restructuring format
- Changing required fields

---

### 3. Add New Components

Add new components to the .agent archive structure.

#### Steps

1. **Define component schema**:
   ```json
   {
     "new_component": {
       "type": "object",
       "required": ["field1", "field2"],
       "properties": {
         "field1": { "type": "string" },
         "field2": { "type": "number" }
       }
     }
   }
   ```

2. **Update manifest.json** to include component:
   ```json
   {
     "manifest": {
       "components": [
         { "path": "new_component/data.json", "sha256": "..." }
       ]
     }
   }
   ```

3. **Implement reader/writer**:
   ```typescript
   class AgentFile {
     addNewComponent(data: NewComponent): void {
       // Implementation
     }

     getNewComponent(): NewComponent {
       // Implementation
     }
   }
   ```

4. **Add tests** for new component
5. **Document** component usage

---

### 4. Improve Security

Enhance security features of the format.

#### Areas

- **Encryption**: New algorithms, key derivation
- **Signatures**: New signature schemes
- **Validation**: Stricter validation rules
- **Sanitization**: Input sanitization

#### Process

1. **Research** security best practices
2. **Propose** changes with security rationale
3. **Implement** with security review
4. **Test** with security test suite
5. **Document** security implications

---

### 5. Extend Metadata

Add new metadata fields to the format.

#### Guidelines

**Add to manifest.metadata**:
```json
{
  "manifest": {
    "metadata": {
      "existing_field": "...",
      "new_field": "value"
    }
  }
}
```

**Best practices**:
- Use descriptive field names
- Provide clear documentation
- Make fields optional when possible
- Include examples

---

## Code Standards

### TypeScript

- Use strict mode
- Provide type definitions
- Document public APIs
- Follow naming conventions

### Testing

- Unit tests for all functions
- Integration tests for workflows
- Security tests for validation
- Property-based tests for invariants

### Documentation

- JSDoc for all public APIs
- README for each package
- Examples for complex features
- Migration guides for changes

---

## Submitting Changes

### Pull Request Process

1. **Fork** the repository
2. **Create branch** for your change:
   ```bash
   git checkout -b feature/your-feature
   ```
3. **Make changes** following standards
4. **Write tests** for your changes
5. **Update documentation**
6. **Submit PR** with description:
   ```markdown
   ## Summary
   Brief description of changes

   ## Type
   - [ ] Bug fix
   - [ ] Feature
   - [ ] Breaking change
   - [ ] Documentation

   ## Testing
   How changes were tested

   ## Checklist
   - [ ] Tests pass
   - [ ] Documentation updated
   - [ ] Schema updated (if format change)
   ```

### Review Process

1. **Automated checks** (CI/CD)
2. **Code review** by maintainers
3. **Security review** (for sensitive changes)
4. **Approval** required for:
   - Format changes
   - Security modifications
   - Breaking changes

---

## Testing Guidelines

### Unit Tests

```typescript
describe('AgentFile', () => {
  it('should create valid .agent file', async () => {
    const agentFile = new AgentFile();
    await agentFile.addConversation(testMessages);
    await agentFile.save('/tmp/test.agent');

    const loaded = await AgentFile.load('/tmp/test.agent');
    expect(loaded.validate().valid).toBe(true);
  });
});
```

### Security Tests

```typescript
describe('Security', () => {
  it('should reject ZIP bombs', async () => {
    const malicious = createZipBomb();
    await expect(
      AgentFile.load(malicious)
    ).rejects.toThrow('ZIP bomb detected');
  });

  it('should prevent path traversal', async () => {
    const malicious = createPathTraversalZip();
    await expect(
      AgentFile.load(malicious)
    ).rejects.toThrow('Path traversal detected');
  });
});
```

### Property-Based Tests

```typescript
describe('Properties', () => {
  test('round-trip serialization', () => {
    fc.assert(fc.property(fc.object(), async (data) => {
      const agentFile = new AgentFile();
      agentFile.addConversation(data);

      const buffer = await agentFile.serialize();
      const loaded = await AgentFile.deserialize(buffer);

      expect(loaded).toEqual(agentFile);
    }));
  });
});
```

---

## Documentation Standards

### README Structure

```markdown
# Package Name

Brief description

## Installation
npm install package-name

## Usage
\`\`\`typescript
import { Package } from 'package-name';
\`\`\`

## API
### Method Name
Description

**Parameters**:
- `param1`: Description

**Returns**: Description

## Examples
Detailed examples

## Contributing
Link to contributing guide
```

### JSDoc Comments

```typescript
/**
 * Creates a new .agent file
 *
 * @param options - Configuration options
 * @param options.metadata - File metadata
 * @param options.encryption - Encryption settings
 *
 * @returns Promise that resolves to AgentFile instance
 *
 * @example
 * ```typescript
 * const agentFile = await AgentFile.create({
 *   metadata: { title: 'My Conversation' }
 * });
 * ```
 */
async create(options?: CreateOptions): Promise<AgentFile>
```

---

## Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Welcome new contributors
- Focus on what is best for the community

### Getting Help

- Read documentation first
- Search existing issues
- Ask questions in discussions
- Be patient with responses

---

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS file
- Credited in release notes
- Thanked in announcements

---

## License

By contributing, you agree that your contributions will be licensed under the **MIT License**.

---

## Resources

- [Format Specification](./schema.json)
- [Versioning Strategy](./versioning.md)
- [Main Repository](https://github.com/state-project/agent)
- [Discord Community](https://discord.gg/state)
- [Documentation](https://docs.state.dev)

---

**Questions?** Open an issue or start a discussion!

**Maintainers**: State Project Contributors
**License**: MIT
