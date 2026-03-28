'use client'

import { useState, useEffect, useCallback } from 'react'
import { Upload, FileText, Moon, Sun, Github, Clock, FolderOpen, Settings, X, Minimize, Maximize2 } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { tauriAPI, isTauri, type RecentFile } from '@/lib/tauri-api'

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
  const [filePath, setFilePath] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([])
  const [appVersion, setAppVersion] = useState<string>('')
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Load preferences on mount
  useEffect(() => {
    setMounted(true)

    const loadInitialData = async () => {
      if (isTauri) {
        try {
          const prefs = await tauriAPI.getPreferences()
          setRecentFiles(prefs.recent_files || [])
          const version = await tauriAPI.getAppVersion()
          setAppVersion(version)
        } catch (err) {
          console.error('Failed to load preferences:', err)
        }
      }
    }

    loadInitialData()
  }, [])

  const handleFileSelect = useCallback(async (file: File, path?: string) => {
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
      setFilePath(path || null)

      // Add to recent files
      if (isTauri && path) {
        try {
          await tauriAPI.addRecentFile({
            path,
            title: file.name,
            opened_at: Date.now(),
            file_size: file.size,
          })
          // Reload recent files
          const prefs = await tauriAPI.getPreferences()
          setRecentFiles(prefs.recent_files || [])
        } catch (err) {
          console.error('Failed to add to recent files:', err)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleOpenFileDialog = useCallback(async () => {
    if (!isTauri) {
      // For web, trigger file input click
      document.getElementById('file-input')?.click()
      return
    }

    try {
      const path = await tauriAPI.openFileDialog()
      if (path) {
        // Read file using Tauri
        const buffer = await tauriAPI.readFile(path)
        const blob = new Blob([buffer], { type: 'application/zip' })
        const file = new File([blob], path.split(/[/\\]/).pop() || 'file.agent', {
          type: 'application/zip',
        })

        await handleFileSelect(file, path)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open file')
    }
  }, [handleFileSelect])

  const handleRecentFileClick = useCallback(async (recentFile: RecentFile) => {
    try {
      const buffer = await tauriAPI.readFile(recentFile.path)
      const blob = new Blob([buffer], { type: 'application/zip' })
      const file = new File([blob], recentFile.path.split(/[/\\]/).pop() || 'file.agent', {
        type: 'application/zip',
      })

      await handleFileSelect(file, recentFile.path)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open file')
    }
  }, [handleFileSelect])

  const handleClearRecent = useCallback(async () => {
    try {
      await tauriAPI.clearRecentFiles()
      setRecentFiles([])
    } catch (err) {
      console.error('Failed to clear recent files:', err)
    }
  }, [])

  const handleReset = useCallback(() => {
    setAgentFile(null)
    setArrayBuffer(null)
    setFilePath(null)
    setError(null)
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Ctrl/Cmd + O: Open file
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault()
        await handleOpenFileDialog()
      }

      // Ctrl/Cmd + W: Close file
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault()
        handleReset()
      }

      // Ctrl/Cmd + D: Toggle dark mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        setTheme(theme === 'dark' ? 'light' : 'dark')
      }

      // Escape: Close file or reset
      if (e.key === 'Escape') {
        handleReset()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [theme, handleOpenFileDialog, handleReset])

  return (
    <div className="min-h-screen bg-background">
      {/* Title Bar (Tauri only) */}
      {isTauri && (
        <div data-tauri-draggable className="h-8 bg-border border-b border-border flex items-center px-4 select-none">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">State Viewer</span>
          </div>

          <div className="ml-auto flex items-center gap-2" data-tauri-draggable="false">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => tauriAPI.minimizeWindow()}
            >
              <Minimize className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => tauriAPI.maximizeWindow()}
            >
              <Maximize2 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => tauriAPI.closeWindow()}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                State Viewer
                {isTauri && appVersion && (
                  <span className="text-xs text-muted-foreground font-normal">v{appVersion}</span>
                )}
              </h1>
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
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button size="lg" onClick={handleOpenFileDialog} disabled={isLoading}>
                <Upload className="w-4 h-4 mr-2" />
                Open File
                <span className="ml-2 text-xs text-muted-foreground">(Ctrl+O)</span>
              </Button>

              <Button size="lg" variant="outline" onClick={() => document.getElementById('file-input')?.click()}>
                <FolderOpen className="w-4 h-4 mr-2" />
                Browse
              </Button>

              <input
                id="file-input"
                type="file"
                accept=".agent"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>

            {/* Recent Files */}
            {isTauri && recentFiles.length > 0 && (
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Recent Files
                  </h3>
                  <Button variant="ghost" size="sm" onClick={handleClearRecent}>
                    Clear
                  </Button>
                </div>

                <div className="space-y-2">
                  {recentFiles.map((file) => (
                    <button
                      key={file.path}
                      onClick={() => handleRecentFileClick(file)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{file.title || file.path}</div>
                        <div className="text-xs text-muted-foreground truncate">{file.path}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(file.opened_at).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Zone */}
            <div
              onDrop={(e) => {
                e.preventDefault()
                const file = e.dataTransfer.files[0]
                if (file) {
                  handleFileSelect(file)
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              className={cn(
                'border-2 border-dashed rounded-xl p-12 text-center transition-colors',
                'hover:border-primary/50 hover:bg-accent/5',
                'cursor-pointer min-h-[300px] flex flex-col items-center justify-center gap-6'
              )}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Upload className="w-12 h-12 text-primary" />
              </div>

              <div className="max-w-md space-y-2">
                <h2 className="text-2xl font-bold">Open .agent File</h2>
                <p className="text-muted-foreground">
                  Click to browse, drag and drop, or use Ctrl+O
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

              <Button size="lg" disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Select File'}
              </Button>

              {error && (
                <div className="p-4 rounded-lg bg-destructive/10 text-destructive max-w-md">
                  {error}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{agentFile.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {(agentFile.size / 1024 / 1024).toFixed(2)} MB
                  {filePath && (
                    <span className="ml-2">• {filePath}</span>
                  )}
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
          {isTauri && (
            <p className="mt-2 text-xs">
              Desktop App v{appVersion}
            </p>
          )}
        </div>
      </footer>
    </div>
  )
}
