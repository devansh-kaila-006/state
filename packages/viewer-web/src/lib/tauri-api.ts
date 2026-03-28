/**
 * Tauri API wrapper for desktop viewer
 *
 * This module provides a cross-platform interface that works in both
 * Tauri (desktop) and browser (web) environments.
 */

// Detect if running in Tauri
export const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

/**
 * Invoke a Tauri command
 */
async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauri) {
    throw new Error('Not running in Tauri environment');
  }

  const { invoke } = await import('@tauri-apps/api/tauri');
  return invoke<T>(cmd, args);
}

// ============================================================================
// File Dialog APIs
// ============================================================================

/**
 * Open file dialog to select an .agent file
 */
export async function openFileDialog(): Promise<string | null> {
  if (!isTauri) {
    // Fallback for web: Use HTML5 file input
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.agent';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          // In web, we'll return a special marker that indicates
          // the file should be read via file input
          resolve(null);
        } else {
          resolve(null);
        }
      };
      input.click();
    });
  }

  return invoke<string | null>('open_file_dialog');
}

/**
 * Read file contents
 */
export async function readFile(path: string): Promise<Uint8Array> {
  if (!isTauri) {
    throw new Error('readFile only works in Tauri environment. Use file input in web.');
  }

  const buffer = await invoke<number[]>('read_file', { path });
  return new Uint8Array(buffer);
}

/**
 * Save file dialog
 */
export async function saveFileDialog(defaultFilename: string): Promise<string | null> {
  if (!isTauri) {
    // Fallback for web: Trigger download
    const link = document.createElement('a');
    link.href = '#';
    link.download = defaultFilename;
    return null;
  }

  return invoke<string | null>('save_file_dialog', { defaultFilename });
}

/**
 * Write file contents
 */
export async function writeFile(path: string, contents: Uint8Array): Promise<void> {
  if (!isTauri) {
    throw new Error('writeFile only works in Tauri environment.');
  }

  await invoke('write_file', {
    path,
    contents: Array.from(contents),
  });
}

// ============================================================================
// Preferences APIs
// ============================================================================

export interface RecentFile {
  path: string;
  title?: string;
  opened_at: number;
  file_size: number;
}

export interface AppPreferences {
  theme: string;
  recent_files: RecentFile[];
  max_recent_files: number;
  default_directory?: string;
}

/**
 * Get app preferences
 */
export async function getPreferences(): Promise<AppPreferences> {
  if (!isTauri) {
    // Return default preferences for web
    return {
      theme: 'system',
      recent_files: [],
      max_recent_files: 20,
    };
  }

  return invoke<AppPreferences>('get_preferences');
}

/**
 * Save app preferences
 */
export async function savePreferences(prefs: AppPreferences): Promise<void> {
  if (!isTauri) {
    // Use localStorage for web
    localStorage.setItem('state-viewer-prefs', JSON.stringify(prefs));
    return;
  }

  await invoke('save_preferences', { prefs });
}

/**
 * Add file to recent files
 */
export async function addRecentFile(file: RecentFile): Promise<AppPreferences> {
  if (!isTauri) {
    const prefs = await getPreferences();
    prefs.recent_files = [file, ...prefs.recent_files].slice(0, prefs.max_recent_files);
    await savePreferences(prefs);
    return prefs;
  }

  return invoke<AppPreferences>('add_recent_file', { file });
}

/**
 * Clear recent files
 */
export async function clearRecentFiles(): Promise<void> {
  if (!isTauri) {
    const prefs = await getPreferences();
    prefs.recent_files = [];
    await savePreferences(prefs);
    return;
  }

  await invoke('clear_recent_files');
}

// ============================================================================
// System APIs
// ============================================================================

/**
 * Get app version
 */
export async function getAppVersion(): Promise<string> {
  if (!isTauri) {
    return '0.1.0-web';
  }

  return invoke<string>('get_app_version');
}

/**
 * Get default directory (home directory)
 */
export async function getDefaultDirectory(): Promise<string | null> {
  if (!isTauri) {
    return null;
  }

  return invoke<string | null>('get_default_directory');
}

/**
 * Open file in folder (show in explorer/finder)
 */
export async function openInFolder(path: string): Promise<void> {
  if (!isTauri) {
    // Fallback: just log the path
    console.log('File path:', path);
    return;
  }

  await invoke('open_in_folder', { path });
}

/**
 * Open directory in terminal
 */
export async function openInTerminal(path: string): Promise<void> {
  if (!isTauri) {
    // No-op for web
    return;
  }

  await invoke('open_in_terminal', { path });
}

// ============================================================================
// Window APIs
// ============================================================================

/**
 * Minimize window
 */
export async function minimizeWindow(): Promise<void> {
  if (!isTauri) return;

  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const window = getCurrentWindow();
  window.minimize();
}

/**
 * Maximize window
 */
export async function maximizeWindow(): Promise<void> {
  if (!isTauri) return;

  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const window = getCurrentWindow();
  window.toggleMaximize();
}

/**
 * Close window
 */
export async function closeWindow(): Promise<void> {
  if (!isTauri) return;

  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const window = getCurrentWindow();
  window.close();
}

/**
 * Set always on top
 */
export async function setAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
  if (!isTauri) return;

  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const window = getCurrentWindow();
  window.setAlwaysOnTop(alwaysOnTop);
}

// ============================================================================
// Export utilities
// ============================================================================

export const tauriAPI = {
  isTauri,
  openFileDialog,
  readFile,
  saveFileDialog,
  writeFile,
  getPreferences,
  savePreferences,
  addRecentFile,
  clearRecentFiles,
  getAppVersion,
  getDefaultDirectory,
  openInFolder,
  openInTerminal,
  minimizeWindow,
  maximizeWindow,
  closeWindow,
  setAlwaysOnTop,
};
