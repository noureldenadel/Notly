-- Visual Thinking App - SQLite Database Schema
-- Version: 1.0.0

-- Projects
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_path TEXT,
    color TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    settings TEXT -- JSON
);

-- Boards (sub-canvases within projects)
CREATE TABLE IF NOT EXISTS boards (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    parent_board_id TEXT,
    title TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    tldraw_snapshot TEXT, -- JSON snapshot of tldraw state
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Cards (notes with TipTap content)
CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    title TEXT,
    content TEXT, -- TipTap JSON or HTML
    content_type TEXT DEFAULT 'tiptap',
    color TEXT,
    is_hidden INTEGER DEFAULT 0,
    word_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    metadata TEXT -- JSON
);

-- Canvas Elements (tldraw shapes + metadata)
CREATE TABLE IF NOT EXISTS canvas_elements (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL,
    tldraw_shape_id TEXT NOT NULL, -- Link to tldraw shape
    element_type TEXT NOT NULL, -- card, image, pdf, highlight, custom
    reference_id TEXT, -- Links to cards, files, etc.
    metadata TEXT, -- JSON
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

-- Files (PDFs, images, videos, documents)
CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL, -- image, pdf, video, document, other
    file_size INTEGER,
    mime_type TEXT,
    thumbnail_path TEXT,
    import_mode TEXT DEFAULT 'copy', -- copy or link
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    metadata TEXT -- JSON
);

-- Highlights (PDF and card annotations)
CREATE TABLE IF NOT EXISTS highlights (
    id TEXT PRIMARY KEY,
    source_type TEXT NOT NULL, -- pdf, card
    source_id TEXT NOT NULL,
    highlight_type TEXT, -- text, area
    content TEXT,
    note TEXT,
    color TEXT,
    page_number INTEGER,
    position TEXT, -- JSON: {x, y, width, height}
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Tags
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT,
    group_id TEXT,
    position INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
);

-- Tag Relations (many-to-many)
CREATE TABLE IF NOT EXISTS tag_relations (
    tag_id TEXT NOT NULL,
    entity_type TEXT NOT NULL, -- project, board, card, file, highlight
    entity_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (tag_id, entity_type, entity_id),
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Links (connections between entities)
CREATE TABLE IF NOT EXISTS links (
    id TEXT PRIMARY KEY,
    source_type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    link_type TEXT DEFAULT 'reference', -- reference, embed, mention
    created_at INTEGER NOT NULL,
    UNIQUE(source_type, source_id, target_type, target_id)
);

-- Favorites
CREATE TABLE IF NOT EXISTS favorites (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    folder_id TEXT,
    position INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
);

-- Version History
CREATE TABLE IF NOT EXISTS version_history (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    content_snapshot TEXT,
    created_at INTEGER NOT NULL
);

-- Journal Entries
CREATE TABLE IF NOT EXISTS journal_entries (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE, -- YYYY-MM-DD format
    content TEXT, -- TipTap JSON
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Full-Text Search Index (FTS5)
CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
    entity_type,
    entity_id,
    title,
    content,
    tags,
    tokenize = 'porter unicode61'
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_boards_project ON boards(project_id);
CREATE INDEX IF NOT EXISTS idx_boards_position ON boards(project_id, position);
CREATE INDEX IF NOT EXISTS idx_canvas_elements_board ON canvas_elements(board_id);
CREATE INDEX IF NOT EXISTS idx_canvas_elements_type ON canvas_elements(element_type);
CREATE INDEX IF NOT EXISTS idx_highlights_source ON highlights(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_tag_relations_entity ON tag_relations(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_tag_relations_tag ON tag_relations(tag_id);
CREATE INDEX IF NOT EXISTS idx_links_source ON links(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_links_target ON links(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_favorites_entity ON favorites(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_version_history_entity ON version_history(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date);
