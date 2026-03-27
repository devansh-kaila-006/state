/**
 * ChatGPT importer for .agent files
 *
 * Imports conversations from official ChatGPT data exports
 */

import { AgentFile, Message } from '@state/format';
import JSZip from 'jszip';
import { readFile } from 'fs/promises';

// ============================================================================
// Types
// ============================================================================

export interface ChatGPTExport {
  conversations: ChatGPTConversation[];
}

export interface ChatGPTConversation {
  title: string;
  mapping: Record<string, ChatGPTNode>;
  current_node: string;
  conversation_id: string;
  timestamp: string;
}

export interface ChatGPTNode {
  id: string;
  message: ChatGPTMessage | null;
  end_turn: boolean;
  weight: number;
  children?: string[];
  parent?: string;
}

export interface ChatGPTMessage {
  id: string;
  content: ChatGPTContentPart[];
  author: ChatGPTAuthor;
  create_time: number;
  update_time: number;
  metadata?: ChatGPTMetadata;
}

export interface ChatGPTContentPart {
  content_type: string;
  parts: string[];
}

export interface ChatGPTAuthor {
  role: 'user' | 'assistant' | 'system';
  name?: string;
  meta: {
    content_type: string;
  };
}

export interface ChatGPTMetadata {
  model_slug?: string;
  plugins?: any[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ImportOptions {
  includeCodeInterpreter?: boolean;
  includeDALLEImages?: boolean;
  maxConversations?: number;
}

// ============================================================================
// Import Functions
// ============================================================================

/**
 * Import from ChatGPT export ZIP file
 */
export async function importFromExport(
  exportZipPath: string,
  options: ImportOptions = {}
): Promise<AgentFile[]> {
  // Read and parse ZIP file
  const buffer = await readFile(exportZipPath);
  const zip = await JSZip.loadAsync(buffer);

  // Find and parse conversations.json
  const jsonFile = zip.file('conversations.json');
  if (!jsonFile) {
    throw new Error('Invalid ChatGPT export: conversations.json not found');
  }

  const content = await jsonFile.async('string');
  const chatgptExport: ChatGPTExport = JSON.parse(content);

  // Limit conversations if specified
  const maxConv = options.maxConversations || chatgptExport.conversations.length;
  const limitedConversations = chatgptExport.conversations.slice(0, maxConv);

  const agentFiles: AgentFile[] = [];

  for (const chatgptConv of limitedConversations) {
    try {
      const agentFile = await importChatGPTConversation(chatgptConv, options);
      agentFiles.push(agentFile);
    } catch (error) {
      console.warn(`Failed to import conversation ${chatgptConv.conversation_id}:`, (error as Error).message);
    }
  }

  return agentFiles;
}

/**
 * Import a single ChatGPT conversation to .agent format
 */
async function importChatGPTConversation(
  chatgptConv: ChatGPTConversation,
  options: ImportOptions = {}
): Promise<AgentFile> {
  // Extract messages from the conversation tree
  const messages = extractMessagesFromMapping(chatgptConv.mapping);

  // Create .agent file
  const agentFile = await AgentFile.create({
    metadata: {
      title: chatgptConv.title,
      language: detectLanguage(messages)
    },
    sourceTool: {
      name: 'chatgpt',
      version: '1.0.0',
      model: messages.find(m => m.model)?.model || 'gpt-3.5'
    }
  });

  // Convert messages
  const convertedMessages: Message[] = messages.map(msg => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: new Date(msg.timestamp).toISOString(),
    model: msg.model,
    tools_used: msg.tools_used
  }));

  await agentFile.addConversation(convertedMessages);

  // TODO: Handle Code Interpreter outputs if requested
  if (options.includeCodeInterpreter) {
    // Would need to parse and include code execution results
  }

  // TODO: Handle DALL-E images if requested
  if (options.includeDALLEImages) {
    // Would need to download and embed images as assets
  }

  return agentFile;
}

/**
 * Extract messages from ChatGPT's tree structure
 */
