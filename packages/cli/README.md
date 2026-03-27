# @state/cli

Command-line interface for .agent files - Import, view, validate, and export AI conversations.

## Installation

```bash
pnpm install -g @state/cli
```

Or use with npx:

```bash
npx @state/cli <command>
```

## Quick Start

```bash
# Show CLI information
state info

# Import from Claude Code
state import claude

# Import from ChatGPT export
state import chatgpt ./export.zip

# Import from clipboard
state import clipboard

# View .agent file
state view conversation.agent

# Validate .agent file
state validate conversation.agent

# Export to markdown
state export conversation.agent -f md

# Create new .agent file
state init --title "My Conversation" --language TypeScript
```

## Commands

### `state info`

Show information about the State CLI and available importers.

```bash
state info
```

**Output**:
- CLI version
- Available importers
- Importer status
- Usage examples

---

### `state import`

Import conversations into .agent format.

#### Import from Claude Code

Import conversations from Claude Code local storage:

```bash
state import claude [output] [options]
```

**Options**:
- `-m, --max <number>` - Maximum number of conversations to import (default: 10)
- `-t, --include-terminal` - Include terminal history
- `-a, --include-artifacts` - Include generated artifacts

**Examples**:
```bash
# Import latest 10 conversations
state import claude

# Import latest 5 conversations with terminal history
state import claude -m 5 -t

# Import to specific file
state import claude my-conversations.agent
```

**Storage Locations**:
- Windows: `%APPDATA%\claude\conversations\`
- macOS: `~/.claude/conversations/`
- Linux: `~/.claude/conversations/`

---

#### Import from ChatGPT Export

Import from official ChatGPT export ZIP file:

```bash
state import chatgpt <exportPath> [output] [options]
```

**Options**:
- `-m, --max <number>` - Maximum number of conversations to import (default: 10)
- `-c, --include-code` - Include Code Interpreter outputs
- `-d, --include-dalle` - Include DALL-E images

**Examples**:
```bash
# Import from ChatGPT export
state import chatgpt ./chatgpt-export.zip

# Import 5 conversations with code interpreter data
state import chatgpt ./export.zip -m 5 -c

# Export ChatGPT data:
# 1. Go to chat.openai.com
# 2. Click profile → Settings → Export data
# 3. Download ZIP file
# 4. Run: state import chatgpt ./export.zip
```

---

#### Import from Clipboard

Import conversation from system clipboard:

```bash
state import clipboard [output] [options]
```

**Options**:
- `-t, --title <title>` - Set conversation title
- `-l, --language <language>` - Set programming language

**Examples**:
```bash
# Import from clipboard
state import clipboard

# Import with custom title
state import clipboard -t "Cursor Conversation"

# Import and specify language
state import clipboard -l Python
```

**Use Cases**:
- Cursor conversations (copy-paste)
- AI tools without official export
- Partial conversations
- Quick ad-hoc imports

---

#### Import from Text

Import conversation from text string:

```bash
state import text <text> [options]
```

**Options**:
- `-o, --output <file>` - Output file path
- `-t, --title <title>` - Set conversation title
- `-l, --language <language>` - Set programming language

**Examples**:
```bash
# Import from text
state import text "User: Hello\nAssistant: Hi!"

# Import with options
state import text "conversation here" -o output.agent -t "Chat" -l TypeScript
```

---

### `state view`

View .agent file information.

```bash
state view <file> [options]
```

**Options**:
- `-i, --info` - Show detailed file information
- `-w, --web` - Open in web viewer

**Examples**:
```bash
# View file summary
state view conversation.agent

# Show detailed information
state view conversation.agent --info

# Open in web viewer
state view conversation.agent --web
```

**Output** (with `--info`):
- Format version
- Creation date
- Source tool
- Metadata (title, project, language)
- Message count
- Components

---

### `state validate`

Validate .agent file format and integrity.

```bash
state validate <file> [options]
```

**Options**:
- `-v, --verbose` - Show detailed validation results

**Examples**:
```bash
# Validate file
state validate conversation.agent

# Show detailed validation
state validate conversation.agent --verbose
```

**Checks**:
- Valid ZIP format
- Manifest structure
- Required components
- File integrity
- Schema validation

---

### `state export`

Export .agent file to other formats.

```bash
state export <file> [options]
```

**Options**:
- `-f, --format <format>` - Export format: `md` (markdown) or `json` (default: `md`)
- `-o, --output <file>` - Output file path

**Examples**:
```bash
# Export to markdown
state export conversation.agent

# Export to JSON
state export conversation.agent -f json

# Export with custom filename
state export conversation.agent -o my-conversation.md
```

**Formats**:
- **Markdown** (`md`): Human-readable with headers and separators
- **JSON** (`json`): Machine-readable with all data

---

### `state init`

Create a new .agent file.

```bash
state init [options]
```

**Options**:
- `-t, --title <title>` - Conversation title
- `-l, --language <language>` - Programming language
- `-p, --project <name>` - Project name
- `-o, --output <file>` - Output file path (default: `output.agent`)

**Examples**:
```bash
# Interactive mode
state init

