# @state/importer-manual

Manual/clipboard importer for .agent files. Universal fallback importer for tools without APIs or ad-hoc imports.

## Features

- 📋 **Clipboard Import**: Import directly from system clipboard
- 🎯 **Auto-Detection**: Automatically detects conversation format
- 📝 **Multiple Formats**: Supports Claude JSON, ChatGPT markdown, and generic markdown
- 🔧 **Manual Input**: Paste or type conversations directly
- ⚡ **Fast**: No API calls or external dependencies
- 🛡️ **Robust**: Handles malformed input gracefully with warnings

## Installation

```bash
pnpm add @state/importer-manual
```

## Usage

### Clipboard Import

Import conversation from clipboard:

```typescript
import { importFromClipboard } from '@state/importer-manual';

const result = await importFromClipboard({
  title: 'My Conversation',
  language: 'TypeScript'
});

console.log(`Imported ${result.messageCount} messages`);
console.log(`Detected format: ${result.format}`);

if (result.warnings.length > 0) {
  console.warn('Warnings:', result.warnings);
}

await result.agentFile.save('my-conversation.agent');
```

### Text Import

Import from text string:

```typescript
import { importFromText } from '@state/importer-manual';

const text = `
### User
How do I create a React component?

### Assistant
Here's a simple React component:

\`\`\`tsx
function Hello() {
  return <div>Hello, world!</div>;
}
\`\`\`
`;

const result = await importFromText(text, {
  title: 'React Component Tutorial',
  language: 'TypeScript'
});

await result.agentFile.save('react-tutorial.agent');
```

### Format Detection

Check what format will be detected:

```typescript
import { detectFormat } from '@state/importer-manual';

const format = detectFormat(text);
console.log(`Detected: ${format}`);
// Outputs: 'claude-json' | 'chatgpt-markdown' | 'generic-markdown' | 'unknown'
```

## Supported Formats

### 1. Claude JSON

Official Claude Code export format:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "How do I center a div?",
      "timestamp": "2024-01-01T00:00:00.000Z"
    },
    {
      "role": "assistant",
      "content": "To center a div in CSS...",
      "model": "claude-3-opus"
    }
  ]
}
```

### 2. ChatGPT Markdown

ChatGPT-style markdown with bold role markers:

```markdown
**User:** How do I center a div?

**Assistant:** To center a div in CSS, you can use flexbox:

```css
.container {
  display: flex;
  justify-content: center;
  align-items: center;
}
```
```

### 3. Generic Markdown

Generic markdown conversation with headers:

```markdown
### User
How do I center a div?

### Assistant
To center a div in CSS, you can use flexbox:

```css
.container {
  display: flex;
  justify-content: center;
  align-items: center;
}
```
```

Or with list markers:

```markdown
- User: How do I center a div?

- Assistant: To center a div in CSS, you can use flexbox.
```

### 4. Unknown Format

If no format is detected, the entire text is treated as a single user message:

```typescript
const result = await importFromText('Just some random text');

// Results in:
// {
//   role: 'user',
//   content: 'Just some random text'
// }
```

## CLI Usage

### Import from Clipboard

```typescript
import { cliImportClipboard } from '@state/importer-manual';

await cliImportClipboard({
  output: 'my-conversation.agent',
  title: 'Clipboard Import',
  language: 'TypeScript'
});
```

### Import from Text

```typescript
import { cliImportText } from '@state/importer-manual';

await cliImportText({
  text: myConversationText,
  output: 'my-conversation.agent',
  title: 'My Conversation'
});
```

### Show Clipboard Content

Debug clipboard content:

```typescript
import { cliShowClipboard } from '@state/importer-manual';

await cliShowClipboard();
// Outputs:
// Clipboard content:
// ---
// **User:** Hello
// **Assistant:** Hi there!
// ---
// Total length: 32 characters
// Detected format: chatgpt-markdown
```

## Advanced Options

### Disable Auto-Detection

Force manual parsing:

