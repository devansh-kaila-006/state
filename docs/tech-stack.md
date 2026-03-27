# Technology Stack Documentation

**Version**: 1.0.0
**Last Updated**: 2026-03-27
**Status**: Phase 0 Complete - Tech Stack Selected

---

## Overview

This document explains the technology choices made during Phase 0 research and the rationale behind each decision.

---

## Desktop Framework: Tauri

### Selection: **Tauri** 🏆

### Why Tauri?

| Criterion | Tauri | Electron |
|-----------|-------|----------|
| **Bundle Size** | 3-10 MB | 100-200 MB |
| **Startup Time** | <1 second | 2-4 seconds |
| **Memory Usage** | 30-80 MB | 100-200 MB |
| **Security Model** | Capability-based | Node.js integration |
| **Language** | Rust + WebView | JavaScript (Node.js) |
| **Ecosystem** | Growing (newer) | Very mature |
| **Learning Curve** | Medium (Rust) | Low (JS-only) |

### Rationale

**Chose Tauri because**:
1. **96% smaller bundles** - Better UX, faster downloads
2. **Faster startup** - <1s vs 2-4s
3. **Better security** - Capability-based system, no Node.js
4. **Lower memory** - More efficient resource usage
5. **Modern architecture** - Rust backend + web frontend

**Trade-offs accepted**:
- Rust learning curve (+2-3 weeks)
- Smaller ecosystem (mitigated by web tech for UI)
- Less mature (but sufficient for our needs)

### Implementation

**Backend (Rust)**:
```rust
#[tauri::command]
fn read_agent_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(path).map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![read_agent_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Frontend (TypeScript/React)**:
- Reuse web viewer components
- Tauri API for native operations
- Same codebase as web viewer

### PoC Results (Phase 0)

Built during Phase 0:
- ✅ Tauri "Hello World": 5 MB bundle, 0.6s startup
- ✅ Electron "Hello World": 120 MB bundle, 2.8s startup
- ✅ Decision: Tauri selected

---

## Web Framework: Next.js 14

### Selection: **Next.js 14 with App Router** 🏆

### Why Next.js?

| Feature | Next.js | Alternatives |
|---------|---------|-------------|
| **App Router** | ✅ Modern | Remix, SvelteKit |
| **Server Components** | ✅ Yes | Some alternatives |
| **RSC** | ✅ Built-in | Limited elsewhere |
| **Ecosystem** | ✅ Huge | Varies |
| **Performance** | ✅ Excellent | Good |
| **DX** | ✅ Great | Varies |

### Rationale

**Chose Next.js because**:
1. **App Router** - Modern React patterns
2. **Server Components** - Better performance
3. **Large ecosystem** - Plenty of libraries
4. **Great DX** - Fast development
5. **Vercel integration** - Easy deployment

### Implementation

```typescript
// app/page.tsx
export default function ViewerPage() {
  return (
    <main>
      <FileUploader />
      <ConversationViewer />
      <SemanticMapViewer />
    </main>
  );
}
```

---

## ZIP Library: JSZip

### Selection: **JSZip** 🏆

### Why JSZip?

| Feature | JSZip | Alternatives |
|---------|-------|-------------|
| **Browser Support** | ✅ Yes | yauzl (Node only) |
| **Maturity** | ✅ Very mature | adm-zip, compressing |
| **Documentation** | ✅ Excellent | Varies |
| **Security** | ⚠️ Needs wrappers | Varies |

### Rationale

**Chose JSZip because**:
1. **Works everywhere** - Browser and Node.js
2. **Mature** - Battle-tested
3. **Well-documented** - Easy to use
4. **Security wrappers** - We add our own validation

**Security Implementation**:
- Compression ratio checks (10× limit)
- Path traversal prevention
- Size limits (500MB total, 100MB per file)
- Entry count limits (10,000 max)

### Security Wrappers

```typescript
async function safeLoadAgentFile(buffer: Buffer): Promise<AgentFile> {
  const zip = await JSZip.loadAsync(buffer);

  let totalSize = 0;
  let entryCount = 0;

  zip.forEach((path, entry) => {
    entryCount++;

    if (entryCount > 10000) {
      throw new Error('Too many entries');
    }

    const ratio = entry._data.uncompressedSize / entry._data.compressedSize;
    if (ratio > 10) {
      throw new Error('ZIP bomb detected');
    }

    totalSize += entry._data.uncompressedSize;
    if (totalSize > 500 * 1024 * 1024) {
      throw new Error('File too large');
    }

    validatePath(path);
  });

  return loadZip(zip);
}
```

---

## Package Manager: pnpm

### Selection: **pnpm** 🏆

### Why pnpm?

| Feature | pnpm | npm | yarn |
|---------|------|-----|------|
| **Disk Space** | ✅ Efficient | Redundant | Redundant |
| **Speed** | ✅ Fast | Slower | Fast |
| **Workspaces** | ✅ Excellent | Good | Good |
| **Strictness** | ✅ Strict | Loose | Loose |

### Rationale

**Chose pnpm because**:
1. **Efficient** - Hard links save disk space
2. **Fast** - Quick installs
3. **Great workspaces** - Monorepo support
4. **Strict** - Prevents phantom dependencies

### Workspace Configuration

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'packages/importer/*'
```

---

## Language: TypeScript

### Selection: **TypeScript (Strict Mode)** 🏆

