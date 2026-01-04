// Type definitions for the Visual Thinking app stores

// Project & Board types
export interface Project {
  id: string;
  title: string;
  description?: string;
  thumbnailPath?: string;
  color?: string;
  createdAt: number;
  updatedAt: number;
  settings?: Record<string, unknown>;
}

export interface Board {
  id: string;
  projectId: string;
  parentBoardId?: string;
  title: string;
  position: number;
  tldrawSnapshot?: string; // JSON snapshot of tldraw state
  createdAt: number;
  updatedAt: number;
}

// Card types
export interface Card {
  id: string;
  title?: string;
  content: string; // TipTap JSON or HTML
  contentType: 'tiptap' | 'markdown' | 'html';
  color?: string;
  isHidden: boolean;
  wordCount: number;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, unknown>;
}

// Canvas element types
export interface CanvasElement {
  id: string;
  boardId: string;
  tldrawShapeId: string;
  elementType: 'card' | 'image' | 'pdf' | 'highlight' | 'custom';
  referenceId?: string; // Links to cards, files, etc.
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

// File types
export interface FileEntry {
  id: string;
  filename: string;
  filePath: string;
  fileType: 'image' | 'pdf' | 'video' | 'document' | 'other';
  fileSize?: number;
  mimeType?: string;
  thumbnailPath?: string;
  importMode: 'copy' | 'link';
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, unknown>;
}

// Highlight types
export interface Highlight {
  id: string;
  sourceType: 'pdf' | 'card';
  sourceId: string;
  highlightType?: 'text' | 'area';
  content?: string;
  note?: string;
  color?: string;
  pageNumber?: number;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  createdAt: number;
  updatedAt: number;
}

// Tag types
export interface Tag {
  id: string;
  name: string;
  color?: string;
  groupId?: string;
  position: number;
  createdAt: number;
}

export interface TagRelation {
  tagId: string;
  entityType: 'project' | 'board' | 'card' | 'file' | 'highlight';
  entityId: string;
  createdAt: number;
}

// Link types
export interface Link {
  id: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  linkType: 'reference' | 'embed' | 'mention';
  createdAt: number;
}

// Favorite types
export interface Favorite {
  id: string;
  entityType: string;
  entityId: string;
  folderId?: string;
  position: number;
  createdAt: number;
}

// Journal types
export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD format
  content: string; // TipTap JSON
  createdAt: number;
  updatedAt: number;
}

// Search result types
export interface SearchResult {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  snippet?: string;
  score: number;
}

// UI state types
export interface UIState {
  leftSidebarCollapsed: boolean;
  rightSidebarOpen: boolean;
  rightSidebarTab: 'info' | 'library' | 'highlights' | 'boards';
  activeTool: string;
  theme: 'light' | 'dark' | 'system';
  gridVisible: boolean;
  zoomLevel: number;
}