```typescript
const result = await importFromText(text, {
  autoDetect: false  // Will treat as unknown format
});
```

### Custom Metadata

```typescript
const result = await importFromText(text, {
  title: 'Custom Title',
  language: 'Python',
  model: 'claude-3-opus-20240229'
});
```

## Error Handling

### Clipboard Access Errors

```typescript
import { importFromClipboard, validateClipboardAccess } from '@state/importer-manual';

// Check clipboard access first
if (!await validateClipboardAccess()) {
  console.error('Cannot access clipboard');
  console.error('On Linux, install xclip or xsel');
  console.error('On macOS, grant Terminal permissions');
  console.error('On Windows, make sure you\'re in a supported terminal');
  process.exit(1);
}

try {
  const result = await importFromClipboard();
  // ...
} catch (error) {
  console.error('Failed to import:', error.message);
}
```

### Parse Warnings

The importer collects warnings instead of failing:

```typescript
const result = await importFromText(malformedText);

if (result.warnings.length > 0) {
  console.warn('Import completed with warnings:');
  for (const warning of result.warnings) {
    console.warn(`  ⚠ ${warning}`);
  }
}

// Import still succeeds if possible
await result.agentFile.save('output.agent');
```

## Utilities

### List Supported Formats

```typescript
import { getSupportedFormats } from '@state/importer-manual';

const formats = getSupportedFormats();

for (const fmt of formats) {
  console.log(`${fmt.format}: ${fmt.description}`);
  console.log(`  Example: ${fmt.example}`);
}
```

### Validate Clipboard Access

```typescript
import { validateClipboardAccess } from '@state/importer-manual';

const canAccess = await validateClipboardAccess();
console.log(`Clipboard access: ${canAccess ? 'OK' : 'FAILED'}`);
```

## Clipboard Permissions

### macOS

Grant Terminal permission to access clipboard:

1. Open **System Preferences**
2. Go to **Security & Privacy** → **Privacy**
3. Select **Automation** or **Full Disk Access**
4. Add **Terminal** or your preferred terminal app

### Linux

Install clipboard utilities:

```bash
# Debian/Ubuntu
sudo apt-get install xclip

# Fedora
sudo dnf install xclip

# Arch
sudo pacman -S xclip
```

### Windows

Clipboard access should work by default in most terminals.

## Use Cases

### 1. Cursor Conversations

Since Cursor doesn't have an export API, copy the conversation and use the clipboard importer:

1. Select entire conversation in Cursor
2. Copy (Ctrl/Cmd + C)
3. Run clipboard importer

### 2. Web Chat Interfaces

For AI tools that only work in the browser:

1. Select and copy conversation
2. Import via clipboard

### 3. Ad-Hoc Documentation

Convert markdown documentation into .agent format:

```typescript
const doc = `
# Troubleshooting Guide

## Issue: Cannot connect to database

## Solution
Check your connection string:

\`\`\`env
DATABASE_URL=postgresql://localhost:5432/mydb
\`\`\`
`;

const result = await importFromText(doc, {
  title: 'Troubleshooting Guide'
});
```

### 4. Testing Formats

Test if your conversation format is supported:

```typescript
import { detectFormat } from '@state/importer-manual';

const format = detectFormat(myText);
console.log(`Format: ${format}`);
```

## Limitations

- **No Timestamps**: Markdown formats don't include timestamps (defaults to now)
- **No Model Info**: Generic formats don't specify models (can be set manually)
- **Tool Usage**: Tool calls are not extracted from markdown formats
- **File Uploads**: Attached files are not preserved
- **Code Execution**: Results of code execution are not captured

## Best Practices

1. **Always check warnings**: Review warnings to ensure data was parsed correctly
2. **Set explicit titles**: Auto-generated titles may not be meaningful
3. **Specify language**: Helps with code highlighting and search
4. **Test format detection**: Use `detectFormat()` before importing large conversations
5. **Keep raw backups**: Save original text before importing

## License

MIT
