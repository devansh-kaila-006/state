/**
 * @state/format - Core .agent file format library
 *
 * Provides functionality for creating, reading, and validating .agent files.
 */

export { AgentFile } from './AgentFile';
export type {
  Message,
  ContentBlock,
  ToolUse,
  SemanticMap,
  FileInfo,
  TerminalSession,
  TerminalCommand,
  FuturePlan,
  Task,
  Manifest,
  ComponentInfo,
  ValidationResult,
  CreateOptions
} from './AgentFile';

// Re-export for convenience
export { default as AgentFileDefault } from './AgentFile';
