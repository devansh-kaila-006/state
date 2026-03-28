/**
 * Example Importer Plugin
 *
 * This is a reference implementation of an importer plugin for the State (.agent) format.
 * It demonstrates how to create a custom importer that can convert conversation data
 * into the .agent file format.
 *
 * This example imports from a simple JSON format with the following structure:
 * {
 *   "title": "Conversation Title",
 *   "messages": [
 *     { "role": "user", "content": "Hello" },
 *     { "role": "assistant", "content": "Hi there!" }
 *   ]
 * }
 */

import type {
  ImporterPlugin,
  ImportOptions,
  ValidationResult,
  InputMetadata,
} from '@state/plugin-api'

// Note: In a real plugin, you would import from the published package
// import { AgentFile } from '@state/format'

// For this example, we define the minimal interface
interface AgentFile {
  create(config: any): Promise<AgentFile>
  addConversation(messages: any[]): Promise<void>
  addSemanticMap(semanticMap: any): Promise<void>
  saveToBuffer(options?: any): Promise<Buffer>
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

/**
 * Example input format
 */
interface ExampleInput {
  title?: string
  description?: string
  language?: string
  messages: Array<{
    role: string
    content: string
    timestamp?: string
  }>
  semanticMap?: any
  terminal?: any
  plan?: any
}

/**
 * Example Importer Plugin
 *
 * Demonstrates a complete importer implementation with:
 * - Input detection
 * - Data transformation
 * - Validation
 * - Metadata extraction
 */
export const exampleImporterPlugin: ImporterPlugin = {
  name: 'example-importer',
  version: '1.0.0',
  description: 'Example importer plugin for State (.agent)',

  /**
   * Detect if this plugin can handle the input
   *
   * @param input - The input data to check
   * @returns Promise resolving to true if this plugin can handle the input
   */
  async detect(input: unknown): Promise<boolean> {
    // Check if input is an object
    if (typeof input !== 'object' || input === null) {
      return false
    }

    // Check for required 'messages' field
    const data = input as Record<string, unknown>
    if (!('messages' in data) || !Array.isArray(data.messages)) {
      return false
    }

    // Check if messages array is not empty
    if (data.messages.length === 0) {
      return false
    }

    // Check if first message has required fields
    const firstMessage = data.messages[0] as Record<string, unknown>
    if (
      typeof firstMessage !== 'object' ||
      firstMessage === null ||
      !('role' in firstMessage) ||
      !('content' in firstMessage)
    ) {
      return false
    }

    // Check if role is valid
    const validRoles = ['user', 'assistant', 'system']
    if (!validRoles.includes(firstMessage.role as string)) {
      return false
    }

    return true
  },

  /**
   * Import the input data and convert to .agent format
   *
   * @param input - The input data to import
   * @param options - Import options
   * @returns Promise resolving to an AgentFile instance
   */
  async import(
    input: ExampleInput,
    options: ImportOptions = {}
  ): Promise<AgentFile> {
    // Dynamic import to avoid hard dependency
    const { AgentFile } = await import('@state/format')

    // Validate input first
    const validation = await this.validate(input)
    if (!validation.valid) {
      throw new Error(
        `Invalid input: ${validation.errors.join(', ')}`
      )
    }

    // Create AgentFile with metadata
    const agentFile = await AgentFile.create({
      metadata: {
        title:
          options.title ||
          input.title ||
          'Imported Conversation',
        description:
          options.description || input.description,
        language:
          options.language || input.language || 'TypeScript',
      },
      sourceTool: {
        name: this.name,
        version: this.version,
      },
    })

    // Transform and add messages
    const messages = this.transformMessages(input.messages)
    await agentFile.addConversation(messages)

    // Add optional sections if present and requested
    if (input.semanticMap && options.includeSemanticMap) {
      await agentFile.addSemanticMap(input.semanticMap)
    }

    if (input.terminal && options.includeTerminal) {
      await agentFile.addTerminalSession(input.terminal)
    }

    if (input.plan && options.includePlan) {
      await agentFile.addPlan(input.plan)
    }

    return agentFile
  },

  /**
   * Validate the input data
   *
   * @param input - The input data to validate
   * @returns Promise resolving to validation result
   */
  async validate(input: unknown): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    if (typeof input !== 'object' || input === null) {
      errors.push('Input must be an object')
      return { valid: false, errors, warnings }
    }

    const data = input as Record<string, unknown>

    // Check messages
    if (!('messages' in data) || !Array.isArray(data.messages)) {
      errors.push('Input must have a messages array')
    } else {
      if (data.messages.length === 0) {
        warnings.push('Messages array is empty')
      }

      // Validate each message
      const validRoles = ['user', 'assistant', 'system']
      data.messages.forEach((msg: unknown, index: number) => {
        if (typeof msg !== 'object' || msg === null) {
          errors.push(`Message ${index} is not an object`)
          return
        }

        const message = msg as Record<string, unknown>

        if (!('role' in message)) {
          errors.push(`Message ${index} missing role`)
        } else if (!validRoles.includes(message.role as string)) {
          errors.push(`Message ${index} has invalid role: ${message.role}`)
        }

        if (!('content' in message)) {
          errors.push(`Message ${index} missing content`)
        } else if (typeof message.content !== 'string') {
          errors.push(`Message ${index} content must be a string`)
        }
      })
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  },

  /**
   * Get metadata about the input
   *
   * @param input - The input data
   * @returns Promise resolving to input metadata
   */
  async getMetadata(input: ExampleInput): Promise<InputMetadata> {
    return {
      source: 'example-format',
      format: 'json',
      version: '1.0',
      messageCount: input.messages?.length || 0,
      hasSemanticMap: !!input.semanticMap,
      hasTerminal: !!input.terminal,
      hasPlan: !!input.plan,
    }
  },

  /**
   * Transform messages from input format to .agent format
   *
   * @param messages - Input messages
   * @returns Transformed messages
   */
  transformMessages(
    messages: Array<{ role: string; content: string; timestamp?: string }>
  ): Message[] {
    return messages.map((msg, index) => ({
      id: `msg-${index}`,
      role: msg.role as Message['role'],
      content: msg.content,
      timestamp: msg.timestamp || new Date().toISOString(),
    }))
  },
}

/**
 * Export the plugin for registration
 */
export default exampleImporterPlugin

/**
 * Export plugin metadata for discovery
 */
export const pluginMetadata = {
  name: exampleImporterPlugin.name,
  version: exampleImporterPlugin.version,
  description: exampleImporterPlugin.description,
  type: 'importer' as const,
  supportedFormats: ['json'],
  homepage: 'https://github.com/state-org/plugins/tree/main/packages/example-importer',
}
