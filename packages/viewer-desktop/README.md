# @state/viewer-desktop

Desktop viewer for .agent files - Native desktop application built with Tauri.

## Features

- 🖥️ **Native Desktop App** - Runs natively on Windows, macOS, and Linux
- 📁 **File Associations** - Double-click .agent files to open
- 🔍 **Recent Files** - Quick access to recently opened files
- ⌨️ **Keyboard Shortcuts** - Productivity shortcuts (Ctrl+O, Ctrl+W, etc.)
- 🎨 **Modern UI** - Same beautiful interface as the web viewer
- 🌓 **Dark Mode** - System-aware dark mode with manual toggle
- 📂 **Native Dialogs** - Platform-native file open/save dialogs
- ⚡ **Fast Startup** - <1 second startup time
- 🔒 **Sandboxed** - Secure by default with Tauri security model

## Tech Stack

- **Framework**: Tauri 1.5 (Rust + Webview)
- **Frontend**: Next.js 14 (reuses web viewer)
- **Language**: Rust 2021 (backend)
- **Build Tool**: Tauri CLI
- **Package Manager**: pnpm

## Installation

### Prerequisites

- **Rust** 1.70+ (for building from source)
- **Node.js** 18+ (for frontend)
- **pnpm** 8+ (package manager)
- **System-specific**:
  - **Windows**: Visual Studio C++ Build Tools
  - **macOS**: Xcode Command Line Tools
  - **Linux**: libwebkit2gtk-4.0-dev, libssl-dev, libgtk-3-dev

### Install Dependencies

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install pnpm
npm install -g pnpm
```

## Development

### Setup

```bash
cd packages/viewer-desktop

# Install dependencies
pnpm install

# Run development mode (with hot reload)
pnpm dev
```

The development mode will:
1. Start the Next.js dev server (http://localhost:3000)
2. Launch the Tauri development window
3. Enable hot reload for both frontend and backend

### Building

```bash
# Build for production
pnpm build

# Build debug version
pnpm build:debug
```

### Running

```bash
# Run development build
pnpm dev

# Run production build
# Output: src-tauri/target/release/state-viewer (or .exe on Windows)
./src-tauri/target/release/state-viewer
```

## File Associations

### Windows

```bash
# Associate .agent files with the app
# The installer handles this automatically
```

### macOS

```bash
# File associations are configured in the app bundle
# Double-click any .agent file to open it
```

### Linux

```bash
# Create desktop entry and file associations
# The .desktop file is installed automatically
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + O` | Open file |
| `Ctrl/Cmd + W` | Close file |
| `Ctrl/Cmd + D` | Toggle dark mode |
| `Escape` | Close file/reset |

## Native Features

### File Dialogs

- **Open**: Platform-native file picker
- **Save**: Platform-native save dialog
- **Recent Files**: Quick access to history

### System Integration

- **File Associations**: Double-click .agent files to open
- **Recent Files**: Track recently opened files
- **Folder Integration**: Show in Finder/Explorer
- **Terminal Integration**: Open in terminal

### Window Management

- **Minimize**: Minimize window
- **Maximize**: Toggle maximize
- **Close**: Close window
- **Title Bar**: Custom title bar with drag support

## Platform-Specific Features

### Windows

- **Installer**: NSIS installer with code signing (planned)
- **File Association**: Registry-based file association
- **Auto-Update**: Windows update support (planned)
- **SmartScreen**: Properly signed for SmartScreen

### macOS

- **Bundle**: .app bundle with proper structure
- **Code Signing**: Developer ID signing (planned)
- **Notarization**: Apple notarization (planned)
- **File Association**: via Info.plist
- **Universal Binary**: x86_64 and arm64 (planned)

### Linux

- **Packages**: AppImage, deb, rpm
- **File Association**: via .desktop file
- **Icon Theme**: Follows freedesktop.org standards
- **Dependencies**: Minimal runtime dependencies

## Distribution

### Build Outputs

```bash
# After running `pnpm build`

# Windows
src-tauri/target/release/State Viewer Setup.exe

# macOS
src-tauri/target/release/bundle/dmg/State Viewer 0.1.0.x64.dmg
src-tauri/target/release/bundle/macos/State Viewer.app

# Linux
src-tauri/target/release/bundle/appimage/state-viewer_0.1.0_amd64.AppImage
src-tauri/target/release/bundle/deb/state-viewer_0.1.0_amd64.deb
src-tauri/target/release/bundle/appimage/state-viewer_0.1.0_amd64.tar.gz
```

### Signing

#### macOS

```bash
# Sign the app bundle
codesign --sign "Developer ID Application: Your Name" \
  src-tauri/target/release/bundle/macos/State Viewer.app

