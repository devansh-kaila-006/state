// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use chrono::{DateTime, Utc};
use dirs::home_dir;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Manager;
use uuid::Uuid;

// ============================================================================
// Types
// ============================================================================

#[derive(Debug, Serialize, Deserialize, Clone)]
struct RecentFile {
    path: String,
    title: Option<String>,
    opened_at: i64,
    file_size: u64,
}

#[derive(Debug, Serialize, Deserialize)]
struct AppPreferences {
    theme: String,
    recent_files: Vec<RecentFile>,
    max_recent_files: usize,
    default_directory: Option<String>,
}

impl Default for AppPreferences {
    fn default() -> Self {
        Self {
            theme: "system".to_string(),
            recent_files: Vec::new(),
            max_recent_files: 20,
            default_directory: None,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenDialogResult {
    path: String,
    buffer: String,
}

// ============================================================================
// Tauri Commands
// ============================================================================

#[tauri::command]
async fn open_file_dialog() -> Result<Option<String>, String> {
    tauri::api::dialog::FileDialogBuilder::new()
        .add_filter("Agent Files", &["agent"])
        .pick_file()
        .map(|p| p.to_str().map(String::from))
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn read_file(path: String) -> Result<Vec<u8>, String> {
    fs::read(&path).map_err(|e| e.to_string())
}

#[tauri::command]
async fn save_file_dialog(default_filename: String) -> Result<Option<String>, String> {
    tauri::api::dialog::FileDialogBuilder::new()
        .set_file_name(&default_filename)
        .add_filter("Agent Files", &["agent"])
        .save_file()
        .map(|p| p.to_str().map(String::from))
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn write_file(path: String, contents: Vec<u8>) -> Result<(), String> {
    fs::write(&path, contents).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_preferences() -> Result<AppPreferences, String> {
    let prefs_path = get_preferences_path()?;

    if prefs_path.exists() {
        let contents = fs::read_to_string(&prefs_path).map_err(|e| e.to_string())?;
        serde_json::from_str(&contents).map_err(|e| e.to_string())
    } else {
        Ok(AppPreferences::default())
    }
}

#[tauri::command]
async fn save_preferences(prefs: AppPreferences) -> Result<(), String> {
    let prefs_path = get_preferences_path()?;

    // Ensure directory exists
    if let Some(parent) = prefs_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let contents = serde_json::to_string_pretty(&prefs).map_err(|e| e.to_string())?;
    fs::write(&prefs_path, contents).map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_recent_file(file: RecentFile) -> Result<AppPreferences, String> {
    let mut prefs = get_preferences().await?;

    // Remove if already exists
    prefs.recent_files.retain(|f| f.path != file.path);

    // Add to front
    prefs.recent_files.insert(0, file);

    // Limit to max
    prefs.recent_files.truncate(prefs.max_recent_files);

    save_preferences(prefs.clone()).await?;
    Ok(prefs)
}

#[tauri::command]
async fn clear_recent_files() -> Result<(), String> {
    let mut prefs = get_preferences().await?;
    prefs.recent_files.clear();
    save_preferences(prefs).await
}

#[tauri::command]
async fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
async fn get_default_directory() -> Option<String> {
    home_dir()
        .and_then(|p| p.to_str())
        .map(String::from)
}

#[tauri::command]
async fn open_in_folder(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .args(["/select,", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .args(["-R", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
async fn open_in_terminal(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/c", "start", "cmd", "/k", "cd", "/d", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("osascript")
            .args([
                "-e",
                &format!("tell application \"Terminal\" to do script \"cd {}\"", path)
            ])
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "linux")]
    {
        // Try common terminal emulators
        for terminal in ["gnome-terminal", "konsole", "xterm"] {
            if std::process::Command::new(terminal)
                .arg("--working-directory")
                .arg(&path)
                .spawn()
                .is_ok()
            {
                return Ok(());
            }
        }
        return Err("No suitable terminal found".to_string());
    }

    Ok(())
}

// ============================================================================
// Helper Functions
// ============================================================================

fn get_preferences_path() -> Result<PathBuf, String> {
    let config_dir = dirs::config_dir()
        .ok_or("Failed to get config directory")?;

    Ok(config_dir.join("state-viewer").join("preferences.json"))
}

// ============================================================================
// Main Entry Point
// ============================================================================

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Initialize logger
            env_logger::init();

            // Handle file opens on macOS
            #[cfg(target_os = "macos")]
            {
                app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            open_file_dialog,
            read_file,
            save_file_dialog,
            write_file,
            get_preferences,
            save_preferences,
            add_recent_file,
            clear_recent_files,
            get_app_version,
            get_default_directory,
            open_in_folder,
            open_in_terminal,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