function extractMessagesFromMapping(
  mapping: Record<string, ChatGPTNode>
): ExtractedMessage[] {
  const messages: ExtractedMessage[] = [];
  const visited = new Set<string>();

  // Start from current node and traverse backwards
  let currentNodeId = mapping[Object.keys(mapping)[0]]?.id;

  while (currentNodeId && !visited.has(currentNodeId)) {
    visited.add(currentNodeId);
    const node = mapping[currentNodeId];

    if (!node || !node.message) {
      break;
    }

    messages.push(extractMessageFromNode(node));
    currentNodeId = node.parent || '';
  }

  // Reverse to get chronological order
  return messages.reverse();
}

/**
 * Extract message from ChatGPT node
 */
function extractMessageFromNode(node: ChatGPTNode): ExtractedMessage {
  const msg = node.message!;
  const author = msg.author;

  // Determine role
  let role: 'user' | 'assistant';
  if (author.role === 'assistant') {
    role = 'assistant';
  } else {
    role = 'user';
  }

  // Extract content from content parts
  const contentParts = msg.content;
  let content = '';

  // Join text parts
  const textParts = contentParts
    .filter(part => part.content_type === 'text' || part.content_type === 'code')
    .map(part => part.parts.join('\n'))
    .join('\n\n');

  // Add code block formatting
  for (const part of contentParts) {
    if (part.content_type === 'code') {
      const language = detectCodeLanguage(part.parts);
      content += `\n\`\`\`${language}\n${part.parts.join('')}\n\`\`\``;
    } else if (part.content_type === 'image') {
      // Image content
      const urls = part.parts.filter(p => p.startsWith('http'));
      if (urls.length > 0) {
        content += `\n[Images: ${urls.join(', ')}]`;
      }
    }
  }

  // Extract model info
  let model: string | undefined;
  if (msg.metadata?.model_slug) {
    model = msg.metadata.model_slug;
  } else if (author.name === 'ChatGPT') {
    model = 'gpt-3.5';
  }

  // Extract tools used (Code Interpreter, DALL-E, etc.)
  const tools_used = extractToolsUsed(msg);

  return {
    id: msg.id,
    role,
    content: textParts.join('') || content,
    timestamp: new Date(msg.create_time * 1000).toISOString(),
    model,
    tools_used: tools_used.length > 0 ? tools_used : undefined,
    citations: [] // ChatGPT doesn't have citations in the same way
  };
}

/**
 * Extract tools used from ChatGPT message metadata
 */
function extractToolsUsed(msg: ChatGPTMessage): Array<{
  name: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
}> {
  const tools: Array<{
    name: string;
    input: Record<string, unknown>;
    output?: Record<string, unknown>;
  }> = [];

  // Check for Code Interpreter usage
  if (msg.metadata?.plugins) {
    for (const plugin of msg.metadata.plugins) {
      if (plugin.id === 'code_interpreter') {
        tools.push({
          name: 'code_interpreter',
          input: plugin.last_used_inputs || {}
        });
      }
    }
  }

  // Check for DALL-E image generation
  if (msg.metadata?.plugins) {
    for (const plugin of msg.metadata.plugins) {
      if (plugin.id.startsWith('dalle')) {
        tools.push({
          name: 'dalle',
          input: {
            prompt: plugin.last_used_prompt || ''
          }
        });
      }
    }
  }

  // Check for browsing
  if (msg.metadata?.plugins) {
    for (const plugin of msg.metadata.plugins) {
      if (plugin.id === 'browser') {
        tools.push({
          name: 'browser',
          input: {
            query: plugin.last_used_query || ''
          },
          output: {
            results: plugin.displayed_results || []
          }
        });
      }
    }
  }

  return tools;
}

/**
 * Detect programming language from code
 */
function detectCodeLanguage(parts: string[]): string {
  // Simple heuristic based on common patterns
  const code = parts.join('\n');

  if (code.includes('def ') || code.includes('import ') && code.includes('.py')) {
    return 'python';
  }
  if (code.includes('function ') && code.includes('{')) {
    if (code.includes('interface ') || code.includes('class ')) {
      return 'typescript';
    }
    return 'javascript';
  }
  if (code.includes('fn ') && code.includes('pub ') && code.includes('impl')) {
    return 'rust';
  }
  if (code.includes('func ') && code.includes('{') && code.includes('package')) {
    return 'go';
  }
  if (code.includes('public class') && code.includes('extends')) {
    return 'java';
  }

  return 'text';
}

