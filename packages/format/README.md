# @state/format

Core .agent file format library with security features.

## Installation

```bash
npm install @state/format
```

## Usage

### Creating a .agent File

```typescript
import { AgentFile } from '@state/format';

// Create a new .agent file
const agentFile = await AgentFile.create({
  metadata: {
    title: 'My AI Conversation',
    language: 'TypeScript',
    project_name: 'My Project'
  },
  sourceTool: {
    name: 'claude',
    version: '1.0.0'
  }
});

// Add conversation
await agentFile.addConversation([
  {
    role: 'user',
    content: 'How do I use useEffect?',
    timestamp: new Date().toISOString()
  },
  {
    role: 'assistant',
    content: 'useEffect is a React hook...',
    timestamp: new Date().toISOString(),
    model: 'claude-3-opus-20240229'
  }
]);

// Add semantic map
await agentFile.addSemanticMap({
  files: [
    {
      path: 'src/App.tsx',
      language: 'typescript',
      functions: ['App', 'useEffect']
    }
  ]
});

// Save to disk
await agentFile.save('conversation.agent');
```

### Loading a .agent File

```typescript
import { AgentFile } from '@state/format';

// Load from file
const agentFile = await AgentFile.load('conversation.agent');

// Get manifest
const manifest = agentFile.getManifest();
console.log(manifest.metadata?.title);

// Validate
const validation = agentFile.validate();
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

### Security Features

```typescript
// Encryption
await agentFile.encrypt('password123');

// Signature verification
const isValid = await agentFile.verifySignature();

// Validation
const result = agentFile.validate();
console.log(result.valid, result.errors, result.warnings);
```

## API

### AgentFile

#### Static Methods

- `create(options?: CreateOptions): Promise<AgentFile>` - Create new .agent file
- `load(path: string): Promise<AgentFile>` - Load from disk
- `loadFromBuffer(buffer: Buffer): Promise<AgentFile>` - Load from buffer
- `validateManifest(manifest: unknown): ValidationResult` - Validate manifest

#### Instance Methods

- `addConversation(messages: Message[]): Promise<void>` - Add conversation
- `addSemanticMap(map: SemanticMap): Promise<void>` - Add semantic map
- `addTerminalHistory(sessions: TerminalSession[]): Promise<void>` - Add terminal history
- `addFuturePlan(plan: FuturePlan): Promise<void>` - Add future plan
- `addAsset(file: Buffer, path: string): Promise<void>` - Add asset file
- `save(path: string): Promise<void>` - Save to disk
- `getManifest(): Manifest` - Get manifest
- `validate(): ValidationResult` - Validate file
- `verifySignature(): Promise<boolean>` - Verify signature
- `encrypt(password: string): Promise<void>` - Encrypt file
- `decrypt(password: string): Promise<void>` - Decrypt file

## Security

- **ZIP bomb protection**: Compression ratio validation
- **Path traversal prevention**: Path validation
- **Size limits**: Maximum file and archive sizes
- **Encryption**: AES-256-GCM support
- **Signing**: Ed25519 signature support

## License

MIT
