/**
 * Manual/clipboard importer for .agent files
 *
 * Universal fallback importer for tools without APIs or ad-hoc imports.
 * Supports Claude JSON, ChatGPT markdown, and generic conversation formats.
 */

import { AgentFile, Message } from '@state/format';
import clipboardy from 'clipboardy';

// ============================================================================
// Types
// ============================================================================

export type DetectedFormat =
  | 'claude-json'
  | 'chatgpt-markdown'
  | 'generic-markdown'
  | 'unknown';

export interface ParsedMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  model?: string;
  tools_used?: Array<{
    name: string;
    input: Record<string, unknown>;
    output?: Record<string, unknown>;
  }>;
}

export interface ImportOptions {
  title?: string;
  language?: string;
  model?: string;
  autoDetect?: boolean;
}

export interface ImportResult {
  agentFile: AgentFile;
  format: DetectedFormat;
  messageCount: number;
  warnings: string[];
}

// ============================================================================
// Format Detection
// ============================================================================

/**
 * Detect the format of input text
 */
export function detectFormat(text: string): DetectedFormat {
  const trimmed = text.trim();

  // Check for Claude JSON format
  if (
    trimmed.startsWith('{') &&
    (trimmed.includes('"conversations"') ||
      trimmed.includes('"messages"') ||
      trimmed.includes('"conversation_id"'))
  ) {
    return 'claude-json';
  }

  // Check for ChatGPT-style markdown
  // ChatGPT exports often have "**User:**" or "**Assistant:**" patterns
  if (/\*\*(User|Assistant|ChatGPT)\*\*:/i.test(trimmed)) {
    return 'chatgpt-markdown';
  }

  // Check for generic markdown conversation
  // Look for common patterns like "### User", "## Assistant", etc.
  if (
    /^(#{1,3}\s*(User|Assistant|Human|AI|System)\b|^\s*[-*]\s*(User|Assistant|Human|AI|System)\b)/im.test(
      trimmed
    )
  ) {
    return 'generic-markdown';
  }

  // Check for code block patterns that might be a conversation
  if (
    /^\s*```[\s\S]*```\s*$/im.test(trimmed) &&
    (trimmed.toLowerCase().includes('user') ||
      trimmed.toLowerCase().includes('assistant'))
  ) {
    return 'generic-markdown';
  }

  return 'unknown';
}

// ============================================================================
// Main Import Function
// ============================================================================

/**
 * Import conversation from text
 */
export async function importFromText(
  text: string,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const warnings: string[] = [];
  let format: DetectedFormat;
  let messages: ParsedMessage[];

  if (options.autoDetect !== false) {
    format = detectFormat(text);
  } else {
    format = 'unknown';
  }

  // Parse based on detected format
  switch (format) {
    case 'claude-json':
      messages = parseClaudeJSON(text, warnings);
      break;
    case 'chatgpt-markdown':
      messages = parseChatGPTMarkdown(text, warnings);
      break;
    case 'generic-markdown':
      messages = parseGenericMarkdown(text, warnings);
      break;
    default:
      // Treat as single user message
      messages = [
        {
          role: 'user',
          content: text,
          timestamp: new Date().toISOString()
        }
      ];
      warnings.push('Could not detect format, treating as single user message');
  }

  // Create .agent file
  const agentFile = await AgentFile.create({
    metadata: {
      title: options.title || generateTitle(messages),
      language: options.language || detectLanguage(messages)
    },
    sourceTool: {
      name: 'manual',
      version: '1.0.0',
      model: options.model
    }
  });

  // Convert and add messages
  const convertedMessages: Message[] = messages.map(msg => ({
    id: generateId(),
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp || new Date().toISOString(),
    model: msg.model || options.model,
    tools_used: msg.tools_used
  }));

  await agentFile.addConversation(convertedMessages);

  return {
    agentFile,
    format,
    messageCount: messages.length,
    warnings
  };
}

/**
 * Import from system clipboard
 */
export async function importFromClipboard(
  options: ImportOptions = {}
): Promise<ImportResult> {
  try {
    const text = await clipboardy.read();
    return await importFromText(text, options);
  } catch (error) {
    throw new Error(
      `Failed to read clipboard: ${(error as Error).message}. Make sure clipboard access is enabled.`
    );
  }
}

// ============================================================================
// Parsers
// ============================================================================

/**
 * Parse Claude Code JSON format
 */
