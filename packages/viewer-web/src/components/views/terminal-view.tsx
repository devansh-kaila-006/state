'use client'

import { Terminal as TerminalIcon, ChevronRight, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface TerminalCommand {
  command: string
  output?: string
  exit_code?: number
  timestamp?: string
}

interface TerminalSession {
  id: string
  shell?: string
  directory?: string
  commands: TerminalCommand[]
}

interface TerminalViewProps {
  terminal: {
    sessions: TerminalSession[]
  }
}

export default function TerminalView({ terminal }: TerminalViewProps) {
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(
    new Set(terminal.sessions.map((s) => s.id))
  )

  const toggleSession = (sessionId: string) => {
    setExpandedSessions((prev) => {
      const next = new Set(prev)
      if (next.has(sessionId)) {
        next.delete(sessionId)
      } else {
        next.add(sessionId)
      }
      return next
    })
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <TerminalIcon className="w-6 h-6" />
          Terminal History
        </h2>
        <p className="text-muted-foreground">
          {terminal.sessions.length} session
          {terminal.sessions.length !== 1 ? 's' : ''} •{' '}
          {terminal.sessions.reduce((acc, s) => acc + s.commands.length, 0)} commands
        </p>
      </div>

      <div className="space-y-4">
        {terminal.sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            isExpanded={expandedSessions.has(session.id)}
            onToggle={() => toggleSession(session.id)}
          />
        ))}

        {terminal.sessions.length === 0 && (
          <div className="text-center py-12">
            <TerminalIcon className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No terminal history available</p>
          </div>
        )}
      </div>
    </div>
  )
}

function SessionCard({
  session,
  isExpanded,
  onToggle,
}: {
  session: TerminalSession
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
          <div className="text-left">
            <div className="font-medium text-sm">
              {session.shell || 'Session'} • {session.commands.length} command
              {session.commands.length !== 1 ? 's' : ''}
            </div>
            {session.directory && (
              <div className="text-xs text-muted-foreground font-mono">
                {session.directory}
              </div>
            )}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border bg-background">
          <div className="divide-y divide-border">
            {session.commands.map((cmd, idx) => (
              <CommandBlock key={idx} command={cmd} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CommandBlock({ command }: { command: TerminalCommand }) {
  const [showOutput, setShowOutput] = useState(true)

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-green-500 font-bold">$</span>
        <code className="text-sm font-mono flex-1">{command.command}</code>
        {command.output && (
          <button
            onClick={() => setShowOutput(!showOutput)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showOutput ? 'Hide' : 'Show'} Output
          </button>
        )}
      </div>

      {showOutput && command.output && (
        <pre className="bg-muted/50 rounded p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
          <code>{command.output}</code>
        </pre>
      )}

      {command.exit_code !== undefined && command.exit_code !== 0 && (
        <div className="mt-2 text-xs text-destructive">
          Exit code: {command.exit_code}
        </div>
      )}
    </div>
  )
}
