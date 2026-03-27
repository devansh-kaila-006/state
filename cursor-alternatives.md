# Cursor Alternatives for .agent Importers

**Status**: Cursor direct importer deferred due to Terms of Service/legal risks
**Alternative**: Manual/clipboard importer + Community plugin API

---

## Why Cursor Was Deferred

**Legal Concerns**:
- ❌ Terms of Service likely prohibit reverse engineering
- ❌ Encrypted local storage may violate DMCA if decrypted
- ❌ No official export API or mechanism
- ❌ Accessing proprietary database format may breach ToS

**Technical Challenges**:
- Encrypted local database
- No documented export format
- Proprietary schema (may change without notice)

**Recommendation**: Use manual/clipboard workflow instead of direct importer

---

## Immediate Alternative: Manual/Clipboard Importer

### How It Works

1. User opens Cursor conversation
2. Selects all content (Ctrl+A, Ctrl+C)
3. Runs: `state import --clipboard`
4. CLI parses clipboard content
5. Creates .agent file automatically

### Supported Formats

- Markdown conversations
- Plain text with AI/USER markers
- JSON snippets
- Raw conversation text

### Pros
- ✅ Legal (no ToS violation)
- ✅ Works immediately
- ✅ Simple to implement
- ✅ Tool-agnostic

### Cons
- ⚠️ Manual process
- ⚠️ Poor user experience
- ⚠️ May lose some metadata

---

## AI Coding Tool Alternatives to Consider

### Priority 1: Viable for MVP

#### 1. Claude Code ✅ (Already Planned)
- **Status**: Confirmed viable
- **Export Method**: Local storage + Anthropic API
- **Legal Risk**: Low
- **User Base**: High and growing
- **Implementation Effort**: 2-3 weeks

#### 2. ChatGPT ✅ (Already Planned)
- **Status**: Confirmed viable
- **Export Method**: Official data export (GDPR)
- **Legal Risk**: Very low
- **User Base**: Very high
- **Implementation Effort**: 1-2 weeks

---

### Priority 2: Post-MVP (Community or Official)

#### 3. Windsurf (Codeium)
**Status**: Unknown feasibility - requires research

**Potential Export Methods**:
- Local storage analysis
- Official API (if available)
- Partnership with Codeium

**Research Needed**:
- [ ] Check for export functionality
- [ ] Review Terms of Service
- [ ] Assess local storage format
- [ ] Estimate implementation effort

**User Base**: Medium (growing)

**Recommendation**: Research in Phase 1, build if viable

---

#### 4. GitHub Copilot Chat
**Status**: Different product category

**Challenge**: Copilot primarily provides inline suggestions, not full conversations

**Potential Path**:
- If Copilot Chat adds conversation export
- Could integrate with GitHub ecosystem

**User Base**: Very high

**Recommendation**: Monitor for export features, engage with GitHub

---

#### 5. Sourcegraph Cody
**Status**: Lower priority - smaller user base

**Potential Export Methods**:
- Check for conversation history
- API access
- Local storage

**User Base**: Medium (enterprise-focused)

**Recommendation**: Community plugin or post-MVP

---

#### 6. Continue.dev
**Status**: Lower priority - open source alternative

**Advantage**:
- Open source - easier to integrate
- Community may build importer
- Well-documented

**Implementation**:
- Document conversation format
- Provide plugin API
- Support community contributions

**User Base**: Small but growing

**Recommendation**: Community-driven plugin

---

#### 7. Tabnine
**Status**: Lower priority

**Research Needed**:
- Conversation features
- Export capabilities
- Local storage format

**User Base**: Medium

**Recommendation**: Post-MVP if demand exists

---

#### 8. CodeWhisperer (Amazon)
**Status**: Lower priority

**Potential**:
- AWS ecosystem integration
- Enterprise focus

**User Base**: Medium

**Recommendation**: Monitor for export features

---

## Recommended Importer Priority

### MVP (Phase 3)
1. ✅ **Claude Code** - Primary, confirmed viable
2. ✅ **ChatGPT** - Secondary, confirmed viable
3. ✅ **Manual/Clipboard** - Fallback for all other tools

### Post-MVP (Phase 7+)
4. **Windsurf/Codeium** - Research first, build if viable
5. **Community Plugins** - Enable ecosystem for other tools

### Future (As-Needed)
6. **GitHub Copilot Chat** - If export features added
7. **Continue.dev** - Community-driven
8. **Sourcegraph Cody** - If enterprise demand
9. **Tabnine** - If user demand
10. **CodeWhisperer** - If AWS integration needed

---

## Community Plugin Strategy

Instead of building all importers, provide:

1. **Plugin API Documentation**
   - How to create custom importers
   - Data format specifications
   - Testing utilities

2. **Example Importers**
   - Simple template code
   - Claude importer as reference
   - ChatGPT importer as reference

3. **Plugin Registry**
   - List of community importers
   - Compatibility matrix
   - Installation instructions

4. **Testing Tools**
   - Validation utilities
   - Test data generators
   - Format compliance checkers

**Benefits**:
- ✅ Leverages community expertise
- ✅ Reduces maintenance burden
- ✅ Faster coverage of more tools
- ✅ Legal risk distributed

---

## Cursor-Specific Path Forward

### Option 1: Manual Workflow (Recommended for MVP)
- Users copy-paste conversations
- CLI parses and creates .agent files
- Simple, legal, works now

### Option 2: Official Partnership (Post-Launch)
- Contact Cursor for official API
- Offer to integrate .agent as native export
- Benefits both parties
- **Timeline**: 6-12 months

### Option 3: Community Plugin (Post-Launch)
- Document plugin API
- Let community build unofficial importer
- Legal risk transferred to community
- **Timeline**: 3-6 months

### Option 4: Browser Extension (Risky)
- Capture Cursor web interface
- Screen scraping approach
- May still violate ToS
- **Not recommended**

---

## Summary

**For MVP**:
- Focus on Claude + ChatGPT (both confirmed viable)
- Provide manual/clipboard importer for Cursor
- Document plugin API for community

**Post-MVP**:
- Research Windsurf/Codeium feasibility
- Enable community plugins
- Consider Cursor partnership

**Key Principle**:
Build on solid legal foundations with tools that have clear export paths. Let community handle tools with uncertain legal status.

---

**Last Updated**: 2026-03-27
**Status**: MVP importers defined, alternatives documented