function parseClaudeJSON(
  text: string,
  warnings: string[]
): ParsedMessage[] {
  try {
    const data = JSON.parse(text);
    const messages: ParsedMessage[] = [];

    // Handle different Claude JSON structures
    if (data.messages && Array.isArray(data.messages)) {
      // Direct messages array
      for (const msg of data.messages) {
        messages.push({
          role: msg.role || 'user',
          content: msg.content || '',
          timestamp: msg.timestamp || msg.created_at,
          model: msg.model
        });
      }
    } else if (data.conversations && Array.isArray(data.conversations)) {
      // Conversations array
      for (const conv of data.conversations) {
        if (conv.messages && Array.isArray(conv.messages)) {
          for (const msg of conv.messages) {
            messages.push({
              role: msg.role || 'user',
              content: msg.content || '',
              timestamp: msg.timestamp || msg.created_at,
              model: msg.model
            });
          }
        }
      }
    } else if (data.mapping) {
      // Claude tree structure (similar to ChatGPT)
      const nodeIds = Object.keys(data.mapping);
      for (const nodeId of nodeIds) {
        const node = data.mapping[nodeId];
        if (node.message) {
          const msg = node.message;
          messages.push({
            role: msg.author?.role === 'assistant' ? 'assistant' : 'user',
            content: extractContentFromParts(msg.content),
            timestamp: msg.create_time
              ? new Date(msg.create_time * 1000).toISOString()
              : undefined
          });
        }
      }
    } else {
      warnings.push('Unrecognized Claude JSON structure');
    }

    return messages;
  } catch (error) {
    warnings.push(`Failed to parse Claude JSON: ${(error as Error).message}`);
    return [];
  }
}

/**
 * Parse ChatGPT-style markdown format
 */
function parseChatGPTMarkdown(
  text: string,
  warnings: string[]
): ParsedMessage[] {
  const messages: ParsedMessage[] = [];
  const lines = text.split('\n');

  let currentRole: 'user' | 'assistant' | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    // Check for role markers
    const roleMatch = line.match(/^\*\*(User|Assistant|ChatGPT)\*\*:\s*$/i);
    if (roleMatch) {
      // Save previous message if exists
      if (currentRole && currentContent.length > 0) {
        messages.push({
          role: currentRole,
          content: currentContent.join('\n').trim()
        });
      }

      // Start new message
      const role = roleMatch[1].toLowerCase();
      currentRole = role === 'chatgpt' ? 'assistant' : (role as 'user' | 'assistant');
      currentContent = [];
    } else if (currentRole) {
      currentContent.push(line);
    }
  }

  // Don't forget the last message
  if (currentRole && currentContent.length > 0) {
    messages.push({
      role: currentRole,
      content: currentContent.join('\n').trim()
    });
  }

  if (messages.length === 0) {
    warnings.push('No messages found in ChatGPT markdown format');
  }

  return messages;
}

/**
 * Parse generic markdown conversation
 */
function parseGenericMarkdown(
  text: string,
  warnings: string[]
): ParsedMessage[] {
  const messages: ParsedMessage[] = [];
  const lines = text.split('\n');

  let currentRole: 'user' | 'assistant' | null = null;
  let currentContent: string[] = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track code blocks
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
    }

    // Skip role detection inside code blocks
    if (inCodeBlock) {
      currentContent.push(line);
      continue;
    }

    // Check for various role marker formats
    const roleMatch =
      line.match(/^#{1,3}\s+(User|Assistant|Human|AI|System|Model)\b/i) ||
      line.match(/^\s*[-*]\s+(User|Assistant|Human|AI|System|Model):\s*$/i) ||
      line.match(/^(User|Assistant|Human|AI|System|Model):\s*$/i);

    if (roleMatch) {
      // Save previous message if exists
      if (currentRole && currentContent.length > 0) {
        messages.push({
          role: currentRole,
          content: currentContent.join('\n').trim()
        });
      }

      // Start new message
      const role = roleMatch[1].toLowerCase();
      if (role === 'human' || role === 'user') {
        currentRole = 'user';
      } else if (role === 'ai' || role === 'assistant' || role === 'model' || role === 'system') {
        currentRole = 'assistant';
      } else {
        currentRole = 'user';
      }
      currentContent = [];
    } else if (currentRole) {
      currentContent.push(line);
    }
  }

  // Don't forget the last message
  if (currentRole && currentContent.length > 0) {
    messages.push({
      role: currentRole,
      content: currentContent.join('\n').trim()
    });
  }

  if (messages.length === 0) {
    warnings.push('No messages found in generic markdown format');
  }

  return messages;
}

// ============================================================================
// CLI Integration
// ============================================================================

/**
 * Import from text (CLI wrapper)
 */
