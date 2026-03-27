/**
 * Claude Code importer for .agent files
 *
 * Imports conversations from Claude Code local storage or Anthropic API
 */

import { AgentFile, Message } from '@state/format';
import { readdir, readFile, stat, access } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

// ============================================================================
// Types
// ============================================================================

export interface ClaudeConversation {
  id: string;
  title?: string;
  created_at: string;
  updated_at: string;
  messages: ClaudeMessage[];
  context?: ClaudeContext;
}

export interface ClaudeMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  tools_used?: ClaudeToolUse[];
  citations?: string[];
}

export interface ClaudeToolUse {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
}

export interface ClaudeContext {
  system_prompt?: string;
  temperature?: number;
  max_tokens?: number;
  project_files?: string[];
}

export interface ImportOptions {
  includeTerminalHistory?: boolean;
  includeArtifacts?: boolean;
  maxConversations?: number;
}

export interface APIImportOptions {
  apiKey: string;
  conversationIds?: string[];
  maxMessages?: number;
}

// ============================================================================
// Local Storage Importer
// ============================================================================

/**
 * Get Claude Code local storage path
 */
function getClaudePath(): string {
  const platform = process.platform;

  switch (platform) {
    case 'win32':
      return join(process.env.APPDATA || '', 'claude');
    case 'darwin':
      return join(homedir(), '.claude');
    case 'linux':
      return join(homedir(), '.claude');
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Import conversations from Claude Code local storage
 */
export async function importFromLocal(
  options: ImportOptions = {}
): Promise<AgentFile[]> {
  const claudePath = getClaudePath();
  const conversationsPath = join(claudePath, 'conversations');

  // Check if conversations directory exists
  try {
    await access(conversationsPath);
  } catch {
    throw new Error(`Claude conversations directory not found: ${conversationsPath}`);
  }

  const agentFiles: AgentFile[] = [];
  const conversationDirs = await readdir(conversationsPath);

  // Limit conversations if specified
  const maxConv = options.maxConversations || conversationDirs.length;
  const limitedDirs = conversationDirs.slice(0, maxConv);

  for (const convDir of limitedDirs) {
    try {
      const convPath = join(conversationsPath, convDir);
      const statResult = await stat(convPath);

      if (!statResult.isDirectory()) {
        continue;
      }

      // Read conversation.json
      const jsonPath = join(convPath, 'conversation.json');
      const content = await readFile(jsonPath, 'utf-8');
      const claudeConv: ClaudeConversation = JSON.parse(content);

      // Import to .agent file
      const agentFile = await importClaudeConversation(claudeConv, options);
      agentFiles.push(agentFile);
    } catch (error) {
      console.warn(`Failed to import conversation ${convDir}:`, (error as Error).message);
    }
  }

  return agentFiles;
}

/**
 * Import a single Claude conversation to .agent format
 */
async function importClaudeConversation(
  claudeConv: ClaudeConversation,
  options: ImportOptions = {}
): Promise<AgentFile> {
  // Create .agent file
  const agentFile = await AgentFile.create({
    metadata: {
      title: claudeConv.title,
      language: 'TypeScript', // Default, can be enhanced
      project_name: claudeConv.id
    },
    sourceTool: {
      name: 'claude',
      version: '1.0.0',
      model: claudeConv.messages[0]?.model
    }
  });

  // Convert messages
  const messages: Message[] = claudeConv.messages.map(msg => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
    model: msg.model,
    tools_used: msg.tools_used?.map(tool => ({
      name: tool.name,
      input: tool.input as Record<string, unknown>,
      output: tool.output as Record<string, unknown>,
      error: tool.error
    })),
    citations: msg.citations
  }));

  await agentFile.addConversation(messages);

  // Add context if available
  if (claudeConv.context) {
    // Could add context as a separate component
    // For now, it's included in message metadata
  }

  // TODO: Import terminal history if requested
  if (options.includeTerminalHistory) {
    // Would need to read terminal sessions from Claude storage
    // This would be in a separate file
  }

  // TODO: Import artifacts if requested
  if (options.includeArtifacts) {
    // Would need to read artifact files from Claude storage
  }

  return agentFile;
}

// ============================================================================
// API Importer
// ============================================================================

/**
 * Import conversation from Anthropic API
 */
export async function importFromAPI(
  options: APIImportOptions
): Promise<AgentFile> {
  const { apiKey, conversationIds, maxMessages } = options;

  // TODO: Implement actual Anthropic API calls
  // For now, create a placeholder

  if (!conversationIds || conversationIds.length === 0) {
    throw new Error('At least one conversation ID is required');
  }

  // Placeholder: Create mock .agent file
  const agentFile = await AgentFile.create({
    metadata: {
      title: `Claude Conversation (${conversationIds[0]})`,
      language: 'TypeScript'
    },
    sourceTool: {
      name: 'claude',
      version: '1.0.0'
    }
  });

  // TODO: Implement actual API calls
  // This would use the Anthropic Messages API
  // Need to:
  // 1. Authenticate with API key
  // 2. Fetch conversation by ID
  // 3. Fetch messages
  // 4. Handle pagination if maxMessages specified
  // 5. Extract artifacts, terminal sessions, etc.

  return agentFile;
}

