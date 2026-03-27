/**
 * Plan parser for .agent files
 *
 * Extracts TODOs, tasks, and future plans from conversation text
 */

import { randomBytes } from 'crypto';

// ============================================================================
// Types
// ============================================================================

export interface ParsedPlan {
  plan: string;
  tasks: Task[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
  estimatedEffort?: string; // e.g., "2-3 days"
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  depends_on?: string[];
  assigned_to?: string;
  due_date?: string;
  tags?: string[];
  estimated_hours?: number;
}

export interface ParseOptions {
  detectTasks?: boolean;
  detectPriorities?: boolean;
  detectEstimates?: boolean;
  includeCodeBlocks?: boolean;
}

// ============================================================================
// Parsing Functions
// ============================================================================

/**
 * Parse plan from conversation messages
 */
export function parsePlanFromConversation(
  messages: Array<{ role: string; content: string | Array<{ type: string; text?: string }> }>,
  options: ParseOptions = {}
): ParsedPlan | null {
  const planParts: string[] = [];
  const tasks: Task[] = [];

  // Extract text from messages
  for (const message of messages) {
    let text = '';

    if (typeof message.content === 'string') {
      text = message.content;
    } else if (Array.isArray(message.content)) {
      text = message.content
        .filter(block => block.type === 'text')
        .map(block => block.text || '')
        .join('\n');
    }

    // Detect plan sections
    const planSection = extractPlanSection(text);
    if (planSection) {
      planParts.push(planSection);
    }

    // Detect tasks if enabled
    if (options.detectTasks !== false) {
      const detectedTasks = extractTasks(text);
      tasks.push(...detectedTasks);
    }
  }

  if (planParts.length === 0 && tasks.length === 0) {
    return null;
  }

  // Combine plan parts
  const plan = planParts.join('\n\n');

  // Generate task IDs
  const tasksWithIds = tasks.map((task, index) => ({
    ...task,
    id: `task-${Date.now()}-${index}-${randomBytes(4).toString('hex')}`
  }));

  return {
    plan,
    tasks: tasksWithIds
  };
}

/**
 * Extract plan section from text
 */
function extractPlanSection(text: string): string | null {
  const lines = text.split('\n');
  const planLines: string[] = [];
  let inPlanSection = false;
  let planDepth = 0;

  for (const line of lines) {
    // Detect plan headers
    if (/^(#+\s*)?(plan|implementation|roadmap|next steps|action items)/i.test(line)) {
      inPlanSection = true;
      planLines.push(line);
      continue;
    }

    // Detect list items (potential tasks)
    if (inPlanSection && /^[\s-]*[-*+]\s+\[?\s*([x ])\s*\]?\s*/.test(line)) {
      planLines.push(line);
      continue;
    }

    // Detect numbered lists
    if (inPlanSection && /^[\s-]*\d+\.\s+/.test(line)) {
      planLines.push(line);
      continue;
    }

    // Continue collecting plan content
    if (inPlanSection) {
      // Stop at next major section
      if (/^#+\s+[a-z]/i.test(line) && planLines.length > 0) {
        break;
      }

      // Stop at empty line followed by non-plan content
      if (line.trim() === '' && planLines.length > 3) {
        const nextLineIndex = lines.indexOf(line) + 1;
        if (nextLineIndex < lines.length) {
          const nextLine = lines[nextLineIndex];
          if (!/^[\s-]*[-*+]/.test(nextLine) && !/^\d+\./.test(nextLine)) {
            break;
          }
        }
      }

      planLines.push(line);
    }

    // Stop collecting if we've collected enough
    if (planLines.length > 50) {
      break;
    }
  }

  if (planLines.length === 0) {
    return null;
  }

  return planLines.join('\n');
}

/**
 * Extract tasks from text
 */
function extractTasks(text: string): Task[] {
  const tasks: Task[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    // Match TODO items
    const todoMatch = line.match(/^\s*[-*+]\s*\[?\s*(todo|doing|done)?\s*\]?\s*(.+)/i);
    if (todoMatch) {
      const status = parseTaskStatus(todoMatch[1]);
      const title = todoMatch[2].trim();

      if (title.length > 0) {
        tasks.push({
          id: '', // Generated later
          title,
          status,
          priority: detectPriority(title)
        });
      }
    }

    // Match numbered tasks
    const numberedMatch = line.match(/^\s*(\d+)\.\s*(\[?\s*(todo|doing|done)?\s*\]?\s*)?(.+)/i);
    if (numberedMatch) {
      const status = parseTaskStatus(numberedMatch[2]);
      const title = numberedMatch[3].trim();

      if (title.length > 0) {
        tasks.push({
          id: '',
          title,
          status,
          priority: detectPriority(title)
        });
      }
    }

    // Match @todo mentions
    const atTodoMatch = line.match(/@todo\s*:\s*(.+)/i);
    if (atTodoMatch) {
      tasks.push({
        id: '',
        title: atTodoMatch[1].trim(),
        status: 'pending',
        priority: 'medium'
      });
    }

    // Match TODO comments
    const commentTodoMatch = line.match(/\/\/\s*TODO\s*:\s*(.+)/i);
    if (commentTodoMatch) {
      tasks.push({
        id: '',
        title: commentTodoMatch[1].trim(),
        status: 'pending',
        priority: 'medium'
      });
    }
  }

  return tasks;
}

/**
 * Parse task status from string
 */
function parseTaskStatus(status?: string): Task['status'] {
  if (!status) {
    return 'pending';
  }

  const s = status.toLowerCase().trim();

  if (s === 'done' || s === 'completed' || s === 'x' || s === '✓') {
    return 'completed';
  }

  if (s === 'doing' || s === 'in-progress' || s === 'in progress') {
    return 'in_progress';
  }

  if (s === 'blocked' || s === 'blocked') {
    return 'blocked';
  }

  return 'pending';
}

/**
 * Detect priority from task title
 */
function detectPriority(title: string): Task['priority'] {
  const lower = title.toLowerCase();

  if (/!\s*p0|critical|urgent|asap|immediately/i.test(lower)) {
    return 'critical';
  }

  if (/!\s*p1|high|important|priority/i.test(lower)) {
    return 'high';
  }

  if (/!\s*p2|low|nice to have|eventually/i.test(lower)) {
    return 'low';
  }

  return 'medium';
}

/**
 * Parse structured plan from JSON
 */
export function parseStructuredPlan(data: unknown): ParsedPlan | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const plan = data as Record<string, unknown>;

  // Check for tasks array
  if (Array.isArray(plan.tasks)) {
    const tasks: Task[] = [];

    for (const task of plan.tasks) {
      if (typeof task === 'object' && task !== null) {
        const t = task as Record<string, unknown>;

        tasks.push({
          id: typeof t.id === 'string' ? t.id : generateTaskID(),
          title: typeof t.title === 'string' ? t.title : '',
          description: typeof t.description === 'string' ? t.description : undefined,
          status: parseTaskStatus(typeof t.status === 'string' ? t.status : undefined),
          priority: typeof t.priority === 'string' ? t.priority as Task['priority'] : undefined,
          depends_on: Array.isArray(t.depends_on) ? t.depends_on as string[] : undefined,
          assigned_to: typeof t.assigned_to === 'string' ? t.assigned_to : undefined,
          due_date: typeof t.due_date === 'string' ? t.due_date : undefined
        });
      }
    }

    return {
      plan: typeof t.plan === 'string' ? t.plan : '',
      tasks
    };
  }

  return null;
}

/**
 * Parse plan from markdown text
 */
export function parseMarkdownPlan(markdown: string): ParsedPlan | null {
  const lines = markdown.split('\n');
  const tasks: Task[] = [];
  let currentSection = '';

  for (const line of lines) {
    // Detect headers
    if (line.startsWith('#')) {
      currentSection = line.replace(/^#+\s*/, '').toLowerCase();
      continue;
    }

    // Detect tasks in relevant sections
    if (/plan|tasks|todo|roadmap|next steps/i.test(currentSection)) {
      const taskMatch = line.match(/^[\s-]*[-*+]\s*\[?\s*([x ])\s*\]?\s*(.+)/i);
      if (taskMatch) {
        const status = parseTaskStatus(taskMatch[1]);
        const title = taskMatch[2].trim();

        if (title.length > 0) {
          tasks.push({
            id: generateTaskID(),
            title,
            status,
            priority: detectPriority(title)
          });
        }
      }
    }
  }

  if (tasks.length === 0) {
    return null;
  }

  return {
    plan: markdown,
    tasks
  };
}

/**
 * Generate unique task ID
 */
function generateTaskID(): string {
  return `task-${Date.now()}-${randomBytes(8).toString('hex')}`;
}

/**
 * Sort tasks by priority and dependencies
 */
export function sortTasks(tasks: Task[]): Task[] {
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  return [...tasks].sort((a, b) => {
    // First sort by status
    const statusOrder = { blocked: 0, pending: 1, in_progress: 2, completed: 3 };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;

    // Then by priority
    const priorityDiff = priorityOrder[a.priority || 'medium'] - priorityOrder[b.priority || 'medium'];
    if (priorityDiff !== 0) return priorityDiff;

    // Finally by title
    return a.title.localeCompare(b.title);
  });
}

/**
 * Filter tasks by status
 */
export function filterTasksByStatus(
  tasks: Task[],
  status: Task['status']
): Task[] {
  return tasks.filter(task => task.status === status);
}

/**
 * Get next actionable tasks (not blocked, not completed)
 */
export function getNextTasks(tasks: Task[]): Task[] {
  const completedIds = new Set(
    tasks.filter(t => t.status === 'completed').map(t => t.id)
  );

  return tasks.filter(task => {
    // Skip completed tasks
    if (task.status === 'completed' || task.status === 'blocked') {
      return false;
    }

    // Skip tasks with unmet dependencies
    if (task.depends_on && task.depends_on.length > 0) {
      const depsMet = task.depends_on.every(depId => completedIdhas(depId));
      if (!depsMet) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Calculate task completion percentage
 */
export function calculateCompletion(tasks: Task[]): number {
  if (tasks.length === 0) {
    return 0;
  }

  const completed = tasks.filter(t => t.status === 'completed').length;
  return Math.round((completed / tasks.length) * 100);
}

/**
 * Estimate total effort from tasks
 */
export function estimateTotalEffort(tasks: Task[]): {
  totalHours: number;
  completedHours: number;
  remainingHours: number;
} {
  let totalHours = 0;
  let completedHours = 0;

  for (const task of tasks) {
    const hours = task.estimated_hours || 4; // Default 4 hours per task
    totalHours += hours;

    if (task.status === 'completed') {
      completedHours += hours;
    }
  }

  return {
    totalHours,
    completedHours,
    remainingHours: totalHours - completedHours
  };
}
