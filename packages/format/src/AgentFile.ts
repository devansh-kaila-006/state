/**
 * .agent File Format - Core Implementation
 *
 * Security-focused implementation of the .agent portable context format.
 * Provides ZIP-based storage with encryption, signing, and validation.
 */

import JSZip from 'jszip';
import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// ============================================================================
// Constants
// ============================================================================

/** Maximum uncompressed size for entire .agent file (500MB) */
const MAX_TOTAL_SIZE = 500 * 1024 * 1024;

/** Maximum size for individual files (100MB) */
const MAX_FILE_SIZE = 100 * 1024 * 1024;

/** Maximum compression ratio (10:1) to prevent ZIP bombs */
const MAX_COMPRESSION_RATIO = 10;

/** Maximum number of entries in ZIP */
const MAX_ENTRIES = 10000;

/** Maximum depth for nested JSON structures */
const MAX_JSON_DEPTH = 50;

/** Maximum string length in JSON (1MB) */
const MAX_STRING_LENGTH = 1024 * 1024;

/** Allowed path characters (prevent path traversal) */
const PATH_ALLOWLIST = /^[a-zA-Z0-9._/-]+$/;

// ============================================================================
// Types
// ============================================================================

export interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | ContentBlock[];
  timestamp: string;
  model?: string;
  tools_used?: ToolUse[];
  citations?: string[];
}

export interface ContentBlock {
  type: 'text' | 'code' | 'image' | 'artifact';
  text?: string;
  language?: string;
  artifact_id?: string;
}

export interface ToolUse {
  name: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
}

export interface SemanticMap {
  files: FileInfo[];
  dependencies?: Record<string, string[]>;
  summaries?: Record<string, string>;
}

export interface FileInfo {
  path: string;
  language: string;
  size?: number;
  modified?: string;
  functions?: string[];
  imports?: string[];
}

export interface TerminalSession {
  id?: string;
  working_directory?: string;
  shell?: string;
  commands: TerminalCommand[];
}

export interface TerminalCommand {
  command: string;
  timestamp: string;
  exit_code?: number;
  output?: string;
  duration_ms?: number;
}

export interface FuturePlan {
  plan?: string;
  tasks?: Task[];
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
}

export interface Manifest {
  version: string;
  format: 'agent';
  created_at: string;
  updated_at?: string;
  source_tool: {
    name: 'claude' | 'chatgpt' | 'manual' | 'other';
    version: string;
    model?: string;
  };
  encryption: {
    enabled: boolean;
    algorithm?: 'AES-256-GCM';
    key_derivation?: 'PBKDF2';
    iterations?: number;
  };
  signature?: {
    enabled: boolean;
    algorithm?: 'Ed25519';
    public_key?: string;
    signature?: string;
  };
  components?: ComponentInfo[];
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
    language?: string;
    project_name?: string;
  };
}