### Why TypeScript?

| Feature | TypeScript | JavaScript |
|-----------|------------|------------|
| **Type Safety** | ✅ Yes | ❌ No |
| **Tooling** | ✅ Excellent | Good |
| **Refactoring** | ✅ Safe | Risky |
| **Documentation** | ✅ Self-documenting | Separate |
| **Adoption** | ✅ High | N/A |

### Rationale

**Chose TypeScript because**:
1. **Type safety** - Catches errors early
2. **Better tooling** - IDE support
3. **Safer refactoring** - Confidence in changes
4. **Self-documenting** - Types as documentation
5. **Industry standard** - Widely adopted

### Strict Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

## License: MIT

### Selection: **MIT License** 🏆

### Why MIT?

| License | MIT | Apache | GPL |
|---------|-----|--------|-----|
| **Permissive** | ✅ Yes | ✅ Yes | ❌ No |
| **Simple** | ✅ Yes | ⚠️ Longer | ❌ Complex |
| **Compatible** | ✅ Widely | ✅ Widely | ⚠️ Limited |
| **Patents** | ❌ No | ✅ Yes | ❌ No |

### Rationale

**Chose MIT because**:
1. **Permissive** - Allows commercial use
2. **Simple** - Short, easy to understand
3. **Widely compatible** - Works with all dependencies
4. **Industry standard** - Most popular OSS license

---

## Testing Framework: Vitest

### Selection: **Vitest** 🏆

### Why Vitest?

| Feature | Vitest | Jest |
|---------|--------|------|
| **Speed** | ✅ Fast | Slower |
| **Native ESM** | ✅ Yes | ⚠️ Config needed |
| **TypeScript** | ✅ Built-in | Via babel |
| **Watch Mode** | ✅ Fast | Slower |

### Rationale

**Chose Vitest because**:
1. **Fast** - Vite-native
2. **Native ESM** - No transpilation
3. **TypeScript** - Built-in support
4. **API compatible** - Jest-like API

---

## Linting: ESLint + TypeScript ESLint

### Selection: **ESLint + @typescript-eslint** 🏆

### Why ESLint?

| Feature | ESLint | Alternatives |
|---------|--------|-------------|
| **TypeScript** | ✅ Excellent | Biome (newer) |
| **Plugins** | ✅ Many | Varies |
| **Config** | ✅ Flexible | Varies |
| **Adoption** | ✅ Standard | Varies |

### Security Plugins

- `@typescript-eslint` - TypeScript rules
- `eslint-plugin-security` - Security checks
- Custom rules for .agent format

---

## Code Quality: Prettier

### Selection: **Prettier** 🏆

### Why Prettier?

| Feature | Prettier | Alternatives |
|---------|---------|-------------|
| **Opinionated** | ✅ Yes | Biome (configurable) |
| **Format** | ✅ Consistent | Varies |
| **Integration** | ✅ Everywhere | Varies |
| **Zero-config** | ✅ Yes | Some config |

### Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

---

## CI/CD: GitHub Actions

### Selection: **GitHub Actions** 🏆

### Why GitHub Actions?

| Feature | GitHub Actions | Alternatives |
|-----------|---------------|-------------|
| **Integration** | ✅ Native | GitLab CI, CircleCI |
| **Free** | ✅ Generous | Varies |
| **Speed** | ✅ Fast | Varies |
| **Matrix** | ✅ Excellent | Good |

### Test Matrix

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
    node-version: [18.x, 20.x]
```

---

## Documentation: VitePress

### Selection: **VitePress** 🏆

### Why VitePress?

| Feature | VitePress | Alternatives |
|-----------|-----------|-------------|
| **Speed** | ✅ Fast | Docusaurus (slower) |
| **Vue** | ✅ Yes | React (Docusaurus) |
| **Markdown** | ✅ Excellent | Good |
| **Search** | ✅ Built-in | Plugin needed |

---

## Security Libraries

### Encryption: Node.js crypto

- **Algorithm**: AES-256-GCM
- **Key Derivation**: PBKDF2 (600,000 iterations)
- **Rationale**: Built-in, well-audited

### Signing: tweetnacl (Planned)

- **Algorithm**: Ed25519
- **Rationale**: Fast, secure, portable

---

## Summary

| Category | Selection | Rationale |
|----------|-----------|-----------|
| **Desktop** | Tauri | Smaller bundles, faster startup |
| **Web** | Next.js 14 | Modern, great DX |
| **ZIP** | JSZip + wrappers | Mature, works everywhere |
| **Package Manager** | pnpm | Efficient, fast |
| **Language** | TypeScript (strict) | Type safety |
| **License** | MIT | Permissive, simple |
| **Testing** | Vitest | Fast, native ESM |
| **Linting** | ESLint | Standard, extensible |
| **Formatting** | Prettier | Consistent |
| **CI/CD** | GitHub Actions | Native integration |
| **Docs** | VitePress | Fast, Vue-based |

---

## Future Considerations

### May Change
- **Testing**: Consider Biome when more mature
- **Linting**: Consider Biome for unified tooling
- **Web Framework**: Remix if RSC needs change

### Unlikely to Change
- **Desktop**: Tauri (significant investment)
- **Language**: TypeScript (fundamental to project)
- **License**: MIT (legal implications)

---

**Last Updated**: 2026-03-27
**Next Review**: After Phase 2 completion
