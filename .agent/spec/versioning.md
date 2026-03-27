# .agent Format Versioning Strategy

**Version**: 1.0.0
**Last Updated**: 2026-03-27

---

## Version Numbering

The .agent format uses [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH
```

- **MAJOR**: Incompatible changes
- **MINOR**: New features, backwards compatible
- **PATCH**: Bug fixes, backwards compatible

---

## Version 1.0.0 (Initial Release)

### Components

```
manifest.json          # Root manifest (required)
conversation/
  ├── messages.json    # Message history
  └── context.json     # Conversation context
semantic-map/
  ├── file-tree.json   # Project file structure
  ├── dependencies.json # Dependency graph
  └── summaries.json   # File summaries
terminal/
  ├── sessions.json    # Terminal sessions
  └── outputs.log      # Command outputs
future-plan/
  ├── plan.md          # Markdown plan
  └── tasks.json       # Task list
assets/
  └── blobs/           # Binary files
```

### Required Fields

**manifest.json**:
- `version`: Format version
- `format`: "agent"
- `created_at`: ISO 8601 timestamp
- `source_tool.name`: Tool identifier
- `encryption.enabled`: Boolean

### Optional Fields

**manifest.metadata**:
- `title`: Conversation title
- `description`: Description
- `tags`: User tags
- `language`: Programming language
- `project_name`: Project name

**manifest.signature**:
- `enabled`: Boolean
- `algorithm`: "Ed25519"
- `public_key`: Hex-encoded
- `signature`: Hex-encoded

---

## Backwards Compatibility

### Reading Older Versions

**Readers MUST**:
- Support reading all previous MAJOR versions
- Provide migration paths for deprecated features
- Gracefully handle unknown optional fields

**Example**:
```javascript
// Version 2.0.0 reader should handle 1.x files
if (manifest.version.startsWith('1.')) {
  // Apply v1 compatibility layer
  manifest = migrateV1ToV2(manifest);
}
```

### Writing

**Writers SHOULD**:
- Always write the latest format version
- Never write deprecated features
- Maintain migration tools for upgrading old files

---

## Version Changes

### MAJOR Version Changes

**Require**:
- Increment MAJOR for breaking changes
- Document migration path
- Provide migration tool
- Maintain backwards compatibility for reading

**Examples of breaking changes**:
- Removing required fields
- Changing field types
- Restructuring directory layout
- Changing file formats

### MINOR Version Changes

**Allow**:
- Adding new optional fields
- Adding new components
- Adding new features
- Extending enums

**Must maintain**:
- All existing fields
- All existing structures
- Backwards compatibility

### PATCH Version Changes

**Allow**:
- Bug fixes
- Documentation updates
- Performance improvements
- Clarifications

**Must not**:
- Change behavior
- Add new features
- Break compatibility

---

## Deprecation Policy

### Deprecation Process

1. **Announce** deprecation in release notes
2. **Mark** field as deprecated in schema
3. **Wait** at least 2 MINOR versions
4. **Remove** in next MAJOR version

**Example**:
```
v1.0.0: Add field `foo`
v1.1.0: Mark `foo` as deprecated, add `bar`
v1.2.0: (waiting period)
v2.0.0: Remove `foo` (breaking change)
```

### Deprecated Fields

**Readers**:
- Must support deprecated fields
- May emit deprecation warnings
- Should migrate to new fields

**Writers**:
- Should not write deprecated fields
- Must use new replacements

---

## Migration Guide

### Migrating Between Versions

#### Automatic Migration

```javascript
class AgentFileMigrator {
  static migrate(manifest, fromVersion, toVersion) {
    if (fromVersion === '1.0.0' && toVersion === '2.0.0') {
      return this.migrate_1_0_0_to_2_0_0(manifest);
    }
    // ... other migrations
  }

  static migrate_1_0_0_to_2_0_0(manifest) {
    // Apply transformations
    manifest.version = '2.0.0';
    return manifest;
  }
}
```

#### Manual Migration

```bash
# CLI command to migrate .agent file
state migrate --to 2.0.0 conversation.agent
```

---

## Format Detection

### Version Detection

**By manifest**:
```javascript
const manifest = JSON.parse(zip.file('manifest.json').asString());
const version = manifest.version;
```

**By file structure**:
- Version 1.0.0: Has `manifest.json` at root
- Future versions: May use different structure

### Fallback

If version cannot be determined:
1. Assume version 1.0.0
2. Log warning
3. Attempt to parse

---

## Experimental Features

### Opt-in Features

**Format**:
```json
{
  "manifest": {
    "version": "1.0.0",
    "experimental": {
      "feature_name": true
    }
  }
}
```

**Rules**:
- Experimental features are opt-in
- May change or be removed in any version
- Do not affect backwards compatibility
- Must be documented

---

## Security Considerations

### Version Spoofing

**Prevention**:
- Validate version format
- Reject unknown versions with strict mode
- Use semantic versioning parsing

**Example**:
```javascript
function validateVersion(version) {
  const semver = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!semver) {
    throw new Error(`Invalid version: ${version}`);
  }
  const [major, minor, patch] = semver.slice(1).map(Number);
  if (major > 1) {
    throw new Error(`Unsupported major version: ${major}`);
  }
  return { major, minor, patch };
}
```

---

## Version Registry

### Released Versions

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| 1.0.0 | TBD | Current | Initial release |

### Future Versions

| Version | Status | Planned Features |
|---------|--------|------------------|
| 1.1.0 | Proposed | Enhanced metadata, new source tools |
| 2.0.0 | Future | Breaking changes, new structure |

---

## Contributing

### Adding New Versions

When proposing a new version:

1. **Document** all changes
2. **Provide** migration guide
3. **Update** schema
4. **Add** tests
5. **Submit** RFC for MAJOR changes

### RFC Process

1. Create RFC document
2. Community review
3. Approval
4. Implementation
5. Release

---

## Resources

- [Semantic Versioning](https://semver.org/)
- [JSON Schema](https://json-schema.org/)
- [Contributing Guide](./contributing.md)

---

**Maintainers**: State Project Contributors
**License**: MIT
