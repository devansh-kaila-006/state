# @state/importer-claude

Claude Code importer for .agent files. Import conversations from Claude Code local storage or the Anthropic API.

## Features

- 📁 **Local Storage Import**: Import from Claude Code's local conversations directory
- 🔑 **API Import**: Import directly from Anthropic API (planned)
- 🔍 **Search & Filter**: Search conversations by title or ID
- 🎯 **Selective Import**: Import specific conversations with filters
- 🛠️ **Terminal History**: Optionally include terminal sessions (planned)
- 📦 **Artifacts**: Optionally include generated artifacts (planned)

## Installation

```bash
pnpm add @state/importer-claude
```

## Usage

### Local Storage Import

Import all conversations from Claude Code local storage:

```typescript
import { importFromLocal } from '@state/importer-claude';

const agentFiles = await importFromLocal();

for (const agentFile of agentFiles) {
  const manifest = agentFile.getManifest();
  console.log(`Imported: ${manifest.metadata?.title}`);

  await agentFile.save(`${manifest.metadata?.title}.agent`);
}
```

Import with options:

```typescript
import { importFromLocal } from '@state/importer-claude';

const agentFiles = await importFromLocal({
  maxConversations: 10,          // Limit to 10 most recent
  includeTerminalHistory: true,   // Include terminal sessions
  includeArtifacts: true          // Include generated files
});
```

### List Available Conversations

```typescript
import { listLocalConversations } from '@state/importer-claude';

const conversations = await listLocalConversations();

for (const conv of conversations) {
  console.log(`${conv.id}: ${conv.title || 'Untitled'}`);
  console.log(`  Created: ${conv.created_at}`);
}
```

### Search Conversations

```typescript
import { searchLocalConversations } from '@state/importer-claude';

const results = await searchLocalConversations('react hooks');

console.log(`Found ${results.length} matching conversations`);
```

### Get Specific Conversation

```typescript
import { getLocalConversation } from '@state/importer-claude';

const conversation = await getLocalConversation('conv-12345');

if (conversation) {
  console.log(`Title: ${conversation.title}`);
  console.log(`Messages: ${conversation.messages.length}`);
}
```

### CLI Usage

The CLI wrapper provides convenient command-line access:

```typescript
import { cliImportLocal } from '@state/importer-claude';

// Import all conversations
await cliImportLocal({
  output: './exports',  // Output directory
  includeTerminal: true,
  includeArtifacts: true
});
```

## Claude Code Storage Locations

Claude Code stores conversations in platform-specific locations:

- **Windows**: `%APPDATA%\claude\conversations\`
- **macOS**: `~/.claude/conversations/`
- **Linux**: `~/.claude/conversations/`

Each conversation is stored in its own directory with a `conversation.json` file.

## API Import (Planned)

Direct API import from Anthropic is planned for future releases:

```typescript
import { importFromAPI } from '@state/importer-claude';

const agentFile = await importFromAPI({
  apiKey: 'sk-ant-...',
  conversationIds: ['conv-12345'],
  maxMessages: 100
});

await agentFile.save('claude-conversation.agent');
```

## Data Mapping

The importer maps Claude Code data to .agent format as follows:

| Claude Code Field | .agent Field |
|------------------|--------------|
| `id` | `message.id` |
| `role` | `message.role` |
| `content` | `message.content` |
| `timestamp` / `created_at` | `message.timestamp` |
| `model` | `message.model` |
| `tools_used` | `message.tools_used` |
| `citations` | `message.citations` |
| `title` | `metadata.title` |
| `context.system_prompt` | (future: separate component) |

## Error Handling

The importer includes robust error handling:

```typescript
import { importFromLocal, isClaudeInstalled } from '@state/importer-claude';

// Check if Claude Code is installed
if (!await isClaudeInstalled()) {
  console.error('Claude Code not found');
  process.exit(1);
}

// Import with automatic error recovery
const agentFiles = await importFromLocal();

// Failed conversations are logged as warnings
// and don't stop the import process
```

## Utilities

### Validate API Key

```typescript
import { validateAPIKey } from '@state/importer-claude';

if (validateAPIKey('sk-ant-...')) {
  console.log('Valid API key');
}
```

### Get Claude Version

```typescript
import { getClaudeVersion } from '@state/importer-claude';

const version = await getClaudeVersion();
console.log(`Claude Code version: ${version}`);
```

### Get Claude Paths

```typescript
import { getClaudePaths } from '@state/importer-claude';

const paths = getClaudePaths();
console.log('Conversations:', paths.conversations);
console.log('Config:', paths.config);
console.log('Logs:', paths.logs);
```

## License

MIT
