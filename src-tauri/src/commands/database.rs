use serde::{Deserialize, Serialize};
use tauri::{command, Manager};


// ============================================
// Asset Management Commands
// ============================================

// ============================================
// Directory Structure Command
// ============================================

#[command]
pub async fn ensure_directory_structure(app: tauri::AppHandle) -> Result<bool, String> {
    use std::fs;
    
    let app_data_dir = app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    // Create main directories
    let directories = [
        app_data_dir.join("assets").join("pdfs"),
        app_data_dir.join("assets").join("images"),
        app_data_dir.join("assets").join("other"),
        app_data_dir.join("backups"),
        app_data_dir.join("temp"),
    ];
    
    for dir in &directories {
        if let Err(e) = fs::create_dir_all(dir) {
            log::error!("Failed to create directory {:?}: {}", dir, e);
            return Err(format!("Failed to create directory: {}", e));
        }
    }
    
    log::info!("Directory structure ensured at: {:?}", app_data_dir);
    Ok(true)
}

/// Get the assets directory path
#[command]
pub async fn get_assets_dir(app: tauri::AppHandle) -> Result<String, String> {
    let app_data_dir = app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    let assets_dir = app_data_dir.join("assets");
    Ok(assets_dir.to_string_lossy().to_string())
}

/// Copy a file to the app's assets folder
/// Returns the new relative path within the assets folder
#[command]
pub async fn copy_file_to_assets(
    app: tauri::AppHandle,
    source_path: String,
    file_type: String, // "pdf" | "image"
) -> Result<String, String> {
    use std::fs;
    use std::path::Path;
    
    let source = Path::new(&source_path);
    
    // Validate source exists
    if !source.exists() {
        return Err(format!("Source file does not exist: {}", source_path));
    }
    
    // Get app data directory
    let app_data_dir = app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    // Determine target subdirectory
    let subdir = match file_type.as_str() {
        "pdf" => "pdfs",
        "image" => "images",
        _ => "other",
    };
    
    let assets_dir = app_data_dir.join("assets").join(subdir);
    
    // Create directory if it doesn't exist
    fs::create_dir_all(&assets_dir)
        .map_err(|e| format!("Failed to create assets directory: {}", e))?;
    
    // Generate unique filename: timestamp_originalname
    let timestamp = chrono::Utc::now().timestamp_millis();
    let original_name = source.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("file");
    let new_filename = format!("{}_{}", timestamp, original_name);
    
    let target_path = assets_dir.join(&new_filename);
    
    // Copy the file
    fs::copy(source, &target_path)
        .map_err(|e| format!("Failed to copy file: {}", e))?;
    
    // Return the relative path from assets folder
    let relative_path = format!("{}/{}", subdir, new_filename);
    log::info!("Copied file to assets: {}", relative_path);
    
    Ok(relative_path)
}

/// Delete a file from the assets folder
#[command]
pub async fn delete_asset_file(
    app: tauri::AppHandle,
    relative_path: String,
) -> Result<bool, String> {
    use std::fs;
    
    let app_data_dir = app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    let file_path = app_data_dir.join("assets").join(&relative_path);
    
    if file_path.exists() {
        fs::remove_file(&file_path)
            .map_err(|e| format!("Failed to delete file: {}", e))?;
        log::info!("Deleted asset file: {}", relative_path);
        Ok(true)
    } else {
        log::warn!("Asset file not found: {}", relative_path);
        Ok(false)
    }
}

/// Get the full filesystem path for an asset
#[command]
pub async fn get_asset_path(
    app: tauri::AppHandle,
    relative_path: String,
) -> Result<String, String> {
    let app_data_dir = app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    let file_path = app_data_dir.join("assets").join(&relative_path);
    Ok(file_path.to_string_lossy().to_string())
}

/// Open the assets folder in the system file explorer
#[command]
pub async fn open_assets_folder(app: tauri::AppHandle) -> Result<(), String> {
    use std::process::Command;
    
    let app_data_dir = app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    let assets_dir = app_data_dir.join("assets");
    
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(&assets_dir)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }
    
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&assets_dir)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }
    
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&assets_dir)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }
    
    Ok(())
}

/// Save binary data (as base64) to the assets folder
/// This is used for files from clipboard/paste that don't have a filesystem path
#[command]
pub async fn save_bytes_to_assets(
    app: tauri::AppHandle,
    data: String,        // Base64-encoded data
    filename: String,    // Original filename 
    file_type: String,   // "pdf" | "image"
) -> Result<String, String> {
    use std::fs;
    use base64::{Engine as _, engine::general_purpose::STANDARD};
    
    // Decode base64 data
    let bytes = STANDARD.decode(&data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;
    
    // Get app data directory
    let app_data_dir = app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    // Determine target subdirectory
    let subdir = match file_type.as_str() {
        "pdf" => "pdfs",
        "image" => "images",
        _ => "other",
    };
    
    let assets_dir = app_data_dir.join("assets").join(subdir);
    
    // Create directory if it doesn't exist
    fs::create_dir_all(&assets_dir)
        .map_err(|e| format!("Failed to create assets directory: {}", e))?;
    
    // Generate unique filename: timestamp_originalname
    let timestamp = chrono::Utc::now().timestamp_millis();
    // Sanitize filename - keep only alphanumeric, dots, dashes, underscores
    let safe_filename: String = filename.chars()
        .filter(|c| c.is_alphanumeric() || *c == '.' || *c == '-' || *c == '_')
        .collect();
    let safe_filename = if safe_filename.is_empty() { "file".to_string() } else { safe_filename };
    let new_filename = format!("{}_{}", timestamp, safe_filename);
    
    let target_path = assets_dir.join(&new_filename);
    
    // Write the bytes to file
    fs::write(&target_path, bytes)
        .map_err(|e| format!("Failed to write file: {}", e))?;
    
    // Return the relative path from assets folder
    let relative_path = format!("{}/{}", subdir, new_filename);
    log::info!("Saved bytes to assets: {} ({} bytes from base64)", relative_path, data.len());
    
    Ok(relative_path)
}
