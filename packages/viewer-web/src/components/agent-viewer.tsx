'use client'

import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Code2, Terminal, ListTodo } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import ConversationView from './views/conversation-view'
import SemanticMapView from './views/semantic-map-view'
import TerminalView from './views/terminal-view'
import PlanView from './views/plan-view'

type ViewType = 'conversation' | 'semantic' | 'terminal' | 'plan'

interface AgentViewerProps {
  buffer: ArrayBuffer
}

interface AgentData {
  manifest: any
  conversations: any[]
  semanticMap?: any
  terminal?: any
  plan?: any
}

export default function AgentViewer({ buffer }: AgentViewerProps) {
  const [data, setData] = useState<AgentData | null>(null)
  const [activeView, setActiveView] = useState<ViewType>('conversation')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAgentFile = async () => {
      try {
        setLoading(true)
        setError(null)

        const JSZip = (await import('jszip')).default
        const zip = await JSZip.loadAsync(buffer)

        // Load manifest
        const manifestFile = zip.file('manifest.json')
        if (!manifestFile) {
          throw new Error('Invalid .agent file: manifest.json not found')
        }
        const manifestText = await manifestFile.async('string')
        const manifest = JSON.parse(manifestText)

        // Load conversation
        const conversationFile = zip.file('conversation/messages.json')
        let conversations: any[] = []
        if (conversationFile) {
          const conversationText = await conversationFile.async('string')
          const conversationData = JSON.parse(conversationText)
          conversations = conversationData.messages || []
        }

        // Load semantic map
        let semanticMap: any = null
        const semanticFile = zip.file('semantic-map/file-tree.json')
        if (semanticFile) {
          const semanticText = await semanticFile.async('string')
          semanticMap = JSON.parse(semanticText)
        }

        // Load terminal
        let terminal: any = null
        const terminalFile = zip.file('terminal/sessions.json')
        if (terminalFile) {
          const terminalText = await terminalFile.async('string')
          terminal = JSON.parse(terminalText)
        }

        // Load plan
        let plan: any = null
        const planFile = zip.file('future-plan/plan.md')
        if (planFile) {
          const planText = await planFile.async('string')
          plan = { content: planText }
        }
        const tasksFile = zip.file('future-plan/tasks.json')
        if (tasksFile) {
          const tasksText = await tasksFile.async('string')
          const tasks = JSON.parse(tasksText)
          plan = { ...plan, tasks }
        }

        setData({
          manifest,
          conversations,
          semanticMap,
          terminal,
          plan,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load .agent file')
      } finally {
        setLoading(false)
      }
    }

    loadAgentFile()
  }, [buffer])

  const views = [
    { id: 'conversation' as ViewType, label: 'Conversation', icon: MessageSquare, available: true },
    { id: 'semantic' as ViewType, label: 'Semantic Map', icon: Code2, available: !!data?.semanticMap },
    { id: 'terminal' as ViewType, label: 'Terminal', icon: Terminal, available: !!data?.terminal },
    { id: 'plan' as ViewType, label: 'Plan', icon: ListTodo, available: !!data?.plan },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="text-muted-foreground">Loading .agent file...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-destructive text-4xl">⚠️</div>
          <h3 className="text-lg font-semibold text-destructive">Error Loading File</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="flex flex-col lg:flex-row h-[800px]">
      {/* Sidebar */}
      <div className="w-full lg:w-64 border-r border-border bg-muted/30">
        <div className="p-4 space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4">Views</h3>
          {views.map((view) => {
            const Icon = view.icon
            return (
              <Button
                key={view.id}
                variant={activeView === view.id ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-2',
                  !view.available && 'opacity-50 cursor-not-allowed'
                )}
                onClick={() => view.available && setActiveView(view.id)}
                disabled={!view.available}
              >
                <Icon className="h-4 w-4" />
                {view.label}
                {!view.available && <span className="text-xs">(empty)</span>}
              </Button>
            )
          })}
        </div>

        {/* Metadata */}
        <div className="p-4 border-t border-border space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Metadata</h3>
          <div className="space-y-2 text-sm">
            {data.manifest.metadata?.title && (
              <div>
                <span className="text-muted-foreground">Title:</span>{' '}
                <span className="font-medium">{data.manifest.metadata.title}</span>
              </div>
            )}
            {data.manifest.source_tool?.name && (
              <div>
                <span className="text-muted-foreground">Source:</span>{' '}
                <span className="font-medium capitalize">{data.manifest.source_tool.name}</span>
              </div>
            )}
            {data.manifest.created_at && (
              <div>
                <span className="text-muted-foreground">Created:</span>{' '}
                <span className="font-medium">
                  {new Date(data.manifest.created_at).toLocaleDateString()}
                </span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Messages:</span>{' '}
              <span className="font-medium">{data.conversations.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {activeView === 'conversation' && (
          <ConversationView messages={data.conversations} />
        )}
        {activeView === 'semantic' && data.semanticMap && (
          <SemanticMapView semanticMap={data.semanticMap} />
        )}
        {activeView === 'terminal' && data.terminal && (
          <TerminalView terminal={data.terminal} />
        )}
        {activeView === 'plan' && data.plan && (
          <PlanView plan={data.plan} />
        )}
      </div>
    </div>
  )
}
