# Example .agent File Structure

This document shows what a typical .agent file looks like when extracted.

---

## File Structure

```
my-conversation.agent (ZIP archive)
├── manifest.json
├── conversation/
│   └── messages.json
├── semantic-map/
│   └── file-tree.json
├── terminal/
│   └── sessions.json
├── future-plan/
│   ├── plan.md
│   └── tasks.json
└── assets/
    └── blobs/
        └── screenshot.png
```

---

## manifest.json

```json
{
  "version": "1.0.0",
  "format": "agent",
  "created_at": "2026-03-27T10:30:00Z",
  "updated_at": "2026-03-27T10:30:00Z",
  "source_tool": {
    "name": "claude",
    "version": "1.0.0",
    "model": "claude-3-opus-20240229"
  },
  "encryption": {
    "enabled": false
  },
  "components": [
    {
      "path": "manifest.json",
      "sha256": "a1b2c3d4e5f6...",
      "size": 1024
    },
    {
      "path": "conversation/messages.json",
      "sha256": "b2c3d4e5f6a7...",
      "size": 8192
    }
  ],
  "metadata": {
    "title": "React Hooks Tutorial",
    "description": "Learning useEffect and useState",
    "tags": ["react", "hooks", "tutorial"],
    "language": "TypeScript",
    "project_name": "my-react-app"
  }
}
```

---

## conversation/messages.json

```json
{
  "messages": [
    {
      "id": "msg-001",
      "role": "user",
      "content": "How do I use useEffect in React?",
      "timestamp": "2026-03-27T10:30:01Z"
    },
    {
      "id": "msg-002",
      "role": "assistant",
      "content": [
        {
          "type": "text",
          "text": "useEffect is a React hook that lets you perform side effects in functional components. Here's an example:"
        },
        {
          "type": "code",
          "language": "typescript",
          "text": "import { useEffect, useState } from 'react';\n\nfunction MyComponent() {\n  const [count, setCount] = useState(0);\n\n  useEffect(() => {\n    document.title = `Count: ${count}`;\n  }, [count]);\n\n  return <button onClick={() => setCount(count + 1)}>{count}</button>;\n}"
        }
      ],
      "timestamp": "2026-03-27T10:30:02Z",
      "model": "claude-3-opus-20240229",
      "citations": ["https://react.dev/reference/react/useEffect"]
    }
  ]
}
```

---

## semantic-map/file-tree.json

```json
{
  "files": [
    {
      "path": "src/App.tsx",
      "language": "typescript",
      "size": 2048,
      "modified": "2026-03-27T10:00:00Z",
      "functions": ["App", "useEffect"],
      "imports": ["react", "react-dom"]
    },
    {
      "path": "src/hooks/useCounter.ts",
      "language": "typescript",
      "size": 1024,
      "modified": "2026-03-27T09:00:00Z",
      "functions": ["useCounter"],
      "imports": ["react"]
    }
  ],
  "dependencies": {
    "src/App.tsx": ["react", "react-dom", "./hooks/useCounter"],
    "src/hooks/useCounter.ts": ["react"]
  },
  "summaries": {
    "src/App.tsx": "Main application component with counter functionality",
    "src/hooks/useCounter.ts": "Custom hook for counter state management"
  }
}
```

---

## terminal/sessions.json

```json
{
  "sessions": [
    {
      "id": "session-001",
      "working_directory": "/Users/devan/my-react-app",
      "shell": "zsh",
      "commands": [
        {
          "command": "npm run dev",
          "timestamp": "2026-03-27T10:25:00Z",
          "exit_code": 0,
          "output": "VITE v4.3.0  ready in 250 ms\n➜  Local:   http://localhost:5173/",
          "duration_ms": 1250
        },
        {
          "command": "git status",
          "timestamp": "2026-03-27T10:26:00Z",
          "exit_code": 0,
          "output": "On branch main\nYour branch is up to date with 'origin/main'.",
          "duration_ms": 150
        }
      ]
    }
  ]
}
```

---

## future-plan/plan.md