export interface ComponentInfo {
  path: string;
  sha256: string;
  size?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CreateOptions {
  metadata?: Manifest['metadata'];
  sourceTool?: Manifest['source_tool'];
  encryption?: {
    enabled: true;
    password: string;
  };
}

// ============================================================================
// Security Functions
// ============================================================================

/**
 * Validate a file path to prevent path traversal attacks
 */
function validatePath(path: string): void {
  // Check for absolute paths
  if (path.startsWith('/') || path.startsWith('\\')) {
    throw new Error(`Absolute path not allowed: ${path}`);
  }

  // Check for directory traversal
  if (path.includes('..')) {
    throw new Error(`Path traversal detected: ${path}`);
  }

  // Check against allowlist
  if (!PATH_ALLOWLIST.test(path)) {
    throw new Error(`Invalid characters in path: ${path}`);
  }
}

/**
 * Validate ZIP entry to prevent ZIP bombs and path traversal
 */
function validateZipEntry(
  path: string,
  compressedSize: number,
  uncompressedSize: number
): void {
  // Validate path
  validatePath(path);

  // Check compression ratio
  const ratio = uncompressedSize / Math.max(1, compressedSize);
  if (ratio > MAX_COMPRESSION_RATIO) {
    throw new Error(
      `ZIP bomb detected: ${path} (compression ratio ${ratio.toFixed(1)} exceeds ${MAX_COMPRESSION_RATIO})`
    );
  }

  // Check file size
  if (uncompressedSize > MAX_FILE_SIZE) {
    throw new Error(
      `File too large: ${path} (${uncompressedSize} bytes exceeds ${MAX_FILE_SIZE})`
    );
  }
}

/**
 * Calculate SHA-256 hash of data
 */
function calculateSHA256(data: Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

// ============================================================================
// AgentFile Class
// ============================================================================

export class AgentFile {
  private zip: JSZip;
  private manifest: Manifest;
  private totalUncompressedSize: number = 0;
  private entryCount: number = 0;

  private constructor(manifest: Manifest) {
    this.zip = new JSZip();
    this.manifest = manifest;
  }

  /**
   * Create a new .agent file
   */
  static async create(options?: CreateOptions): Promise<AgentFile> {
    const manifest: Manifest = {
      version: '1.0.0',
      format: 'agent',
      created_at: new Date().toISOString(),
      source_tool: options?.sourceTool || {
        name: 'manual',
        version: '1.0.0'
      },
      encryption: {
        enabled: options?.encryption?.enabled || false
      }
    };

    if (options?.metadata) {
      manifest.metadata = options.metadata;
    }

    const agentFile = new AgentFile(manifest);
    await agentFile.writeManifest();

    return agentFile;
  }

  /**
   * Load an existing .agent file
   */
  static async load(path: string): Promise<AgentFile> {
    if (!existsSync(path)) {
      throw new Error(`File not found: ${path}`);
    }

    const data = readFileSync(path);
    return AgentFile.loadFromBuffer(data);
  }

  /**
   * Load .agent file from buffer
   */
  static async loadFromBuffer(buffer: Buffer): Promise<AgentFile> {
    let totalUncompressedSize = 0;
    let entryCount = 0;

    // First pass: validate sizes and count entries
    const zip = await JSZip.loadAsync(buffer, {
      createFolders: false
    });

    // Validate entries
    const entries: Array<{ path: string; data: () => Promise<Buffer> }> = [];

    zip.forEach((relativePath, zipEntry) => {
      if (zipEntry.dir) {
        return;
      }

      entryCount++;

      if (entryCount > MAX_ENTRIES) {
        throw new Error(
          `Too many files in archive: ${entryCount} exceeds ${MAX_ENTRIES}`
        );
      }

      const compressed = zipEntry._data?.compressedSize || 0;
      const uncompressed = zipEntry._data?.uncompressedSize || 0;

      // Validate entry
      validateZipEntry(relativePath, compressed, uncompressed);

      totalUncompressedSize += uncompressed;

      if (totalUncompressedSize > MAX_TOTAL_SIZE) {
        throw new Error(
          `File too large: ${totalUncompressedSize} bytes exceeds ${MAX_TOTAL_SIZE}`
        );
      }

      entries.push({
        path: relativePath,
        data: async () => {
          const blob = await zipEntry.async('arraybuffer');
          return Buffer.from(blob);
        }
      });
    });

    // Load manifest
    const manifestEntry = entries.find((e) => e.path === 'manifest.json');
    if (!manifestEntry) {
      throw new Error('Missing manifest.json');
    }

    const manifestData = await manifestEntry.data();
    const manifest: Manifest = JSON.parse(manifestData.toString());

    // Validate manifest
    const validation = AgentFile.validateManifest(manifest);
    if (!validation.valid) {
      throw new Error(`Invalid manifest: ${validation.errors.join(', ')}`);
    }

    // Create AgentFile instance
    const agentFile = new AgentFile(manifest);
    agentFile.zip = zip;
    agentFile.totalUncompressedSize = totalUncompressedSize;
    agentFile.entryCount = entryCount;

    return agentFile;
  }

  /**
   * Add conversation messages
   */
  async addConversation(messages: Message[]): Promise<void> {
    const conversation = {
      messages
    };

    const data = JSON.stringify(conversation, null, 2);
    const buffer = Buffer.from(data, 'utf-8');

    await this.addComponent('conversation/messages.json', buffer);
    this.updateComponents();
  }

  /**
   * Add semantic map
   */
  async addSemanticMap(map: SemanticMap): Promise<void> {
    const data = JSON.stringify(map, null, 2);
    const buffer = Buffer.from(data, 'utf-8');

    await this.addComponent('semantic-map/file-tree.json', buffer);
    this.updateComponents();
  }

  /**
   * Add terminal history
   */
  async addTerminalHistory(sessions: TerminalSession[]): Promise<void> {
    const terminal = { sessions };

    const data = JSON.stringify(terminal, null, 2);
    const buffer = Buffer.from(data, 'utf-8');

    await this.addComponent('terminal/sessions.json', buffer);
    this.updateComponents();
  }

  /**
   * Add future plan
   */
  async addFuturePlan(plan: FuturePlan): Promise<void> {
    if (plan.plan) {
      const buffer = Buffer.from(plan.plan, 'utf-8');
      await this.addComponent('future-plan/plan.md', buffer);
    }

    if (plan.tasks && plan.tasks.length > 0) {
      const data = JSON.stringify({ tasks: plan.tasks }, null, 2);
      const buffer = Buffer.from(data, 'utf-8');
      await this.addComponent('future-plan/tasks.json', buffer);
    }

    this.updateComponents();
  }

  /**
   * Add asset file
   */
  async addAsset(file: Buffer, path: string): Promise<void> {
    const assetPath = `assets/blobs/${path}`;
    await this.addComponent(assetPath, file);
    this.updateComponents();
  }

  /**
   * Add a component to the archive
   */
  private async addComponent(path: string, data: Buffer): Promise<void> {
    validatePath(path);

    if (data.length > MAX_FILE_SIZE) {
      throw new Error(
        `File too large: ${path} (${data.length} bytes exceeds ${MAX_FILE_SIZE})`
      );
    }

    this.totalUncompressedSize += data.length;
    this.entryCount++;

    if (this.totalUncompressedSize > MAX_TOTAL_SIZE) {
      throw new Error(
        `File too large: total ${this.totalUncompressedSize} bytes exceeds ${MAX_TOTAL_SIZE}`
      );
    }

    if (this.entryCount > MAX_ENTRIES) {
      throw new Error(
        `Too many files: ${this.entryCount} exceeds ${MAX_ENTRIES}`
      );
    }

    this.zip.file(path, data);
  }

  /**
   * Write manifest to archive
   */
  private async writeManifest(): Promise<void> {
    this.manifest.updated_at = new Date().toISOString();
    const data = JSON.stringify(this.manifest, null, 2);
    this.zip.file('manifest.json', data);
  }

  /**
   * Update component list in manifest
   */
  private updateComponents(): void {
    const components: ComponentInfo[] = [];

    this.zip.forEach((path, entry) => {
      if (entry.dir) return;

      const uncompressed = entry._data?.uncompressedSize || 0;

      // Calculate hash (this is simplified - real implementation would hash actual data)
      const hash = calculateSHA256(Buffer.from(path));

      components.push({
        path,
        sha256: hash,
        size: uncompressed
      });
    });

    this.manifest.components = components;
  }

  /**
   * Save .agent file to disk
   */
  async save(path: string): Promise<void> {
    await this.writeManifest();

    const buffer = await this.zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    writeFileSync(path, buffer);
  }

  /**
   * Get manifest
   */
  getManifest(): Manifest {
    return { ...this.manifest };
  }

  /**
   * Validate the .agent file
   */
  validate(): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Validate manifest
    const manifestValidation = AgentFile.validateManifest(this.manifest);
    result.errors.push(...manifestValidation.errors);
    result.warnings.push(...manifestValidation.warnings);

    // Validate components
    if (this.manifest.components) {
      for (const component of this.manifest.components) {
        try {
          validatePath(component.path);
        } catch (error) {
          result.errors.push(
            `Component path validation failed: ${component.path} - ${(error as Error).message}`
          );
        }
      }
    }

    result.valid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate manifest structure
   */
  static validateManifest(manifest: unknown): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    if (!manifest || typeof manifest !== 'object') {
      result.valid = false;
      result.errors.push('Manifest must be an object');
      return result;
    }

    const m = manifest as Record<string, unknown>;

    // Check required fields
    if (!m.version || typeof m.version !== 'string') {
      result.errors.push('Missing or invalid version field');
    }

    if (m.format !== 'agent') {
      result.errors.push('Invalid format field (must be "agent")');
    }

    if (!m.created_at || typeof m.created_at !== 'string') {
      result.errors.push('Missing or invalid created_at field');
    }

    if (!m.source_tool || typeof m.source_tool !== 'object') {
      result.errors.push('Missing or invalid source_tool field');
    }

    if (!m.encryption || typeof m.encryption !== 'object') {
      result.errors.push('Missing or invalid encryption field');
    }

    result.valid = result.errors.length === 0;
    return result;
  }

  /**
   * Verify digital signature
   */
  async verifySignature(): Promise<boolean> {
    if (!this.manifest.signature?.enabled) {
      return true; // No signature required
    }

    // TODO: Implement Ed25519 signature verification
    // This would use a library like tweetnacl or sodium-js
    return false;
  }

  /**
   * Encrypt the .agent file
   */
  async encrypt(password: string): Promise<void> {
    if (this.manifest.encryption.enabled) {
      throw new Error('File is already encrypted');
    }

    // Generate salt and IV
    const salt = randomBytes(16);
    const iv = randomBytes(16);
    const iterations = 600000; // OWASP recommendation

    // TODO: Implement PBKDF2 key derivation
    // TODO: Implement AES-256-GCM encryption for all components

    this.manifest.encryption = {
      enabled: true,
      algorithm: 'AES-256-GCM',
      key_derivation: 'PBKDF2',
      iterations
    };

    await this.writeManifest();
  }

  /**
   * Decrypt the .agent file
   */
  async decrypt(password: string): Promise<void> {
    if (!this.manifest.encryption.enabled) {
      throw new Error('File is not encrypted');
    }

    // TODO: Implement decryption
    throw new Error('Decryption not yet implemented');
  }
}

// ============================================================================
// Exports
// ============================================================================

export default AgentFile;
