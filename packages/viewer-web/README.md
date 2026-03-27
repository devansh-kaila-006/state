# @state/viewer-web

Web viewer for .agent files - View and explore AI conversations, semantic maps, terminal history, and future plans.

## Features

- 🎨 **Modern UI** - Clean, responsive interface with dark mode support
- 📁 **File Upload** - Drag and drop or click to upload .agent files
- 💬 **Conversation Viewer** - Read AI conversations with syntax highlighting
- 🗺️ **Semantic Map** - Explore project structure and code graph
- 🖥️ **Terminal History** - View command outputs and shell sessions
- ✅ **Future Plans** - Check tasks, TODOs, and action items
- 🌓 **Dark Mode** - Automatic theme detection with manual toggle
- 📱 **Responsive** - Works on desktop, tablet, and mobile

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Radix UI patterns
- **Icons**: Lucide React
- **Markdown**: react-markdown with remark/rehype plugins
- **Syntax Highlighting**: react-syntax-highlighter with Prism
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Theme**: next-themes

## Installation

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building

```bash
pnpm build
```

## Usage

### Viewing .agent Files

1. Open the web viewer
2. Drag and drop a .agent file or click to browse
3. Explore the different views:
   - **Conversation**: Chat messages with code blocks
   - **Semantic Map**: Project file tree and dependencies
   - **Terminal**: Command history and outputs
   - **Plan**: Tasks and future action items

### Keyboard Shortcuts

- `Ctrl/Cmd + K` - Focus search (coming soon)
- `Ctrl/Cmd + D` - Toggle dark mode
- `Esc` - Close file

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page with upload
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── views/              # View-specific components
│   │   ├── conversation-view.tsx
│   │   ├── semantic-map-view.tsx
│   │   ├── terminal-view.tsx
│   │   └── plan-view.tsx
│   ├── agent-viewer.tsx    # Main viewer component
│   └── theme-provider.tsx  # Theme provider
└── lib/
    └── utils.ts            # Utility functions
```

## Component API

### AgentViewer

Main component for displaying .agent files.

```tsx
import AgentViewer from '@/components/agent-viewer'

<AgentViewer buffer={arrayBuffer} />
```

**Props**:
- `buffer: ArrayBuffer` - The .agent file content as ArrayBuffer

### View Components

#### ConversationView

Displays AI conversation messages.

```tsx
import ConversationView from '@/components/views/conversation-view'

<ConversationView messages={messages} />
```

**Props**:
- `messages: Message[]` - Array of conversation messages

#### SemanticMapView

Displays project semantic map.

```tsx
import SemanticMapView from '@/components/views/semantic-map-view'

<SemanticMapView semanticMap={semanticMap} />
```

**Props**:
- `semanticMap: SemanticMap` - Semantic map data

#### TerminalView

Displays terminal history.

```tsx
import TerminalView from '@/components/views/terminal-view'

<TerminalView terminal={terminal} />
```

**Props**:
- `terminal: { sessions: TerminalSession[] }` - Terminal session data

#### PlanView

Displays future plans and tasks.

```tsx
import PlanView from '@/components/views/plan-view'

<PlanView plan={plan} />
```

**Props**:
- `plan: { content?: string; tasks?: Task[] }` - Plan data

## Styyling

### Theme Customization

The viewer uses CSS variables for theming. Customize in `globals.css`:

```css
:root {
  --primary: 221.2 83.2% 53.3%;
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* ... */
}
```

### Component Styling

All components use Tailwind CSS with the `cn()` utility for conditional classes:

```tsx
import { cn } from '@/lib/utils'

<div className={cn('base-classes', condition && 'conditional-classes')} />
```

## Performance

### Optimization

- **Code Splitting**: Dynamic imports for large components
- **Image Optimization**: Next.js Image component
- **Bundle Size**: Tree-shaking and minification
- **Lazy Loading**: Components loaded on demand

### Metrics

- First Load JS: ~200 KB
- Page Load: <1s on fast connections
- Time to Interactive: <2s

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Accessibility

- Keyboard navigation
- Screen reader support
- High contrast mode
- Focus indicators
- ARIA labels

## Security

- No server-side file storage
- Client-side only processing
- No external API calls
- XSS protection via React
- CSP headers (production)

## Deployment

### Vercel (Recommended)

```bash
vercel deploy
```

### Static Export

```bash
pnpm build
pnpm export
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN pnpm install
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_GA_ID=your-google-analytics-id
```

## Contributing

1. Follow the existing code style
2. Use TypeScript strict mode
3. Write tests for new features
4. Update documentation
5. Run `pnpm lint` before committing

## License

MIT

## Support

- GitHub Issues: [state-project/agent](https://github.com/state-project/agent)
- Documentation: [docs.state.dev](https://docs.state.dev)