/**
 * Detect primary language from messages
 */
function detectLanguage(messages: ExtractedMessage[]): string {
  const languageCounts: Record<string, number> = {};

  for (const msg of messages) {
    if (msg.model) {
      const lang = detectLanguageFromModel(msg.model);
      languageCounts[lang] = (languageCounts[lang] || 0) + 1;
    }
  }

  // Return most common language
  const sorted = Object.entries(languageCounts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] || 'text';
}

/**
 * Detect language from model name
 */
function detectLanguageFromModel(model: string): string {
  const modelLower = model.toLowerCase();

  if (modelLower.includes('python')) return 'python';
  if (modelLower.includes('javascript') || modelLower.includes('typescript')) return 'typescript';
  if (modelLower.includes('rust')) return 'rust';
  if (modelLower.includes('go')) return 'go';
  if (modelLower.includes('java')) return 'java';
  if (modelLower.includes('c++') || modelLower.includes('cpp')) return 'cpp';
  if (modelLower.includes('c#') || modelLower.includes('csharp')) return 'csharp';

  return 'text';
}

// ============================================================================
// Helper Types
// ============================================================================

interface ExtractedMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  tools_used?: Array<{
    name: string;
    input: Record<string, unknown>;
    output?: Record<string, unknown>;
  }>;
  citations?: string[];
}

// ============================================================================
// CLI Integration
// ============================================================================

/**
 * Import from ChatGPT export (CLI wrapper)
 */
export async function cliImport(options: {
  exportPath: string;
  output?: string;
  includeCodeInterpreter?: boolean;
  includeDALLEImages?: boolean;
}): Promise<void> {
  const agentFiles = await importFromExport(options.exportPath, {
    includeCodeInterpreter: options.includeCodeInterpreter,
    includeDALLEImages: options.includeDALLEImages
  });

  if (agentFiles.length === 0) {
    console.log('No conversations found in ChatGPT export.');
    return;
  }

  console.log(`Found ${agentFiles.length} conversation(s)`);

  // Save each .agent file
  for (let i = 0; i < agentFiles.length; i++) {
    const agentFile = agentFiles[i];
    const manifest = agentFile.getManifest();
    const filename = options.output || `${manifest.metadata?.title || `chatgpt-${i}`}.agent`;

    await agentFile.save(filename);
    console.log(`  ✓ Saved: ${filename}`);
  }
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Validate ChatGPT export file
 */
export async function validateExportFile(exportPath: string): Promise<boolean> {
  try {
    const buffer = await readFile(exportPath);
    const zip = await JSZip.loadAsync(buffer);

    // Check for conversations.json
    const jsonFile = zip.file('conversations.json');
    if (!jsonFile) {
      return false;
    }

    // Try to parse
    const content = await jsonFile.async('string');
    const data = JSON.parse(content);

    return 'conversations' in data && Array.isArray(data.conversations);
  } catch {
    return false;
  }
}

/**
 * Get conversation count from export
 */
export async function getConversationCount(exportPath: string): Promise<number> {
  const isValid = await validateExportFile(exportPath);

  if (!isValid) {
    throw new Error('Invalid ChatGPT export file');
  }

  const buffer = await readFile(exportPath);
  const zip = await JSZip.loadAsync(buffer);
  const jsonFile = zip.file('conversations.json');
  const content = await jsonFile.async('string');
  const data = JSON.parse(content) as ChatGPTExport;

  return data.conversations.length;
}

/**
 * List conversations in export
 */
export async function listConversations(exportPath: string): Promise<
  Array<{ id: string; title: string; timestamp: string }>
> {
  const buffer = await readFile(exportPath);
  const zip = await JSZip.loadAsync(buffer);
  const jsonFile = zip.file('conversations.json');
  const content = await jsonFile.async('string');
  const data = JSON.parse(content) as ChatGPTExport;

  return data.conversations.map(conv => ({
    id: conv.conversation_id,
    title: conv.title,
    timestamp: conv.timestamp
  }));
}