/**
 * List available conversations from local storage
 */
export async function listLocalConversations(): Promise<
  Array<{ id: string; title?: string; created_at: string }>
> {
  const claudePath = getClaudePath();
  const conversationsPath = join(claudePath, 'conversations');

  try {
    await access(conversationsPath);
  } catch {
    return [];
  }

  const conversationDirs = await readdir(conversationsPath);
  const conversations: Array<{
    id: string;
    title?: string;
    created_at: string;
  }> = [];

  for (const convDir of conversationDirs) {
    try {
      const jsonPath = join(conversationsPath, convDir, 'conversation.json');
      const content = await readFile(jsonPath, 'utf-8');
      const conv: ClaudeConversation = JSON.parse(content);

      conversations.push({
        id: conv.id,
        title: conv.title,
        created_at: conv.created_at
      });
    } catch {
      // Skip invalid conversations
    }
  }

  return conversations.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Search local conversations by title
 */
export async function searchLocalConversations(
  query: string
): Promise<Array<{ id: string; title?: string; created_at: string }>> {
  const conversations = await listLocalConversations();
  const lowerQuery = query.toLowerCase();

  return conversations.filter(conv =>
    conv.title?.toLowerCase().includes(lowerQuery) || conv.id.includes(lowerQuery)
  );
}

/**
 * Get a specific conversation by ID
 */
export async function getLocalConversation(
  conversationId: string
): Promise<ClaudeConversation | null> {
  const claudePath = getClaudePath();
  const conversationsPath = join(claudePath, 'conversations');
  const convPath = join(conversationsPath, conversationId);

  try {
    await access(convPath);
    const jsonPath = join(convPath, 'conversation.json');
    const content = await readFile(jsonPath, 'utf-8');
    return JSON.parse(content) as ClaudeConversation;
  } catch {
    return null;
  }
}

// ============================================================================
// CLI Integration
// ============================================================================

/**
 * Import from local Claude Code (CLI wrapper)
 */
export async function cliImportLocal(options: {
  output?: string;
  includeTerminal?: boolean;
  includeArtifacts?: boolean;
} = {}): Promise<void> {
  const agentFiles = await importFromLocal({
    includeTerminalHistory: options.includeTerminal,
    includeArtifacts: options.includeArtifacts
  });

  if (agentFiles.length === 0) {
    console.log('No conversations found in Claude Code local storage.');
    return;
  }

  console.log(`Found ${agentFiles.length} conversation(s)`);

  // Save each .agent file
  for (let i = 0; i < agentFiles.length; i++) {
    const agentFile = agentFiles[i];
    const manifest = agentFile.getManifest();
    const filename = options.output || `${manifest.metadata?.title || manifest.metadata?.project_name || `claude-${i}`}.agent`;

    await agentFile.save(filename);
    console.log(`  ✓ Saved: ${filename}`);
  }
}

/**
 * Import from Claude API (CLI wrapper)
 */
export async function cliImportAPI(options: {
  apiKey: string;
  conversationId: string;
  output?: string;
} = {}): Promise<void> {
  const agentFile = await importFromAPI({
    apiKey: options.apiKey,
    conversationIds: [options.conversationId]
  });

  const filename = options.output || `claude-${options.conversationId}.agent`;
  await agentFile.save(filename);
  console.log(`✓ Saved: ${filename}`);
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Validate Claude API key
 */
export function validateAPIKey(apiKey: string): boolean {
  // Claude API keys start with 'sk-ant-'
  return apiKey.startsWith('sk-ant-') && apiKey.length > 30;
}

/**
 * Get Claude Code version
 */
export async function getClaudeVersion(): Promise<string | null> {
  const claudePath = getClaudePath();
  const versionPath = join(claudePath, 'version.json');

  try {
    await access(versionPath);
    const content = await readFile(versionPath, 'utf-8');
    const versionInfo = JSON.parse(content);
    return versionInfo.version || null;
  } catch {
    return null;
  }
}

/**
 * Check if Claude Code is installed
 */
export async function isClaudeInstalled(): Promise<boolean> {
  const claudePath = getClaudePath();

  try {
    await access(claudePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get default Claude Code paths for documentation
 */
export function getClaudePaths(): Record<string, string> {
  const claudePath = getClaudePath();

  return {
    conversations: join(claudePath, 'conversations'),
    config: join(claudePath, 'config.json'),
    logs: join(claudePath, 'logs')
  };
}
