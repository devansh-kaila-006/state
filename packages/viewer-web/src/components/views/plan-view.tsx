'use client'

import { CheckCircle2, Circle, AlertCircle, Clock, ListTodo } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

interface Task {
  id: string
  title: string
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  priority?: 'critical' | 'high' | 'medium' | 'low'
  assignee?: string
  tags?: string[]
  due_date?: string
  dependencies?: string[]
}

interface Plan {
  content?: string
  tasks?: Task[]
}

interface PlanViewProps {
  plan: Plan
}

export default function PlanView({ plan }: PlanViewProps) {
  const hasTasks = plan.tasks && plan.tasks.length > 0
  const hasContent = plan.content && plan.content.trim().length > 0

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <ListTodo className="w-6 h-6" />
          Future Plan
        </h2>
        <p className="text-muted-foreground">
          {hasTasks ? `${plan.tasks?.length} task${plan.tasks?.length !== 1 ? 's' : ''}` : 'No tasks'}
          {hasContent && hasTasks && ' • '}
          {hasContent && 'Plan documentation'}
        </p>
      </div>

      <div className="space-y-6">
        {/* Tasks Section */}
        {hasTasks && (
          <div className="space-y-4">
            <TaskStats tasks={plan.tasks!} />

            <div className="space-y-2">
              {plan.tasks!.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        {/* Markdown Plan */}
        {hasContent && (
          <div className="border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Plan Details</h3>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {plan.content!}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {!hasTasks && !hasContent && (
          <div className="text-center py-12">
            <ListTodo className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No plan information available</p>
          </div>
        )}
      </div>
    </div>
  )
}

function TaskStats({ tasks }: { tasks: Task[] }) {
  const stats = {
    completed: tasks.filter((t) => t.status === 'completed').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    blocked: tasks.filter((t) => t.status === 'blocked').length,
  }

  const total = tasks.length
  const completion = (stats.completed / total) * 100

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Completed" value={stats.completed} className="text-green-500" />
      <StatCard label="In Progress" value={stats.inProgress} className="text-blue-500" />
      <StatCard label="Pending" value={stats.pending} className="text-muted-foreground" />
      <StatCard label="Blocked" value={stats.blocked} className="text-red-500" />

      <div className="col-span-2 md:col-cols-4 md:col-span-4 border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm text-muted-foreground">{completion.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  className,
}: {
  label: string
  value: number
  className?: string
}) {
  return (
    <div className="border border-border rounded-lg p-4">
      <div className={cn('text-2xl font-bold', className)}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

function TaskCard({ task }: { task: Task }) {
  const statusConfig = {
    pending: {
      icon: Circle,
      color: 'text-muted-foreground',
      bg: 'bg-muted/50',
      label: 'Pending',
    },
    in_progress: {
      icon: Clock,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      label: 'In Progress',
    },
    completed: {
      icon: CheckCircle2,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      label: 'Completed',
    },
    blocked: {
      icon: AlertCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      label: 'Blocked',
    },
  }

  const config = statusConfig[task.status]
  const Icon = config.icon

  const priorityConfig = {
    critical: 'bg-red-500 text-white',
    high: 'bg-orange-500 text-white',
    medium: 'bg-yellow-500 text-black',
    low: 'bg-gray-500 text-white',
  }

  return (
    <div className={cn('border border-border rounded-lg p-4', config.bg)}>
      <div className="flex items-start gap-3">
        <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', config.color)} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className={cn('font-medium', task.status === 'completed' && 'line-through text-muted-foreground')}>
              {task.title}
            </h4>

            {task.priority && (
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-xs font-medium',
                  priorityConfig[task.priority]
                )}
              >
                {task.priority}
              </span>
            )}

            <span className={cn('px-2 py-0.5 rounded text-xs font-medium', config.bg, config.color)}>
              {config.label}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {task.assignee && (
              <span>Assigned to: {task.assignee}</span>
            )}
            {task.due_date && (
              <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
            )}
          </div>

          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-accent rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
