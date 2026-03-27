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

// Encryption
export {
  encrypt,
  decrypt,
  generatePassword,
  validateEncryptedData,
  estimateEncryptionTime
} from './encryption';
export type { EncryptionOptions, EncryptedData } from './encryption';

// Signatures
export {
  generateKeyPair,
  sign,
  verify,
  verifySignatureObject,
  exportKeyPair,
  importKeyPair,
  validateKeyPair,
  validateSignatureObject,
  getKeyFingerprint,
  generateKeyId
} from './signature';
export type { KeyPair, Signature, SignOptions } from './signature';

// Semantic Map
export {
  scanProject,
  getLanguageFromExtension,
  shouldSkipDirectory,
  addSkipDirectory,
  removeSkipDirectory
} from './semantic-map';
export type { ScanOptions, SemanticMap as SemanticMapExport } from './semantic-map';

// Plan Parser
export {
  parsePlanFromConversation,
  parseStructuredPlan,
  parseMarkdownPlan,
  sortTasks,
  filterTasksByStatus,
  getNextTasks,
  calculateCompletion,
  estimateTotalEffort
} from './plan-parser';
export type { ParsedPlan, Task as ParsedTask } from './plan-parser';

// Re-export for convenience
export { default as AgentFileDefault } from './AgentFile';
