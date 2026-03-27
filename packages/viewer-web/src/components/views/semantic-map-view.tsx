'use client'

import { useState, useMemo } from 'react'
import {
  File,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Code2,
  Package,
} from 'lucide-react'
import { cn, getLanguageIcon } from '@/lib/utils'

interface FileInfo {
  path: string
  language?: string
  size?: number
  functions?: string[]
  classes?: string[]
  imports?: string[]
}

interface SemanticMap {
  files: FileInfo[]
  dependencies?: Record<string, string[]>
}

interface SemanticMapViewProps {
  semanticMap: SemanticMap
}

export default function SemanticMapView({ semanticMap }: SemanticMapViewProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  const fileTree = useMemo(() => {
    const tree: Record<string, any> = {}

    for (const file of semanticMap.files) {
      const parts = file.path.split('/')
      let current = tree

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        const isFile = i === parts.length - 1

        if (!current[part]) {
          current[part] = isFile
            ? { type: 'file', data: file }
            : { type: 'folder', children: {} }
        }

        if (!isFile) {
          current = current[part].children
        }
      }
    }

    return tree
  }, [semanticMap.files])

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const renderTree = (tree: any, path: string = '') => {
    return Object.entries(tree)
      .sort(([a, aData], [b, bData]) => {
        // Sort folders first, then files
        const aIsFolder = aData.type === 'folder'
        const bIsFolder = bData.type === 'folder'
        if (aIsFolder && !bIsFolder) return -1
        if (!aIsFolder && bIsFolder) return 1
        return a.localeCompare(b)
      })
      .map(([name, data]) => {
        const fullPath = path ? `${path}/${name}` : name
        const isExpanded = expandedFolders.has(fullPath)

        if (data.type === 'folder') {
          return (
            <div key={fullPath} className="ml-4">
              <button
                onClick={() => toggleFolder(fullPath)}
                className="flex items-center gap-2 py-1 px-2 rounded hover:bg-accent w-full text-left transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                {isExpanded ? (
                  <FolderOpen className="w-4 h-4 text-blue-500" />
                ) : (
                  <Folder className="w-4 h-4 text-blue-500" />
                )}
                <span className="text-sm font-medium">{name}</span>
              </button>
              {isExpanded && (
                <div className="border-l border-border ml-3 pl-1">
                  {renderTree(data.children, fullPath)}
                </div>
              )}
            </div>
          )
        }

        const file = data.data as FileInfo
        return <FileItem key={fullPath} file={file} />
      })
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Semantic Map</h2>
        <p className="text-muted-foreground">
          {semanticMap.files.length} files • Project structure and code graph
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Tree */}
        <div className="border border-border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            File Tree
          </h3>
          <div className="space-y-1 max-h-[600px] overflow-auto scrollbar-thin">
            {renderTree(fileTree)}
          </div>
        </div>

        {/* Statistics */}
        <div className="space-y-4">
          <div className="border border-border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Code2 className="w-5 h-5" />
              Language Distribution
            </h3>
            <LanguageStats files={semanticMap.files} />
          </div>

          {semanticMap.dependencies && (
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Dependencies
              </h3>
              <DependencyList dependencies={semanticMap.dependencies} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FileItem({ file }: { file: FileInfo }) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className="ml-4">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 py-1 px-2 rounded hover:bg-accent w-full text-left transition-colors"
      >
        <span className="text-lg">{getLanguageIcon(file.language || '')}</span>
        <File className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm">{file.path.split('/').pop()}</span>
        {file.size && (
          <span className="text-xs text-muted-foreground ml-auto">
            {(file.size / 1024).toFixed(1)} KB
          </span>
        )}
      </button>

      {showDetails && (
        <div className="ml-6 mt-2 space-y-2 text-sm">
          <div className="bg-muted/50 rounded p-3 space-y-1">
            <div className="text-xs text-muted-foreground">Path</div>
            <div className="font-mono text-xs">{file.path}</div>
            {file.language && (
              <>
                <div className="text-xs text-muted-foreground mt-2">Language</div>
                <div className="capitalize">{file.language}</div>
              </>
            )}
            {(file.functions?.length || file.classes?.length) && (
              <>
                <div className="text-xs text-muted-foreground mt-2">
                  Definitions ({(file.functions?.length || 0) + (file.classes?.length || 0)})
                </div>
                <div className="space-y-1">
                  {file.classes?.map((cls) => (
                    <div key={cls} className="font-mono text-xs text-blue-400">
                      class {cls}
                    </div>
                  ))}
                  {file.functions?.map((fn) => (
                    <div key={fn} className="font-mono text-xs text-green-400">
                      {fn}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function LanguageStats({ files }: { files: FileInfo[] }) {
  const stats = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const file of files) {
      if (file.language) {
        counts[file.language] = (counts[file.language] || 0) + 1
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [files])

  if (stats.length === 0) {
    return <p className="text-sm text-muted-foreground">No language data available</p>
  }

  return (
    <div className="space-y-2">
      {stats.map(([lang, count]) => {
        const percentage = (count / files.length) * 100
        return (
          <div key={lang} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="capitalize flex items-center gap-2">
                <span>{getLanguageIcon(lang)}</span>
                {lang}
              </span>
              <span className="text-muted-foreground">{count} files ({percentage.toFixed(0)}%)</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DependencyList({ dependencies }: { dependencies: Record<string, string[]> }) {
  const entries = Object.entries(dependencies).slice(0, 20)

  return (
    <div className="space-y-2 max-h-[300px] overflow-auto scrollbar-thin">
      {entries.map(([file, deps]) => (
        <div key={file} className="text-sm">
          <div className="font-mono text-xs text-muted-foreground mb-1">{file}</div>
          <div className="flex flex-wrap gap-1">
            {deps.slice(0, 5).map((dep) => (
              <span
                key={dep}
                className="px-2 py-0.5 bg-accent rounded text-xs font-mono"
              >
                {dep}
              </span>
            ))}
            {deps.length > 5 && (
              <span className="text-xs text-muted-foreground">
                +{deps.length - 5} more
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
