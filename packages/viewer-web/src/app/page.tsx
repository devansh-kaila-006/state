'use client'

import dynamic from 'next/dynamic'
import { useState, useCallback } from 'react'
import { Upload, FileText, Moon, Sun, Github } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const AgentViewer = dynamic(() => import('@/components/agent-viewer'), {
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-pulse text-muted-foreground">Loading viewer...</div>
    </div>
  ),
  ssr: false,
})

export default function HomePage() {
  const [agentFile, setAgentFile] = useState<File | null>(null)
  const [arrayBuffer, setArrayBuffer] = useState<ArrayBuffer | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useState(() => {
    setMounted(true)
  })

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.name.endsWith('.agent')) {
      setError('Please select a .agent file')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const buffer = await file.arrayBuffer()
      setAgentFile(file)
      setArrayBuffer(buffer)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [handleFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [handleFileSelect]
  )

  const handleReset = useCallback(() => {
    setAgentFile(null)
    setArrayBuffer(null)
    setError(null)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">State Viewer</h1>
              <p className="text-sm text-muted-foreground">.agent File Viewer</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              asChild
              aria-label="GitHub repository"
            >
              <a
                href="https://github.com/state-project/agent"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!agentFile ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={cn(
              'border-2 border-dashed rounded-xl p-12 text-center transition-colors',
              'hover:border-primary/50 hover:bg-accent/5',
              'cursor-pointer min-h-[500px] flex flex-col items-center justify-center gap-6'
            )}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Upload className="w-12 h-12 text-primary" />
            </div>

            <div className="max-w-md space-y-2">
              <h2 className="text-2xl font-bold">Upload .agent File</h2>
              <p className="text-muted-foreground">
                Drag and drop a .agent file here, or click to browse
              </p>
            </div>

            <div className="space-y-4 text-sm text-muted-foreground">
              <p>Supported formats:</p>
              <ul className="space-y-1">
                <li>✅ Conversations from Claude Code</li>
                <li>✅ Conversations from ChatGPT</li>
                <li>✅ Semantic maps and code structure</li>
                <li>✅ Terminal history</li>
                <li>✅ Future plans and tasks</li>
              </ul>
            </div>

            <input
              id="file-input"
              type="file"
              accept=".agent"
              onChange={handleFileInput}
              className="hidden"
            />

            <Button size="lg" disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Select File'}
            </Button>

            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 text-destructive max-w-md">
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{agentFile.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {(agentFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button onClick={handleReset} variant="outline">
                Close File
              </Button>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              {arrayBuffer && <AgentViewer buffer={arrayBuffer} />}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>
            State Viewer - Open source .agent file viewer •{' '}
            <a
              href="https://github.com/state-project/agent"
              className="underline hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
