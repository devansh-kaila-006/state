# @state/importer-chatgpt

ChatGPT importer for .agent files. Import conversations from official ChatGPT data exports.

## Features

- 📦 **ZIP Import**: Import from official ChatGPT export ZIP files
- 🔍 **Conversation List**: Browse conversations before importing
- 🎯 **Selective Import**: Import specific conversations or limit count
- 🛠️ **Tool Detection**: Detects Code Interpreter, DALL-E, and Browsing usage
- 💻 **Code Language**: Auto-detects programming languages in code blocks
- 🔐 **Validation**: Validates export format before importing

## Installation

```bash
pnpm add @state/importer-chatgpt
```

## Usage

### Basic Import

Import all conversations from a ChatGPT export ZIP:

```typescript
import { importFromExport } from '@state/importer-chatgpt';

const agentFiles = await importFromExport('./chatgpt-export.zip');

console.log(`Imported ${agentFiles.length} conversations`);

for (const agentFile of agentFiles) {
  const manifest = agentFile.getManifest();
  await agentFile.save(`${manifest.metadata?.title}.agent`);
}
```

### Limited Import

Import only the first N conversations:

```typescript
import { importFromExport } from '@state/importer-chatgpt';

const agentFiles = await importFromExport('./chatgpt-export.zip', {
  maxConversations: 10  // Import only 10 most recent
});
```

### With Tool Support

Include Code Interpreter outputs and DALL-E images:

```typescript
import { importFromExport } from '@state/importer-chatgpt';

const agentFiles = await importFromExport('./chatgpt-export.zip', {
  includeCodeInterpreter: true,  // Parse code execution results
  includeDALLEImages: true       // Download and embed images
});
```

## Explore Before Importing

### Validate Export

Check if a file is a valid ChatGPT export:

```typescript
import { validateExportFile } from '@state/importer-chatgpt';

const isValid = await validateExportFile('./chatgpt-export.zip');

if (!isValid) {
  console.error('Invalid ChatGPT export file');
}
```

### Get Conversation Count

```typescript
import { getConversationCount } from '@state/importer-chatgpt';

const count = await getConversationCount('./chatgpt-export.zip');

console.log(`Total conversations: ${count}`);
```

### List Conversations

```typescript
import { listConversations } from '@state/importer-chatgpt';

const conversations = await listConversations('./chatgpt-export.zip');

for (const conv of conversations) {
  console.log(`${conv.title} (${conv.id})`);
  console.log(`  ${conv.timestamp}`);
}
```

## CLI Usage

```typescript
import { cliImport } from '@state/importer-chatgpt';

await cliImport({
  exportPath: './chatgpt-export.zip',
  output: './exports',
  includeCodeInterpreter: true,
  includeDALLEImages: false
});
```

## ChatGPT Export Format

ChatGPT exports are ZIP files containing:

```
chatgpt-export.zip
└── conversations.json  // Main data file
```

The JSON contains an array of conversations with a tree structure:

```typescript
{
  "conversations": [
    {
      "title": "Conversation title",
      "conversation_id": "uuid",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "mapping": {
        "node-id-1": {
          "id": "node-id-1",
          "message": {
            "id": "msg-id",
            "content": [
              {
                "content_type": "text",
                "parts": ["Message content"]
              }
            ],
            "author": {
              "role": "user"
            },
            "create_time": 1704067200,
            "metadata": {
              "model_slug": "gpt-4"
            }
          },
          "parent": null,
          "children": ["node-id-2"]
        }
      },
      "current_node": "node-id-1"
    }
  ]
}
```

## Data Mapping

The importer maps ChatGPT data to .agent format as follows:

| ChatGPT Field | .agent Field |
|--------------|--------------|
| `conversation_id` | `metadata.project_name` |
| `title` | `metadata.title` |
| `message.id` | `message.id` |
| `author.role` | `message.role` |
| `content[].parts[]` | `message.content` |
| `create_time` | `message.timestamp` |
| `metadata.model_slug` | `message.model` |
| `plugins[]` | `message.tools_used` |

## Tool Detection

The importer detects ChatGPT plugins and tools:

### Code Interpreter

```typescript
{
  name: 'code_interpreter',
  input: {
    code: 'print("Hello")',
    execution_count: 1
  }
}
```

### DALL-E

```typescript
{
  name: 'dalle',
  input: {
    prompt: 'A cat sitting on a wall'
  }
}
```

### Browsing

```typescript
{
  name: 'browser',
  input: {
    query: 'latest news'
  },
  output: {
    results: [/* search results */]
  }
}
```

## Code Language Detection

The importer automatically detects programming languages in code blocks:

- **Python**: `def`, `import`, `.py`
- **JavaScript**: `function`, `{}`, no `interface`
- **TypeScript**: `interface`, `class`, `function`
- **Rust**: `fn`, `pub`, `impl`
- **Go**: `func`, `package`, `{`
- **Java**: `public class`, `extends`
- **C++**: (patterns)

## Error Handling

Failed conversations are logged as warnings but don't stop the import:

```typescript
import { importFromExport } from '@state/importer-chatgpt';

const agentFiles = await importFromExport('./export.zip');

// Console warnings for failed conversations:
// "Failed to import conversation abc-123: Invalid message format"

// Successfully imported conversations are still returned
```

## How to Export from ChatGPT

1. Go to [chat.openai.com](https://chat.openai.com)
2. Click on your profile (bottom left)
3. Select **Settings**
4. Click **Export data**
5. Wait for the email with download link
6. Download the ZIP file
7. Use this importer to convert to .agent format

## Limitations

- **Code Interpreter**: Output data is extracted but code execution results are not included (requires additional parsing)
- **DALL-E Images**: Image URLs are preserved but images are not downloaded (requires `includeDALLEImages` option)
- **Custom Instructions**: Not currently preserved in .agent format
- **Archived Conversations**: Included in export but not tagged differently

## License

MIT
