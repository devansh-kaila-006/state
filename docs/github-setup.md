# GitHub Organization Setup Guide

This guide covers setting up the GitHub organization and repositories for the State project.

## Overview

The State project uses a GitHub organization structure to manage multiple related repositories:

- **state-org/state** - Main project repository (this repository)
- **state-org/spec** - Format specification and RFCs
- **state-org/plugins** - Community plugins registry
- **state-org/website** - Official website and documentation
- **state-org/*.example** - Example plugins

## Organization Setup

### 1. Create GitHub Organization

1. Visit https://github.com/organizations/new
2. Enter organization name: `state-org`
3. Organization email: `hello@state.dev`
4. Choose **Free** plan (up to 500 members)

### 2. Configure Organization Settings

#### Profile

- **Organization name**: State Project
- **Description**: The Portable Context Standard for AI Conversations
- **Email**: `hello@state.dev`
- **Website**: `https://state.dev`
- **Location**: San Francisco, CA
- **Company logo**: Upload from `assets/logo.png`

#### Organization Profile

```
Name: State Project
Email: hello@state.dev
Blog: https://blog.state.dev
Twitter: @stateproject
```

### 3. Create Teams

Create the following teams with appropriate permissions:

#### Core Team

- **Name**: `core`
- **Description**: Core maintainers with full access
- **Permission**: **Admin**
- **Members**: Initial maintainers
- **Repositories**: All repositories (admin access)

**Responsibilities**:
- Code review and approval
- Release management
- Security issues
- Technical decisions

#### Contributors Team

- **Name**: `contributors`
- **Description**: Active contributors
- **Permission**: **Write**
- **Members**: Added automatically via PR merges
- **Repositories**: All repositories (write access)

**Responsibilities**:
- Submit pull requests
- Review documentation
- Test features
- Help with issues

#### Plugin Developers Team

- **Name**: `plugin-devs`
- **Description**: Plugin ecosystem maintainers
- **Permission**: **Write**
- **Members**: Plugin maintainers
- **Repositories**: `state-org/plugins`, `*.example` plugins

**Responsibilities**:
- Review plugin submissions
- Maintain plugin registry
- Plugin documentation
- Plugin tooling

#### Bot Team

- **Name**: `bots`
- **Description**: Automation bots
- **Permission**: **Read**
- **Members**: Bot accounts (Dependabot, Renovate, etc.)
- **Repositories**: All repositories

### 4. Repository Setup

#### Main Repository: state-org/state

```bash
# Create repository on GitHub
# Name: state
# Description: The Portable Context Standard for AI Conversations
# Visibility: Public
# Initialize with: README, .gitignore, License (MIT)
```

**Settings**:
- **Features**:
  - [x] Issues
  - [x] Projects
  - [x] Actions
  - [x] Wiki
  - [x] Discussions
  - [x] Security & analysis (Dependabot alerts, code security)

- **Branch protection rules** (`main` branch):
  - [x] Require status checks to pass
  - [x] Require branches to be up to date
  - [x] Require pull request reviews (1 approval)
  - [x] Dismiss stale reviews
  - [x] Require review from code owners
  - [x] Restrict who can push (core team only)
  - [x] Do not allow bypassing settings

- **Required status checks**:
  - `Type Check`
  - `Lint`
  - `Unit Tests`
  - `Integration Tests`
  - `Coverage (95%+)`

#### Specification Repository: state-org/spec

```bash
# Create repository
# Name: spec
# Description: .agent File Format Specification
# Visibility: Public
```

**Settings**:
- **Features**: Issues, Discussions, Actions
- **Branch protection**: Same as main repo
- **Topics**: `file-format`, `specification`, `agent`, `ai`, `portable`

**Contents**:
- Format specification documents
- RFC proposals
- Change logs
- Version history

#### Plugins Repository: state-org/plugins

```bash
# Create repository
# Name: plugins
# Description: Community Plugin Registry
# Visibility: Public
```

**Settings**:
- **Features**: Issues, Discussions, Actions, Wiki
- **Branch protection**: Same as main repo
- **Topics**: `plugins`, `registry`, `extensions`

**Structure**:
```
plugins/
├── README.md
├── registry.json          # Official plugin list
├── importers/
│   ├── windsurf.md
│   ├── tabnine.md
│   └── cody.md
├── viewers/
│   ├── themes.md
│   └── custom-layouts.md
└── generators/
    ├── ast-analyzer.md
    └── dependency-graph.md
```

#### Website Repository: state-org/website

```bash
# Create repository
# Name: website
# Description: Official Website and Documentation
# Visibility: Public
```

**Settings**:
- **Features**: Issues, Projects, Actions, Pages
- **GitHub Pages**: Enable from `main` branch `/docs`
- **Topics**: `website`, `documentation`, `nextjs`

### 5. Issue Templates

Create `.github/ISSUE_TEMPLATE/` directory in main repository:

#### Bug Report Template

```markdown
---
name: Bug Report
about: Report a bug or unexpected behavior
title: '[BUG] '
labels: bug, triage
assignees: ''
---

## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happened

## Environment
- OS: [e.g., Windows 11, macOS 14, Ubuntu 22.04]
- Node.js version: [e.g., 20.11.0]
- State CLI version: [e.g., 0.1.0]

## Additional Context
Logs, screenshots, or other relevant information
```

#### Feature Request Template

```markdown
---
name: Feature Request
about: Suggest a new feature or enhancement
title: '[FEATURE] '
labels: enhancement, feature-request
assignees: ''
---

## Feature Description
Clear description of the requested feature

## Problem Statement
What problem does this solve?

## Proposed Solution
How should this work?

## Alternatives Considered
What other approaches did you consider?

## Additional Context
Examples, mockups, or references
```

#### Plugin Submission Template

```markdown
---
name: Plugin Submission
about: Submit a new community plugin
title: '[PLUGIN] '
labels: plugin, submission
assignees: ''
---

## Plugin Name
Name of your plugin

## Plugin Type
- [ ] Importer
- [ ] Viewer
- [ ] Semantic Map Generator

## Description
Brief description of what the plugin does

## Repository
Link to plugin repository

## Installation
How to install the plugin

## Usage
How to use the plugin

## Testing
Describe how you tested the plugin

## Additional Information
Any other relevant information
```

### 6. Pull Request Template

Create `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## Description
<!-- Brief description of changes -->

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Related Issue
<!-- Link to related issue -->
Fixes #

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All tests passing (`pnpm test:all`)
- [ ] Coverage at 95%+ (`pnpm test:coverage`)

## Checklist
- [ ] Code follows style guidelines (`pnpm lint`)
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Changes generate no new warnings
- [ ] Added/updated tests for all changes
- [ ] Commits follow [commit message guidelines](CONTRIBUTING.md#commit-messages)

## Screenshots (if applicable)
<!-- Add screenshots for UI changes -->

## Additional Notes
<!-- Any additional information -->
```

### 7. Branch Protection Rules

For all repositories, configure `main` branch protection:

```yaml
branch_protection:
  branch: main
  enforce_admins: true

  required_status_checks:
    strict: true
    contexts:
      - Type Check
      - Lint
      - Unit Tests
      - Integration Tests
      - E2E Tests
      - Coverage (95%+)

  required_pull_request_reviews:
    required_approving_review_count: 1
    dismiss_stale_reviews: true
    require_code_owner_reviews: true

  restrictions:
    users: []
    teams:
      - core

  allow_force_pushes: false
  allow_deletions: false
```

### 8. GitHub Actions Workflows

#### Main Repository Workflows

Create `.github/workflows/` directory:

**CI Workflow** (`ci.yml`):
- Type checking
- Linting
- All test suites
- Coverage reporting
- Security audit

**Release Workflow** (`release.yml`):
- Version bumping
- Changelog generation
- Package publishing to npm
- GitHub release creation

**Plugin Test Workflow** (`plugin-test.yml`):
- Test plugins against latest code
- Validate plugin API compatibility

**Security Workflow** (`security.yml`):
- Dependency scanning
- Code security analysis
- Vulnerability reporting

### 9. Dependabot Configuration

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 10
    versioning-strategy: increase
    commit-message:
      prefix: "deps"
      include: "scope"
    labels:
      - "dependencies"
      - "dependabot"

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    labels:
      - "github-actions"
      - "dependabot"
```

### 10. Security Settings

#### Vulnerability Reporting

- Enable **Private vulnerability reporting**
- Create `SECURITY.md`:

```markdown
# Security Policy

## Supported Versions
Current version (0.x.x) receives security updates

## Reporting a Vulnerability

Please report security vulnerabilities privately:

1. **Do not** create public issues
2. Email: security@state.dev
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if known)

Response time: Within 48 hours

## Security Best Practices

- Keep dependencies updated
- Use encryption for sensitive data
- Validate all inputs
- Follow security guidelines in docs
```

#### Code Security

- Enable **Dependabot alerts**
- Enable **Dependabot security updates**
- Enable **Code security alerts** (GitHub Advanced Security)

### 11. Community Settings

#### Discussions

Enable GitHub Discussions with categories:

- **Announcements**: Official announcements
- **General**: General discussion
- **Show and Tell**: Share what you built
- **Ideas**: Feature ideas
- **Q&A**: Questions and help
- **Plugins**: Plugin discussions

#### Wiki

Enable GitHub Wiki with pages:

- Home
- Getting Started
- FAQ
- Troubleshooting
- Contributing
- Plugin Development

### 12. Integrations

#### Required Integrations

1. **Codecov** - Coverage reporting
   - Settings → Integrations → Codecov → Enable

2. **npm** - Package publishing
   - Create npm token for automation
   - Add to repository secrets (`NPM_TOKEN`)

3. **Discord** - Community chat
   - Settings → Integrations → Discord
   - Configure notifications

#### Optional Integrations

1. **Renovate** - Alternative to Dependabot
2. **DeepCode** - Code analysis
3. **LGTM** - Security analysis
4. **Sentry** - Error tracking

### 13. Repository Secrets

Configure secrets for automation:

```
NPM_TOKEN                  # npm publish token
CODECOV_TOKEN             # Codecov upload token
GH_TOKEN                  # GitHub token for releases
DISCORD_WEBHOOK           # Discord notifications
SLACK_WEBHOOK             # Slack notifications (optional)
```

### 14. Labels

Create common labels across all repositories:

```yaml
labels:
  # Priority
  - name: priority/critical
    color: "#b60205"
  - name: priority/high
    color: "#d93f0b"
  - name: priority/medium
    color: "#fbca04"
  - name: priority/low
    color: "#7057ff"

  # Type
  - name: bug
    color: "#d73a4a"
  - name: enhancement
    color: "#a2eeef"
  - name: feature-request
    color: "#008672"
  - name: documentation
    color: "#0075ca"
  - name: performance
    color: "#fbca04"

  # Status
  - name: status/in-progress
    color: "#ffebda"
  - name: status/review-needed
    color: "#fbca04"
  - name: status/approved
    color: "#b60205"
  - name: status/merged
    color: "#6f42c1"

  # Scope
  - name: area/importer
    color: "#bfd4f2"
  - name: area/viewer
    color: "#bfd4f2"
  - name: area/cli
    color: "#bfd4f2"
  - name: area/format
    color: "#bfd4f2"
  - name: area/plugins
    color: "#bfd4f2"

  # Size
  - name: size/small
    color: "#006b75"
  - name: size/medium
    color: "#bfd4f2"
  - name: size/large
    color: "#e99695"
  - name: size/xlarge
    color: "#b60205"
```

### 15. CODEOWNERS File

Create `.github/CODEOWNERS`:

```
# Core team owns everything by default
* @state-org/core

# Format package
packages/format/ @state-org/core

# Importers
packages/importer/ @state-org/core

# Viewers
packages/viewer-web/ @state-org/core
packages/viewer-desktop/ @state-org/core

# CLI
packages/cli/ @state-org/core

# Plugins
plugins/ @state-org/plugin-devs

# Documentation
docs/ @state-org/core
README.md @state-org/core

# Tests
test/ @state-org/core

# Website
website/ @state-org/core
```

## Post-Setup Checklist

- [ ] Organization created
- [ ] Teams created and members added
- [ ] Repositories created
- [ ] Branch protection configured
- [ ] Issue templates created
- [ ] PR template created
- [ ] CI/CD workflows configured
- [ ] Dependabot enabled
- [ ] Security policies configured
- [ ] Labels created
- [ ] CODEOWNERS file created
- [ ] Integrations configured
- [ ] Secrets configured
- [ ] Wiki enabled
- [ ] Discussions enabled

## Migration Steps

If migrating from personal repository:

1. **Transfer repository**:
   ```bash
   gh repo transfer state-org/state
   ```

2. **Update remote URLs**:
   ```bash
   git remote set-url origin https://github.com/state-org/state.git
   ```

3. **Update references**:
   - Update README links
   - Update package.json repository URLs
   - Update documentation links

4. **Notify contributors**:
   - Post announcement
   - Update issue templates
   - Update contributor guidelines

## Resources

- [GitHub Organizations Guide](https://docs.github.com/en/organizations)
- [Managing Teams](https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-teams-in-your-organization)
- [Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)
- [Dependabot](https://docs.github.com/en/code-security/dependabot)