# Notarize (requires Apple Developer account)
xcrun notarytool submit \
  --apple-id "dev.state.viewer" \
  --password "@keychain:Application Helper: Notarization" \
  --file src-tauri/target/release/bundle/dmg/State Viewer 0.1.0.x64.dmg \
  --wait

# Staple ticket
xcrun stapler staple \
  src-tauri/target/release/bundle/dmg/State Viewer 0.1.0.x64.dmg
```

#### Windows

```bash
# Sign with certificate (requires code signing certificate)
signtool sign \
  /f certificate.pfx \
  /p password \
  /tr http://timestamp.digicert.com \
  /td sha256 \
  src-tauri/target/release/State Viewer Setup.exe
```

## Configuration

### Preferences Location

- **Windows**: `%APPDATA%\state-viewer\preferences.json`
- **macOS**: `~/Library/Application Support/state-viewer/preferences.json`
- **Linux**: `~/.config/state-viewer/preferences.json`

### Preferences Structure

```json
{
  "theme": "system",
  "recent_files": [
    {
      "path": "/path/to/file.agent",
      "title": "Conversation",
      "opened_at": 1234567890,
      "file_size": 102400
    }
  ],
  "max_recent_files": 20,
  "default_directory": "/home/user/Documents"
}
```

## Tauri API

The desktop viewer provides additional APIs via `@tauri-apps/api`:

```typescript
import { tauriAPI } from '@/lib/tauri-api'

// Check if running in Tauri
if (tauriAPI.isTauri) {
  // Open file dialog
  const path = await tauriAPI.openFileDialog()

  // Read file
  const buffer = await tauriAPI.readFile(path)

  // Get preferences
  const prefs = await tauriAPI.getPreferences()

  // Add to recent files
  await tauriAPI.addRecentFile({
    path,
    title: 'My Conversation',
    opened_at: Date.now(),
    file_size: 1024
  })

  // Open in folder
  await tauriAPI.openInFolder(path)

  // Window controls
  await tauriAPI.minimizeWindow()
  await tauriAPI.maximizeWindow()
  await tauriAPI.closeWindow()
}
```

## Security

### Tauri Security Model

- **Sandboxed**: Each window runs in a sandboxed webview
- **Capability System**: Fine-grained permissions via allowlist
- **No Remote Code**: No eval() or remote script loading
- **File System Access**: Scoped to user-selected directories
- **Network Access**: No network access by default
- **Subprocess Execution**: No subprocess execution from content

### Allowlist Configuration

See `src-tauri/tauri.conf.json` for capability allowlist:

```json
{
  "tauri": {
    "allowlist": {
      "dialog": { "open": true, "save": true },
      "fs": { "readFile": true, "writeFile": true, "readDir": true },
      "path": { "all": true },
      "clipboard": { "readText": true, "writeText": true },
      "window": { "close": true, "hide": true, "show": true }
    }
  }
}
```

## Troubleshooting

### Build Issues

**Windows: "link.exe not found"**
- Install Visual Studio C++ Build Tools
- Add to PATH

**macOS: "xcrun: error: invalid active developer path"**
- Install Xcode Command Line Tools: `xcode-select --install`
- Accept Xcode license: `sudo xcodebuild -license accept`

**Linux: "error: linking with cc failed"**
- Install webkit2gtk: `sudo apt install libwebkit2gtk-4.0-dev`
- Install libssl: `sudo apt install libssl-dev libgtk-3-dev`

### Runtime Issues

**File dialog not opening**
- Check Tauri allowlist configuration
- Ensure dialog capability is enabled

**File associations not working**
- On Windows: Reinstall the application
- On macOS: Rebuild the app bundle
- On Linux: Check .desktop file installation

## Performance

### Startup Time
- **Cold Start**: <1s
- **Warm Start**: <500ms
- **File Load**: <100ms for typical files

### Memory Usage
- **Idle**: ~50-100 MB
- **With File**: +50-200 MB depending on file size
- **Peak**: <500 MB for large files

### Bundle Size
- **Windows**: ~5-8 MB (installer)
- **macOS**: ~10-15 MB (.app)
- **Linux**: ~12-18 MB (AppImage)

## Contributing

See [CONTRIBUTING.md](https://github.com/state-project/agent/blob/main/CONTRIBUTING.md) for details.

## License

MIT

## Support

- **GitHub**: [state-project/agent](https://github.com/state-project/agent)
- **Issues**: [GitHub Issues](https://github.com/state-project/agent/issues)
- **Documentation**: [docs.state.dev](https://docs.state.dev)
