use serde::{Deserialize, Serialize};
use tauri::command;

// Project types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub thumbnail_path: Option<String>,
    pub color: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
    pub settings: Option<String>,
}

// Board types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Board {
    pub id: String,
    pub project_id: String,
    pub parent_board_id: Option<String>,
    pub title: String,
    pub position: i32,
    pub tldraw_snapshot: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

// Card types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Card {
    pub id: String,
    pub title: Option<String>,
    pub content: String,
    pub content_type: String,
    pub color: Option<String>,
    pub is_hidden: bool,
    pub word_count: i32,
    pub created_at: i64,
    pub updated_at: i64,
    pub metadata: Option<String>,
}

// File types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileEntry {
    pub id: String,
    pub filename: String,
    pub file_path: String,
    pub file_type: String,
    pub file_size: Option<i64>,
    pub mime_type: Option<String>,
    pub thumbnail_path: Option<String>,
    pub import_mode: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub metadata: Option<String>,
}

// Tag types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tag {
    pub id: String,
    pub name: String,
    pub color: Option<String>,
    pub group_id: Option<String>,
    pub position: i32,
    pub created_at: i64,
}

// Database initialization command
#[command]
pub async fn init_database(db_path: String) -> Result<String, String> {
    log::info!("Initializing database at: {}", db_path);
    Ok(format!("Database initialized at: {}", db_path))
}

// Project CRUD commands
#[command]
pub async fn create_project(
    id: String,
    title: String,
    description: Option<String>,
    color: Option<String>,
) -> Result<Project, String> {
    let now = chrono::Utc::now().timestamp_millis();
    Ok(Project {
        id,
        title,
        description,
        thumbnail_path: None,
        color,
        created_at: now,
        updated_at: now,
        settings: None,
    })
}

#[command]
pub async fn get_projects() -> Result<Vec<Project>, String> {
    // This will be connected to actual SQLite queries via tauri-plugin-sql
    Ok(vec![])
}

#[command]
pub async fn update_project(
    id: String,
    title: Option<String>,
    description: Option<String>,
    color: Option<String>,
) -> Result<Project, String> {
    let now = chrono::Utc::now().timestamp_millis();
    Ok(Project {
        id,
        title: title.unwrap_or_default(),
        description,
        thumbnail_path: None,
        color,
        created_at: now,
        updated_at: now,
        settings: None,
    })
}

#[command]
pub async fn delete_project(id: String) -> Result<bool, String> {
    log::info!("Deleting project: {}", id);
    Ok(true)
}

// Board CRUD commands
#[command]
pub async fn create_board(
    id: String,
    project_id: String,
    title: String,
    position: i32,
) -> Result<Board, String> {
    let now = chrono::Utc::now().timestamp_millis();
    Ok(Board {
        id,
        project_id,
        parent_board_id: None,
        title,
        position,
        tldraw_snapshot: None,
        created_at: now,
        updated_at: now,
    })
}

#[command]
pub async fn get_boards(project_id: String) -> Result<Vec<Board>, String> {
    log::info!("Getting boards for project: {}", project_id);
    Ok(vec![])
}

#[command]
pub async fn save_canvas_snapshot(board_id: String, snapshot: String) -> Result<bool, String> {
    log::info!("Saving canvas snapshot for board: {}", board_id);
    log::debug!("Snapshot size: {} bytes", snapshot.len());
    Ok(true)
}

#[command]
pub async fn load_canvas_snapshot(board_id: String) -> Result<Option<String>, String> {
    log::info!("Loading canvas snapshot for board: {}", board_id);
    Ok(None)
}

// Card CRUD commands
#[command]
pub async fn create_card(
    id: String,
    title: Option<String>,
    content: String,
) -> Result<Card, String> {
    let now = chrono::Utc::now().timestamp_millis();
    let word_count = content.split_whitespace().count() as i32;
    Ok(Card {
        id,
        title,
        content,
        content_type: "tiptap".to_string(),
        color: None,
        is_hidden: false,
        word_count,
        created_at: now,
        updated_at: now,
        metadata: None,
    })
}

#[command]
pub async fn get_cards() -> Result<Vec<Card>, String> {
    Ok(vec![])
}

#[command]
pub async fn update_card(
    id: String,
    title: Option<String>,
    content: Option<String>,
    color: Option<String>,
) -> Result<bool, String> {
    log::info!("Updating card: {}", id);
    log::debug!("Title: {:?}, Content length: {:?}, Color: {:?}", 
        title, 
        content.as_ref().map(|c| c.len()), 
        color
    );
    Ok(true)
}

#[command]
pub async fn delete_card(id: String) -> Result<bool, String> {
    log::info!("Deleting card: {}", id);
    Ok(true)
}

// Search command
#[command]
pub async fn search_content(query: String) -> Result<Vec<serde_json::Value>, String> {
    log::info!("Searching for: {}", query);
    Ok(vec![])
}

// File system commands
#[command]
pub async fn get_app_data_dir() -> Result<String, String> {
    // This will be implemented to return the actual app data directory
    Ok("".to_string())
}

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

// FTS5 Search Result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FTSSearchResult {
    pub entity_type: String,
    pub entity_id: String,
    pub title: String,
    pub snippet: String,
    pub rank: f64,
}

// FTS5 Full-Text Search commands
#[command]
pub async fn fts_search(
    query: String,
    types: Vec<String>,
    date_from: Option<i64>,
    date_to: Option<i64>,
    limit: Option<i32>,
) -> Result<Vec<FTSSearchResult>, String> {
    log::info!("FTS5 search: '{}', types: {:?}, limit: {:?}", query, types, limit);
    
    // In production, this would execute:
    // SELECT entity_type, entity_id, title, snippet(search_index, 3, '<b>', '</b>', '...', 20) as snippet,
    //        rank FROM search_index WHERE search_index MATCH ? ORDER BY rank LIMIT ?
    
    // For now, return empty results (frontend will use MiniSearch as fallback)
    Ok(vec![])
}

#[command]
pub async fn fts_index_entity(
    entity_type: String,
    entity_id: String,
    title: String,
    content: String,
    tags: String,
) -> Result<bool, String> {
    log::info!("FTS5 indexing: {} {}", entity_type, entity_id);
    
    // In production, this would execute:
    // INSERT OR REPLACE INTO search_index (entity_type, entity_id, title, content, tags)
    // VALUES (?, ?, ?, ?, ?)
    
    Ok(true)
}

#[command]
pub async fn fts_remove_entity(
    entity_type: String,
    entity_id: String,
) -> Result<bool, String> {
    log::info!("FTS5 removing: {} {}", entity_type, entity_id);
    
    // In production, this would execute:
    // DELETE FROM search_index WHERE entity_type = ? AND entity_id = ?
    
    Ok(true)
}

#[command]
pub async fn fts_rebuild_index() -> Result<bool, String> {
    log::info!("FTS5 rebuilding entire index");
    
    // In production, this would:
    // 1. DELETE FROM search_index
    // 2. INSERT INTO search_index SELECT ... FROM cards
    // 3. INSERT INTO search_index SELECT ... FROM journal_entries
    // 4. etc.
    
    Ok(true)
}

// ============================================
// Asset Management Commands
// ============================================

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
