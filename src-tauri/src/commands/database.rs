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
pub async fn ensure_directory_structure() -> Result<bool, String> {
    // Creates: projects/, backups/, temp/
    log::info!("Ensuring directory structure exists");
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
