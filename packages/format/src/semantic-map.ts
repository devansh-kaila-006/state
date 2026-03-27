/**
 * Semantic map generator for .agent files
 *
 * Scans project directories and builds semantic maps of code structure
 */

import { readdir, stat, readFile } from 'fs/promises';
import { join, extname, relative, sep } from 'path';

// ============================================================================
// Constants
// ============================================================================

/** Maximum files to scan */
const MAX_FILES = 100000;

/** Maximum file size to scan (10MB) */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Directories to skip */
const SKIP_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  '.svn',
  'dist',
  'build',
  'out',
  'target',
  'bin',
  'obj',
  '.next',
  '.nuxt',
  'coverage',
  '.vscode',
  '.idea',
  'vendor',
  'tmp',
  'temp'
]);

/** File extensions to analyze */
const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.py': 'python',
  '.rs': 'rust',
  '.go': 'go',
  '.java': 'java',
  '.kt': 'kotlin',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.c': 'c',
  '.h': 'c',
  '.hpp': 'cpp',
  '.cs': 'csharp',
  '.php': 'php',
  '.rb': 'ruby',
  '.swift': 'swift',
  '.scala': 'scala',
  '.sh': 'shell',
  '.bash': 'shell',
  '.zsh': 'shell',
  '.fish': 'shell',
  '.ps1': 'powershell',
  '.sql': 'sql',
  '.html': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'sass',
  '.less': 'less',
  '.json': 'json',
  '.xml': 'xml',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'toml',
  '.md': 'markdown',
  '.tsx': 'typescript',
  '.jsx': 'javascript'
};

// ============================================================================
// Types
// ============================================================================

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
  exports?: string[];
  classes?: string[];
}

export interface ScanOptions {
  maxFiles?: number;
  maxFileSize?: number;
  skipDirs?: string[];
  includePattern?: RegExp;
  excludePattern?: RegExp;
}

// ============================================================================
// Scan Functions
// ============================================================================

/**
 * Scan a project directory and generate a semantic map
 */
export async function scanProject(
  projectPath: string,
  options: ScanOptions = {}
): Promise<SemanticMap> {
  const maxFiles = options.maxFiles || MAX_FILES;
  const maxFileSize = options.maxFileSize || MAX_FILE_SIZE;
  const skipDirs = new Set([
    ...SKIP_DIRECTORIES,
    ...(options.skipDirs || [])
  ]);

  const files: FileInfo[] = [];
  const dependencies: Record<string, string[]> = {};
  const summaries: Record<string, string> = {};

  let fileCount = 0;

  async function scanDirectory(dirPath: string, rootPath: string) {
    if (fileCount >= maxFiles) {
      return;
    }

    try {
      const entries = await readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (fileCount >= maxFiles) {
          break;
        }

        const fullPath = join(dirPath, entry.name);

        // Skip directories in skip list
        if (entry.isDirectory()) {
          if (skipDirs.has(entry.name)) {
            continue;
          }

          // Check exclude pattern
          if (options.excludePattern && options.excludePattern.test(entry.name)) {
            continue;
          }

          await scanDirectory(fullPath, rootPath);
          continue;
        }

        // Skip non-files
        if (!entry.isFile()) {
          continue;
        }

        // Get file stats
        const stats = await stat(fullPath);

        // Skip large files
        if (stats.size > maxFileSize) {
          continue;
        }

        // Check include pattern
        if (options.includePattern && !options.includePattern.test(entry.name)) {
          continue;
        }

        // Check exclude pattern
        if (options.excludePattern && options.excludePattern.test(entry.name)) {
          continue;
        }

        // Get relative path
        const relPath = relative(rootPath, fullPath).replace(/\\/g, '/');

        // Detect language
        const ext = extname(entry.name).toLowerCase();
        const language = LANGUAGE_MAP[ext];

        if (!language) {
          continue;
        }

        // Create file info
        const fileInfo: FileInfo = {
          path: relPath,
          language,
          size: stats.size,
          modified: stats.mtime.toISOString()
        };

        // Try to extract more info (functions, imports)
        try {
          const content = await readFile(fullPath, 'utf-8');
          const analysis = analyzeFile(content, language);

          fileInfo.functions = analysis.functions;
          fileInfo.imports = analysis.imports;
          fileInfo.exports = analysis.exports;
          fileInfo.classes = analysis.classes;

          // Build dependencies
          if (analysis.imports && analysis.imports.length > 0) {
            dependencies[relPath] = analysis.imports;
          }

          // Generate summary
          summaries[relPath] = generateSummary(fileInfo, content);
        } catch {
          // If we can't read/analyze the file, skip extra info
        }

        files.push(fileInfo);
        fileCount++;
      }
    } catch (error) {
      // Skip directories we can't read
      console.warn(`Warning: Could not read directory ${dirPath}: ${(error as Error).message}`);
    }
  }

  await scanDirectory(projectPath, projectPath);

  return {
    files,
    dependencies,
    summaries
  };
}

/**
 * Analyze file content to extract functions, imports, etc.
 */
