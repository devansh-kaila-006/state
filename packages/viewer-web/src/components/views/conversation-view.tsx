'use client'

import { User, Bot, Tool, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Button } from '@/components/ui/button'
import { cn, formatDate } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
  model?: string
  tools_used?: Array<{
    name: string
    input: Record<string, unknown>
    output?: Record<string, unknown>
  }>
}

interface ConversationViewProps {
  messages: Message[]
}

export default function ConversationView({ messages }: ConversationViewProps) {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {messages.map((message, index) => (
        <MessageBubble key={message.id || index} message={message} />
      ))}

      {messages.length === 0 && (
        <div className="text-center py-12">
          <Bot className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No messages in this conversation</p>
        </div>
      )}
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn(
        'flex gap-4 group',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>

      {/* Content */}
      <div className={cn('flex-1 space-y-2', isUser ? 'items-end' : 'items-start')}>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">
            {isUser ? 'You' : message.model || 'Assistant'}
          </span>
          {message.timestamp && (
            <span className="text-xs text-muted-foreground">
              {formatDate(message.timestamp)}
            </span>
          )}
        </div>

        {/* Message Content */}
        <div
          className={cn(
            'rounded-lg p-4 max-w-[85%]',
            isUser
              ? 'bg-primary text-primary-foreground ml-auto'
              : 'bg-muted text-foreground'
          )}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                    <div className="relative group">
                      <SyntaxHighlighter
                        style={isUser ? vs : vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-md"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code
                      className={cn(
                        'px-1.5 py-0.5 rounded text-sm',
                        isUser
                          ? 'bg-primary-foreground/20'
                          : 'bg-background'
                      )}
                      {...props}
                    >
                      {children}
                    </code>
                  )
                },
                p({ children }) {
                  return <p className="mb-2 last:mb-0">{children}</p>
                },
                ul({ children }) {
                  return <ul className="list-disc pl-4 mb-2">{children}</ul>
                },
                ol({ children }) {
                  return <ol className="list-decimal pl-4 mb-2">{children}</ol>
                },
                li({ children }) {
                  return <li className="mb-1">{children}</li>
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Tools Used */}
        {message.tools_used && message.tools_used.length > 0 && (
          <div className="space-y-2">
            {message.tools_used.map((tool, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded px-3 py-2"
              >
                <Tool className="w-4 h-4" />
                <span className="font-medium">{tool.name}</span>
                <span className="text-xs opacity-70">
                  {Object.keys(tool.input).length} inputs
                  {tool.output && ` + ${Object.keys(tool.output).length} outputs`}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Copy Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