```markdown
# React Hooks Implementation Plan

## Overview
Implement React hooks (useState, useEffect) in my-react-app

## Tasks

1. ✅ Research useEffect documentation
2. ✅ Create basic component
3. 🔄 Implement counter with useEffect
4. ⏸️ Add error handling
5. ⏸️ Write tests

## Next Steps
- Complete error handling
- Add unit tests
- Deploy to staging
```

---

## future-plan/tasks.json

```json
{
  "tasks": [
    {
      "id": "task-001",
      "title": "Research useEffect documentation",
      "description": "Read React docs on useEffect",
      "status": "completed",
      "priority": "high",
      "assigned_to": "devan",
      "due_date": "2026-03-27T10:00:00Z"
    },
    {
      "id": "task-002",
      "title": "Create basic component",
      "description": "Create App.tsx with basic structure",
      "status": "completed",
      "priority": "high",
      "assigned_to": "devan",
      "due_date": "2026-03-27T10:15:00Z"
    },
    {
      "id": "task-003",
      "title": "Implement counter with useEffect",
      "description": "Add counter that updates document title",
      "status": "in_progress",
      "priority": "high",
      "depends_on": ["task-002"],
      "assigned_to": "devan",
      "due_date": "2026-03-27T11:00:00Z"
    },
    {
      "id": "task-004",
      "title": "Add error handling",
      "description": "Handle errors in useEffect",
      "status": "pending",
      "priority": "medium",
      "depends_on": ["task-003"]
    },
    {
      "id": "task-005",
      "title": "Write tests",
      "description": "Add unit tests for component",
      "status": "pending",
      "priority": "medium",
      "depends_on": ["task-004"]
    }
  ]
}
```

---

## Usage Example

### Creating this .agent file

```typescript
import { AgentFile } from '@state/format';

// Create new .agent file
const agentFile = await AgentFile.create({
  metadata: {
    title: 'React Hooks Tutorial',
    description: 'Learning useEffect and useState',
    tags: ['react', 'hooks', 'tutorial'],
    language: 'TypeScript',
    project_name: 'my-react-app'
  },
  sourceTool: {
    name: 'claude',
    version: '1.0.0',
    model: 'claude-3-opus-20240229'
  }
});

// Add conversation
await agentFile.addConversation([
  {
    id: 'msg-001',
    role: 'user',
    content: 'How do I use useEffect in React?',
    timestamp: '2026-03-27T10:30:01Z'
  },
  {
    id: 'msg-002',
    role: 'assistant',
    content: 'useEffect is a React hook...',
    timestamp: '2026-03-27T10:30:02Z',
    model: 'claude-3-opus-20240229'
  }
]);

// Add semantic map
await agentFile.addSemanticMap({
  files: [
    {
      path: 'src/App.tsx',
      language: 'typescript',
      functions: ['App', 'useEffect'],
      imports: ['react', 'react-dom']
    }
  ]
});

// Add terminal history
await agentFile.addTerminalHistory([
  {
    id: 'session-001',
    working_directory: '/Users/devan/my-react-app',
    shell: 'zsh',
    commands: [
      {
        command: 'npm run dev',
        timestamp: '2026-03-27T10:25:00Z',
        exit_code: 0,
        output: 'VITE v4.3.0  ready in 250 ms'
      }
    ]
  }
]);

// Add future plan
await agentFile.addFuturePlan({
  plan: '# React Hooks Implementation Plan\n\n## Tasks\n1. ✅ Research\n2. 🔄 Implement',
  tasks: [
    {
      id: 'task-001',
      title: 'Research useEffect',
      status: 'completed',
      priority: 'high'
    },
    {
      id: 'task-002',
      title: 'Implement counter',
      status: 'in_progress',
      priority: 'high'
    }
  ]
});

// Save to disk
await agentFile.save('my-conversation.agent');
```

---

## File Size

Typical .agent file sizes:
- Small conversation (10 messages): ~50 KB
- Medium conversation (100 messages): ~500 KB
- Large conversation (1000 messages): ~5 MB
- With semantic map: +50-500 KB
- With terminal history: +10-100 KB
- With assets: Variable

**Compression**: ~60-70% size reduction for text-heavy content

---

**Last Updated**: 2026-03-27