export async function cliImportText(options: {
  text: string;
  output?: string;
  title?: string;
  language?: string;
}): Promise<void> {
  const result = await importFromText(options.text, {
    title: options.title,
    language: options.language
  });

  console.log(`Detected format: ${result.format}`);
  console.log(`Messages imported: ${result.messageCount}`);

  if (result.warnings.length > 0) {
    console.log('\nWarnings:');
    for (const warning of result.warnings) {
      console.log(`  ⚠ ${warning}`);
    }
  }

  const manifest = result.agentFile.getManifest();
  const filename =
    options.output ||
    `${manifest.metadata?.title || 'manual-import'}.agent`;

  await result.agentFile.save(filename);
  console.log(`\n✓ Saved: ${filename}`);
}

/**
 * Import from clipboard (CLI wrapper)
 */
export async function cliImportClipboard(options: {
  output?: string;
  title?: string;
  language?: string;
}): Promise<void> {
  try {
    const text = await clipboardy.read();
    await cliImportText({
      text,
      output: options.output,
      title: options.title,
      language: options.language
    });
  } catch (error) {
    console.error(
      `Failed to read clipboard: ${(error as Error).message}\n\n` +
        `Make sure your terminal has clipboard access permissions.\n` +
        `On Linux, you may need to install xclip or xsel.`
    );
    process.exit(1);
  }
}

/**
 * Show current clipboard content (for debugging)
 */
export async function cliShowClipboard(): Promise<void> {
  try {
    const text = await clipboardy.read();
    console.log('Clipboard content:');
    console.log('---');
    console.log(text.substring(0, 1000));
    if (text.length > 1000) {
      console.log('\n... (truncated)');
    }
    console.log('---');
    console.log(`\nTotal length: ${text.length} characters`);
    console.log(`Detected format: ${detectFormat(text)}`);
  } catch (error) {
    console.error(`Failed to read clipboard: ${(error as Error).message}`);
    process.exit(1);
  }
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Extract content from Claude message parts
 */
function extractContentFromParts(parts: unknown[]): string {
  if (!Array.isArray(parts)) {
    return '';
  }

  const textParts: string[] = [];

  for (const part of parts) {
    if (typeof part === 'string') {
      textParts.push(part);
    } else if (part && typeof part === 'object') {
      const obj = part as Record<string, unknown>;
      if (typeof obj.content === 'string') {
        textParts.push(obj.content);
      } else if (typeof obj.text === 'string') {
        textParts.push(obj.text);
      }
    }
  }

  return textParts.join('\n\n');
}

/**
 * Generate a title from messages
 */
function generateTitle(messages: ParsedMessage[]): string {
  if (messages.length === 0) {
    return 'Untitled Conversation';
  }

  const firstUserMessage =
    messages.find(m => m.role === 'user') || messages[0];
  const content = firstUserMessage.content.trim();

  // Use first line or first ~50 chars
  const firstLine = content.split('\n')[0].trim();
  if (firstLine.length > 50) {
    return firstLine.substring(0, 47) + '...';
  }

  return firstLine || 'Untitled Conversation';
}

/**
 * Detect programming language from messages
 */
function detectLanguage(messages: ParsedMessage[]): string {
  const allContent = messages.map(m => m.content).join('\n');

  // Count code block occurrences by language
  const codeBlocks = allContent.matchAll(/```(\w*)/g);
  const languageCounts: Record<string, number> = {};

  for (const match of codeBlocks) {
    const lang = (match[1] || 'text').toLowerCase();
    languageCounts[lang] = (languageCounts[lang] || 0) + 1;
  }

  // Find most common
  let maxCount = 0;
  let mostCommon = 'text';

  for (const [lang, count] of Object.entries(languageCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = lang;
    }
  }

  return mostCommon;
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Validate clipboard access
 */
export async function validateClipboardAccess(): Promise<boolean> {
  try {
    await clipboardy.read();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get supported formats (for documentation)
 */
export function getSupportedFormats(): Array<{
  format: DetectedFormat;
  description: string;
  example: string;
}> {
  return [
    {
      format: 'claude-json',
      description: 'Claude Code JSON export format',
      example: '{"messages": [{"role": "user", "content": "..."}]}'
    },
    {
      format: 'chatgpt-markdown',
      description: 'ChatGPT-style markdown with **User:** and **Assistant:** markers',
      example: '**User:** Hello\n\n**Assistant:** Hi there!'
    },
    {
      format: 'generic-markdown',
      description: 'Generic markdown conversation with headers or list markers',
      example: '### User\nHello\n\n### Assistant\nHi there!'
    }
  ];
}