# Create with options
state init --title "My Chat" --language TypeScript --project my-app

# Create with custom output
state init -o my-conversation.agent
```

---

## Global Options

```bash
# Show help
state --help
state <command> --help

# Show version
state --version
```

---

## Exit Codes

- `0` - Success
- `1` - Error (invalid input, file not found, validation failed, etc.)

---

## Configuration

### Environment Variables

```bash
# Set default output directory
export STATE_OUTPUT_DIR="./agent-files"

# Set default max conversations for imports
export STATE_MAX_CONVERSATIONS="10"
```

### Config File

Create `.statrc.json` in your home directory:

```json
{
  "outputDir": "./agent-files",
  "maxConversations": 10,
  "includeTerminal": false,
  "defaultFormat": "md"
}
```

---

## Examples

### Complete Workflow

```bash
# 1. Import from Claude Code
state import claude my-conversations.agent

# 2. View the file
state view my-conversations.agent --info

# 3. Validate the file
state validate my-conversations.agent --verbose

# 4. Export to markdown
state export my-conversations.agent -f md

# 5. Share the markdown file
```

### Working with Cursor

Since Cursor doesn't have an export API, use the clipboard importer:

```bash
# 1. In Cursor, select the entire conversation (Cmd/Ctrl+A)
# 2. Copy to clipboard (Cmd/Ctrl+C)
# 3. Run:
state import clipboard -t "Cursor Conversation" -o cursor-chat.agent

# 4. View the file
state view cursor-chat.agent
```

### Batch Import

```bash
# Import all conversations from multiple sources
state import claude claude.agent
state import chatgpt ./chatgpt-export.zip chatgpt.agent
state import clipboard -t "Manual Import" manual.agent

# List all .agent files
ls -lh *.agent
```

---

## Error Handling

### Common Errors

**"File not found"**:
```bash
# Check file exists
ls conversation.agent

# Use absolute path
state view /full/path/to/conversation.agent
```

**"Invalid .agent file"**:
```bash
# Validate the file
state validate conversation.agent --verbose

# Check file extension
ls -l conversation.agent
```

**"Claude Code not found"**:
```bash
# Check if Claude Code is installed
state info

# Install Claude Code from: https://claude.ai/download
```

**"Clipboard access denied"**:
```bash
# Linux: Install xclip
sudo apt-get install xclip

# macOS: Grant Terminal permissions
# System Preferences → Security & Privacy → Privacy → Automation
```

---

## Performance

### Import Speeds

- **Claude (local)**: ~1-2 seconds per conversation
- **ChatGPT (ZIP)**: ~5-10 seconds for 100 conversations
- **Clipboard**: Instant (<1 second)

### File Sizes

- **Typical conversation** (100 messages): ~50-100 KB
- **Large conversation** (1000 messages): ~500 KB - 1 MB
- **With semantic map**: +100-500 KB
- **With terminal history**: +50-200 KB

---

## Tips and Tricks

### Aliases

Create shell aliases for common commands:

```bash
# Add to ~/.bashrc or ~/.zshrc
alias s='state'
alias si='state import'
alias sv='state view'
alias sval='state validate'
alias sexp='state export'
```

### Shell Completion

```bash
# Bash
echo 'eval "$(state --completion=bash)"' >> ~/.bashrc

# Zsh
echo 'eval "$(state --completion=zsh)"' >> ~/.zshrc

# Fish
state --completion=fish > ~/.config/fish/completions/state.fish
```

### Pipe Support

```bash
# View and pipe to less
state view conversation.agent --info | less

# Export and pipe to pandoc
state export conversation.agent -f md | pandoc -o conversation.pdf
```

---

## Integration

### With Git

```bash
# Add .agent files to git
git add *.agent
git commit -m "Add conversations"

# .gitignore example
# Ignore all .agent files except specific ones
*.agent
!important.agent
```

### With Editors

```bash
# Open in VS Code
state view conversation.agent --info | code -

# Open in Vim
state view conversation.agent --info | vi -
```

### With Other Tools

```bash
# Count messages across files
for f in *.agent; do
  state view $f --info | grep "Messages:"
done

# Backup all .agent files
tar czf agent-backup.tar.gz *.agent
```

---

## Troubleshooting

### Debug Mode

Set `DEBUG=1` environment variable for verbose output:

```bash
DEBUG=1 state import claude
```

### Logs

Logs are stored in:
- **Windows**: `%APPDATA%\state\logs\`
- **macOS**: `~/Library/Logs/state/`
- **Linux**: `~/.state/logs/`

### Clean Cache

```bash
# Clear CLI cache
rm -rf ~/.state/cache
```

---

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](https://github.com/state-project/agent/blob/main/CONTRIBUTING.md) for details.

---

## License

MIT

---

## Support

- **GitHub**: [state-project/agent](https://github.com/state-project/agent)
- **Issues**: [GitHub Issues](https://github.com/state-project/agent/issues)
- **Documentation**: [docs.state.dev](https://docs.state.dev)