function analyzeFile(
  content: string,
  language: string
): {
  functions?: string[];
  imports?: string[];
  exports?: string[];
  classes?: string[];
} {
  const functions: string[] = [];
  const imports: string[] = [];
  const exports: string[] = [];
  const classes: string[] = [];

  const lines = content.split('\n');

  switch (language) {
    case 'typescript':
    case 'javascript':
      // Extract functions
      for (const line of lines) {
        // Function declarations
        const funcMatch = line.match(/function\s+(\w+)/);
        if (funcMatch) functions.push(funcMatch[1]);

        // Arrow functions assigned to variables
        const arrowMatch = line.match(/(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/);
        if (arrowMatch) functions.push(arrowMatch[1]);

        // Method declarations
        const methodMatch = line.match(/(\w+)\s*\([^)]*\)\s*{/);
        if (methodMatch && line.includes('async') === false) {
          // This might be a method, but we need more context
          // For now, skip to avoid false positives
        }

        // Class declarations
        const classMatch = line.match(/class\s+(\w+)/);
        if (classMatch) classes.push(classMatch[1]);

        // Import statements
        const importMatch = line.match(/import\s+(?:(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/);
        if (importMatch) {
          imports.push(importMatch[2]);
        }

        // Require statements
        const requireMatch = line.match(/require\(['"]([^'"]+)['"]\)/);
        if (requireMatch) {
          imports.push(requireMatch[1]);
        }

        // Export statements
        const exportMatch = line.match(/export\s+(?:(?:const|let|var|function|class)\s+(\w+)|{([^}]*})\s+from)/);
        if (exportMatch) {
          if (exportMatch[2]) {
            exports.push(exportMatch[2]);
          } else if (exportMatch[3]) {
            exportMatch[3].split(',').forEach((exp: string) => {
              exports.push(exp.trim());
            });
          }
        }
      }
      break;

    case 'python':
      for (const line of lines) {
        // Function definitions
        const funcMatch = line.match(/def\s+(\w+)\s*\(/);
        if (funcMatch) functions.push(funcMatch[1]);

        // Class definitions
        const classMatch = line.match(/class\s+(\w+)/);
        if (classMatch) classes.push(classMatch[1]);

        // Import statements
        const importMatch = line.match(/(?:from\s+([^\s]+)\s+)?import\s+(.+)/);
        if (importMatch) {
          if (importMatch[1]) {
            imports.push(importMatch[1]);
          }
          // Split multiple imports
          const importsList = importMatch[2].split(',');
          importsList.forEach((imp: string) => {
            imports.push(imp.trim());
          });
        }
      }
      break;

    case 'rust':
      for (const line of lines) {
        // Function declarations
        const funcMatch = line.match(/fn\s+(\w+)\s*\(/);
        if (funcMatch) functions.push(funcMatch[1]);

        // Struct declarations
        const structMatch = line.match(/struct\s+(\w+)/);
        if (structMatch) classes.push(structMatch[1]);

        // Use statements
        const useMatch = line.match(/use\s+([^;]+);/);
        if (useMatch) {
          imports.push(useMatch[1]);
        }
      }
      break;

    case 'go':
      for (const line of lines) {
        // Function declarations
        const funcMatch = line.match(/func\s+(?:\(\w+\)\.)?(\w+)\s*\(/);
        if (funcMatch) functions.push(funcMatch[1]);

        // Import statements
        const importMatch = line.match(/import\s+(?:"([^"]+)"|`([^`]+)`)/);
        if (importMatch) {
          imports.push(importMatch[1] || importMatch[2]);
        }
      }
      break;
  }

  return {
    functions: functions.length > 0 ? functions : undefined,
    imports: imports.length > 0 ? imports : undefined,
    exports: exports.length > 0 ? exports : undefined,
    classes: classes.length > 0 ? classes : undefined
  };
}

/**
 * Generate a summary for a file
 */
function generateSummary(fileInfo: FileInfo, content: string): string {
  const parts: string[] = [];

  // Add language
  parts.push(`${fileInfo.language} file`);

  // Add function/class count
  if (fileInfo.functions && fileInfo.functions.length > 0) {
    parts.push(`${fileInfo.functions.length} functions`);
  }

  if (fileInfo.classes && fileInfo.classes.length > 0) {
    parts.push(`${fileInfo.classes.length} classes`);
  }

  // Add size
  if (fileInfo.size) {
    const sizeKB = (fileInfo.size / 1024).toFixed(1);
    parts.push(`${sizeKB} KB`);
  }

  // Truncate content for preview
  const preview = content.slice(0, 100).replace(/\s+/g, ' ').trim();
  const previewText = preview.length > 50 ? `${preview.slice(0, 50)}...` : preview;

  return `${parts.join(', ')}: ${previewText}`;
}

/**
 * Get language from file extension
 */
export function getLanguageFromExtension(filename: string): string | undefined {
  const ext = extname(filename).toLowerCase();
  return LANGUAGE_MAP[ext];
}

/**
 * Check if a directory should be skipped
 */
export function shouldSkipDirectory(dirname: string): boolean {
  return SKIP_DIRECTORIES.has(dirname);
}

/**
 * Add a custom directory to skip list
 */
export function addSkipDirectory(dirname: string): void {
  SKIP_DIRECTORIES.add(dirname);
}

/**
 * Remove a directory from skip list
 */
export function removeSkipDirectory(dirname: string): void {
  SKIP_DIRECTORIES.delete(dirname);
}
