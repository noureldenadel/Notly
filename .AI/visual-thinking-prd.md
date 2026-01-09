# Product Requirements Document: Visual Thinking & Knowledge Management App

## 1. Executive Summary

### 1.1 Product Vision
A powerful, offline-first visual thinking application that combines the flexibility of a canvas workspace with robust note-taking, PDF annotation, and knowledge organization capabilities. Built for Windows with easy macOS portability, targeting researchers, students, and knowledge workers who need to organize complex information visually.

### 1.2 Core Value Proposition
- **100% Offline**: Complete privacy and control with local-only storage
- **Visual-First**: Infinite canvas for spatial thinking and connection-making
- **Fast & Lightweight**: Optimized performance for handling large projects
- **Free & Open**: No subscriptions, cloud dependencies, or data lock-in

---

## 2. Technical Architecture

### 2.1 Tech Stack

#### **Framework: Tauri + React + TypeScript**

**Core Technologies:**
- **Framework**: Tauri 1.5+ (Rust backend)
- **UI**: React 18+ with TypeScript 5+
- **Build Tool**: Vite
- **Package Manager**: pnpm (faster than npm)

**Key Libraries & Integrations:**

```json
{
  "dependencies": {
    // Canvas Foundation (80% of canvas work done)
    "@tldraw/tldraw": "^2.0.0",
    
    // Rich Text Editor
    "@tiptap/react": "^2.1.0",
    "@tiptap/starter-kit": "^2.1.0",
    "@tiptap/extension-link": "^2.1.0",
    "@tiptap/extension-image": "^2.1.0",
    "@tiptap/extension-task-list": "^2.1.0",
    "@tiptap/extension-task-item": "^2.1.0",
    "@tiptap/extension-color": "^2.1.0",
    "@tiptap/extension-highlight": "^2.1.0",
    "@tiptap/extension-code-block-lowlight": "^2.1.0",
    
    // UI Components
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-popover": "^1.0.7",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    
    // State Management
    "zustand": "^4.4.7",
    "immer": "^10.0.3",
    
    // Drag & Drop
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    
    // PDF Handling
    "react-pdf": "^7.5.1",
    "pdfjs-dist": "^3.11.174",
    
    // Search
    "minisearch": "^6.3.0",
    
    // Utilities
    "date-fns": "^2.30.0",
    "nanoid": "^5.0.4",
    "lucide-react": "^0.294.0",
    
    // Animation
    "framer-motion": "^10.16.16"
  },
  
  "devDependencies": {
    "@tauri-apps/cli": "^1.5.0",
    "@tauri-apps/api": "^1.5.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

**Tauri Plugins:**
```toml
[dependencies]
tauri-plugin-sql = { version = "0.1", features = ["sqlite"] }
tauri-plugin-fs-extra = "0.1"
tauri-plugin-dialog = "0.1"
tauri-plugin-shell = "0.1"
```

### 2.2 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Tauri Window                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │          React Application (UI)              │ │
│  │                                              │ │
│  │  ┌────────────┐  ┌──────────────┐          │ │
│  │  │  tldraw    │  │   TipTap     │          │ │
│  │  │  Canvas    │  │   Editor     │          │ │
│  │  └────────────┘  └──────────────┘          │ │
│  │                                              │ │
│  │  ┌────────────┐  ┌──────────────┐          │ │
│  │  │  shadcn/ui │  │   dnd-kit    │          │ │
│  │  │ Components │  │   D&D        │          │ │
│  │  └────────────┘  └──────────────┘          │ │
│  │                                              │ │
│  │  ┌────────────────────────────────┐        │ │
│  │  │     Zustand State Stores       │        │ │
│  │  │  - Canvas  - Cards  - Projects │        │ │
│  │  └────────────────────────────────┘        │ │
│  └──────────────────────────────────────────────┘ │
│                        ↕                          │
│              Tauri IPC Commands                   │
│                        ↕                          │
│  ┌──────────────────────────────────────────────┐ │
│  │         Rust Backend (Tauri Core)            │ │
│  │                                              │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐ │ │
│  │  │ SQLite   │  │   File   │  │ Search   │ │ │
│  │  │ Database │  │  System  │  │  Index   │ │ │
│  │  └──────────┘  └──────────┘  └──────────┘ │ │
│  └──────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                        ↕
              Local File System
    ┌────────────────────────────────┐
    │  database.db (SQLite)          │
    │  projects/                     │
    │  ├── {project-id}/             │
    │  │   ├── files/                │
    │  │   └── thumbnails/           │
    │  backups/                      │
    └────────────────────────────────┘
```

### 2.3 How Libraries Integrate

#### **tldraw Integration:**
- **Handles**: Canvas rendering, selection, transformations, zoom/pan, undo/redo
- **We extend**: Custom shapes for cards, PDF previews, custom tools
- **Our additions**: 
  - Card shape type (rich text content)
  - PDF shape type (link to PDF with page)
  - Highlight shape type (annotation references)
  - Mind map shape type (nested structure)

#### **TipTap Integration:**
- **Used in**: Card editing (on canvas and in popups)
- **Extensions**: Mentions (@cards, @boards), slash commands, code blocks
- **Integrated with**: tldraw card shapes for inline editing

#### **shadcn/ui Integration:**
- **Used for**: Sidebars, dialogs, dropdowns, context menus, tabs
- **Style**: Tailwind-based, matches overall design
- **Components**: Pre-built, copy-paste into project

#### **dnd-kit Integration:**
- **Used for**: Library drag-to-canvas, sidebar reorganization, favorites
- **Works with**: tldraw's native drag system for canvas elements

#### **Zustand Stores:**
```typescript
// Store structure
stores/
├── projectStore.ts    // Projects & boards CRUD
├── canvasStore.ts     // Canvas state (wraps tldraw)
├── cardStore.ts       // Cards data & operations
├── fileStore.ts       // Files, PDFs, images
├── tagStore.ts        // Tags & filtering
├── searchStore.ts     // Search state & results
├── uiStore.ts         // Sidebar, modals, preferences
└── syncStore.ts       // Database sync operations
```

### 2.4 Data Architecture

#### **SQLite Schema (Core Tables)**

```sql
-- Projects
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_path TEXT,
    color TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    settings JSON
);

-- Boards (sub-canvases within projects)
CREATE TABLE boards (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    parent_board_id TEXT,
    title TEXT NOT NULL,
    position INTEGER,
    tldraw_snapshot TEXT, -- JSON snapshot of tldraw state
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Cards (notes with TipTap content)
CREATE TABLE cards (
    id TEXT PRIMARY KEY,
    title TEXT,
    content TEXT, -- TipTap JSON or HTML
    content_type TEXT DEFAULT 'tiptap',
    color TEXT,
    is_hidden BOOLEAN DEFAULT 0,
    word_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    metadata JSON
);

-- Canvas Elements (tldraw shapes + metadata)
CREATE TABLE canvas_elements (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL,
    tldraw_shape_id TEXT NOT NULL, -- Link to tldraw shape
    element_type TEXT NOT NULL, -- card, image, pdf, custom
    reference_id TEXT, -- Links to cards, files, etc.
    metadata JSON,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

-- Files (PDFs, images, videos, documents)
CREATE TABLE files (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    thumbnail_path TEXT,
    import_mode TEXT DEFAULT 'copy',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    metadata JSON
);

-- Highlights (PDF and card annotations)
CREATE TABLE highlights (
    id TEXT PRIMARY KEY,
    source_type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    highlight_type TEXT,
    content TEXT,
    note TEXT,
    color TEXT,
    page_number INTEGER,
    position JSON,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Tags
CREATE TABLE tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT,
    group_id TEXT,
    position INTEGER,
    created_at INTEGER NOT NULL
);

-- Tag Relations (many-to-many)
CREATE TABLE tag_relations (
    tag_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (tag_id, entity_type, entity_id),
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Links (connections between entities)
CREATE TABLE links (
    id TEXT PRIMARY KEY,
    source_type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    link_type TEXT DEFAULT 'reference',
    created_at INTEGER NOT NULL,
    UNIQUE(source_type, source_id, target_type, target_id)
);

-- Favorites
CREATE TABLE favorites (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    folder_id TEXT,
    position INTEGER,
    created_at INTEGER NOT NULL
);

-- Version History
CREATE TABLE version_history (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    content_snapshot TEXT,
    created_at INTEGER NOT NULL
);

-- Journal Entries
CREATE TABLE journal_entries (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    content TEXT, -- TipTap JSON
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Search Index (FTS5)
CREATE VIRTUAL TABLE search_index USING fts5(
    entity_type,
    entity_id,
    title,
    content,
    tags,
    tokenize = 'porter unicode61'
);

-- Indexes for performance
CREATE INDEX idx_boards_project ON boards(project_id);
CREATE INDEX idx_canvas_elements_board ON canvas_elements(board_id);
CREATE INDEX idx_highlights_source ON highlights(source_type, source_id);
CREATE INDEX idx_tag_relations_entity ON tag_relations(entity_type, entity_id);
CREATE INDEX idx_links_source ON links(source_type, source_id);
CREATE INDEX idx_links_target ON links(target_type, target_id);
```

#### **File System Structure**
```
AppData/LocalAppName/
├── database.db (SQLite)
├── projects/
│   ├── {project-id}/
│   │   ├── files/
│   │   │   ├── images/
│   │   │   ├── pdfs/
│   │   │   ├── videos/
│   │   │   └── documents/
│   │   ├── thumbnails/
│   │   └── exports/
├── backups/
│   └── backup-{timestamp}.zip
├── temp/
└── settings.json
```

---

## 3. Feature Specifications

### Phase 1: Core MVP (Months 1-3)

#### 3.1 Project & Board Management

**Leveraging tldraw:**
- tldraw provides: Canvas, viewport, camera controls
- We add: Project wrapper, board tabs, persistence

**Implementation:**
```typescript
// Our custom tldraw wrapper
<TldrawWrapper 
  projectId={projectId}
  boardId={boardId}
  onShapeCreate={handleShapeCreate}
  customShapes={[CardShape, PDFShape, HighlightShape]}
/>
```

**Features:**
- Create/rename/delete projects
- Multiple boards per project (tabs)
- tldraw handles: zoom, pan, selection, undo/redo
- We handle: persistence to SQLite, board switching

**Technical Implementation:**
- tldraw snapshot → serialize to JSON → save to `boards.tldraw_snapshot`
- On load: deserialize JSON → restore tldraw state
- Auto-save every 30 seconds using tldraw's events

#### 3.2 Cards (Rich Text Notes)

**Leveraging TipTap:**
- TipTap provides: Rich text editing, extensions, commands
- We add: Card wrapper, canvas integration, persistence

**Custom tldraw Card Shape:**
```typescript
class CardShape extends BaseBoxShapeTool {
  // Renders TipTap editor inside tldraw shape
  // Double-click to edit, click outside to finish
  // Resizable, moveable via tldraw
}
```

**TipTap Extensions Used:**
- **StarterKit**: Basic formatting (bold, italic, headings, lists)
- **TaskList/TaskItem**: Todo checkboxes
- **Link**: Hyperlinks
- **Image**: Inline images
- **Color**: Text color
- **Highlight**: Text highlighting
- **CodeBlockLowlight**: Code blocks with syntax highlighting
- **Custom Mention**: @card and @board references
- **Custom SlashCommands**: / menu for quick actions

**Card Features:**
- Create via: toolbar, shortcut (C), drag from library
- Edit modes:
  - **Inline**: Double-click card on canvas (TipTap in tldraw shape)
  - **Popup**: Click "expand" icon (full-screen TipTap)
  - **Sidebar**: Edit while viewing canvas
- Auto-save on blur
- Word count (via TipTap word counter)
- Card colors (tldraw shape fill)

**Display Modes (tldraw shape variants):**
- **Collapsed**: Title only, small height
- **Preview**: Title + first 3 lines
- **Expanded**: Full content visible
- **Reference**: Link to card (not embedded)

**Library Management:**
- Cards stored in `cards` table
- Library view uses dnd-kit for drag to canvas
- Filter/search using MiniSearch
- Multi-select with dnd-kit

#### 3.3 Visual Elements (Provided by tldraw)

**Built-in tldraw Shapes:**
- ✅ Rectangle, Ellipse, Triangle, Diamond (free)
- ✅ Arrow/Connectors (free, multiple styles)
- ✅ Text (free)
- ✅ Draw/Pen (free)
- ✅ Sticky notes (we customize)
- ✅ Frames (free, for grouping)
- ✅ Selection, rotation, resizing (free)

**Our Customizations:**
- Sticky Note: Pre-styled tldraw text/rectangle
- Custom colors: Apply our palette to tldraw shapes
- Frame styling: Custom borders and colors

**What tldraw Gives Us:**
- Multi-select (shift+click, drag select)
- Group/ungroup
- Align tools (align left/right/top/bottom/center)
- Distribute evenly
- Bring to front / send to back
- Lock/unlock
- Copy/paste/duplicate
- Zoom controls
- Grid and snap

#### 3.4 Images

**Implementation:**
- User imports image → saved to `files` table + filesystem
- Drag from library → creates tldraw Image shape
- tldraw handles: resize, rotate, move, duplicate

**Custom Image Shape (extends tldraw):**
```typescript
class ImageFileShape extends TLImageShape {
  // Links to file in database
  // Shows caption/title (toggle)
  // Right-click menu for "Open in viewer"
}
```

**Image Features:**
- Import: Drag & drop, paste, file picker, URL
- Formats: PNG, JPG, WEBP, AVIF, GIF, SVG
- Batch import (20 max)
- Thumbnail generation (256x256) using sharp (Rust)
- Image viewer: Click to open full-screen (custom modal)

**Library:**
- Grid view with thumbnails
- Search by filename (MiniSearch)
- Filter by project, tags
- Drag to canvas using dnd-kit

#### 3.5 PDF Support (Basic)

**Using react-pdf:**
- PDF viewer in sidebar or popup
- Page navigation, zoom, search within PDF

**Custom PDF Shape (tldraw):**
```typescript
class PDFPageShape extends BaseBoxShapeTool {
  // Shows thumbnail of PDF page
  // Links to file in database
  // Click to open PDF viewer
}
```

**Features:**
- Import PDF (copy or link mode)
- PDF viewer (split view or separate window)
- Page thumbnails
- Drag page to canvas → creates PDFPageShape
- Search text in PDF (react-pdf built-in)

---

### Phase 2: Enhanced Features (Months 4-6)

#### 3.6 PDF Annotations & Highlights

**Custom Highlight System:**
- react-pdf for rendering
- Custom overlay for selection/highlighting
- Store in `highlights` table

**Highlight Types:**
- Text highlight (color-coded)
- Area highlight (rectangle)
- Notes attached to highlights

**Integration:**
- Drag highlight from sidebar → creates HighlightShape on canvas
- HighlightShape shows: snippet, note, link to source
- Click HighlightShape → opens PDF to exact location

**Using dnd-kit:**
- Drag highlights from sidebar to canvas
- Drag highlights to TipTap cards (embed)

#### 3.7 Mind Maps

**Custom Mind Map Shape (tldraw):**
```typescript
class MindMapShape extends BaseBoxShapeTool {
  // Interactive nested structure
  // Nodes can contain: text, cards, images, highlights
  // Multiple layouts (horizontal, vertical)
}
```

**Features:**
- Create mind map on canvas
- Nodes editable inline
- Drag to rearrange (updates connections)
- Styles: colors, fonts, connectors
- Collapse/expand branches
- Export as image (tldraw built-in)

**Node Content:**
- Text (TipTap for rich text)
- Links to cards (@mention)
- Embedded images
- Links to highlights

#### 3.8 Tags & Organization

**Implementation:**
- Tags stored in `tags` table
- Tag relations in `tag_relations` table
- Tag UI using shadcn/ui components

**Tag Features:**
- Create tags (with colors from palette)
- Tag groups
- Drag to reorder (dnd-kit)
- Apply tags to: projects, boards, cards, files, highlights

**Tag Views:**
- Tag sidebar (shadcn/ui collapsible)
- Tag detail page (all items with tag)
- Multi-tag filter (MiniSearch integration)

**Quick Tagging:**
- Right-click element → "Add tag"
- Dropdown with recent tags (shadcn/ui select)
- Create new tag inline

#### 3.9 Links & Backlinks

**Implementation:**
- Store in `links` table
- Bidirectional tracking
- MiniSearch index for quick lookup

**Link Types:**
- Card to card
- Card to board
- Card to project
- Card to file
- Card to highlight
- External URLs
- Local file paths

**UI:**
- Link button in TipTap toolbar
- @ mention for internal links
- Backlinks panel (shadcn/ui dialog)
- Click link → navigate or open

**Visual Links (on canvas):**
- tldraw arrows between shapes
- Quick connect mode: click card → click target → auto-arrow

#### 3.10 Library & Search

**Global Library (shadcn/ui):**
- Tabs for: All, Cards, Files, Highlights, Projects
- Grid/list view toggle
- Type filter (multi-select with shadcn/ui)

**Search (MiniSearch):**
- Index on: title, content, tags, filename
- Search as you type
- Results grouped by type
- Click result → navigate to location

**Implementation:**
```typescript
// Initialize MiniSearch
const miniSearch = new MiniSearch({
  fields: ['title', 'content', 'tags', 'filename'],
  storeFields: ['id', 'type', 'title'],
  searchOptions: {
    boost: { title: 2 },
    fuzzy: 0.2
  }
});

// Add documents from database
miniSearch.addAll(documents);

// Search
const results = miniSearch.search(query);
```

**Filters:**
- By type, tags, project, date
- Save filter combinations to `favorites`
- Quick filters: untagged, hidden, recent

---

### Phase 3: Advanced Features (Months 7-9)

#### 3.11 Journal

**Implementation:**
- One entry per day in `journal_entries`
- TipTap editor for content
- Date picker (shadcn/ui calendar)

**Features:**
- Daily journal entries
- Calendar view (monthly grid)
- Rich text with TipTap
- Tag entries
- Link to other content
- Search journal (MiniSearch)

**UI:**
- Calendar sidebar (shadcn/ui)
- Click date → open entry
- Navigate with arrows
- "Today" quick button

#### 3.12 Favorites & Recents

**Favorites (dnd-kit):**
- Star any entity type
- Organize in folders
- Drag to reorder
- Sidebar section (shadcn/ui collapsible)

**Recents:**
- Track in local state (Zustand)
- Show last 10 opened
- Clear individual items
- Persist to localStorage

**UI:**
- Left sidebar section
- Icons for entity types (lucide-react)
- Click to navigate
- Right-click for options

#### 3.13 Import/Export

**Import:**
- Markdown → parse → create cards (TipTap)
- Images → batch import
- PDFs → add to library
- Files → copy or link mode

**Export:**
- Cards → Markdown (TipTap toMarkdown)
- Cards → PDF (html2pdf)
- Canvas → Image (tldraw export)
- Canvas → PDF (tldraw export)
- Project → ZIP (all files + db export)

**Backup (Tauri Rust):**
```rust
// Automatic backup every 24h
async fn backup_database() {
    // Copy database.db
    // ZIP project files
    // Save to backups/ with timestamp
    // Keep last 10 backups
}
```

#### 3.14 Customization & Settings

**Settings UI (shadcn/ui):**
- Tabs: Appearance, Behavior, Storage, Shortcuts
- Store in `settings.json`
- Load on app start

**Appearance:**
- Light/dark mode (Tailwind dark: class)
- Canvas colors (tldraw theme)
- Default card colors
- Grid visibility (tldraw)

**Behavior:**
- Auto-save interval
- Default card width
- Double-click action
- Zoom sensitivity (tldraw config)

**Storage:**
- View usage (scan filesystem)
- Clean unused files (find orphaned)
- Change storage path (Tauri dialog)
- Import/export settings

**Shortcuts:**
- Customizable keybindings (Zustand store)
- Conflict detection
- Reset to defaults
- Cheat sheet (shadcn/ui dialog)

---

### Phase 4: Polish & Advanced (Months 10-12)

#### 3.15 Presentation Mode

**Using tldraw:**
- tldraw has built-in presentation mode
- We add: Frame navigation, laser pointer

**Features:**
- Full-screen (Tauri API)
- Navigate by frames (tldraw)
- Laser pointer (custom cursor)
- Drawing during presentation (tldraw pen)
- Hide UI elements
- Export as PDF (tldraw)

#### 3.16 Advanced Canvas (tldraw)

**Already Included:**
- Multi-select (tldraw)
- Alignment tools (tldraw)
- Distribute evenly (tldraw)
- Group/ungroup (tldraw)

**We Add:**
- Auto-layout algorithm (our code)
- Grid layout (position shapes programmatically)
- Quick arrange buttons

**Performance (tldraw):**
- Virtual rendering (tldraw built-in)
- 1000+ shapes smooth
- GPU-accelerated
- We add: Progressive loading for images

#### 3.17 Version History

**Implementation:**
- Snapshot on significant changes
- Store in `version_history` table
- Limit: last 20 versions per entity

**Features:**
- View history (shadcn/ui dialog)
- Preview version
- Restore version
- Compare versions (diff UI)
- Auto-save on: card edit, canvas major change

**UI:**
- Timeline view (shadcn/ui)
- Diff viewer (custom component)
- Restore button

#### 3.18 Info Panels

**Using shadcn/ui:**
- Side panel (resizable)
- Tabs for different entity types
- Property list

**Info Types:**
- **Card**: word count, dates, tags, backlinks, used in
- **Project**: boards, cards, storage, tags
- **File**: size, type, path, used in
- **Board**: elements count, created/modified

**Backlinks Panel:**
- List all references (query `links` table)
- Click to navigate (smooth scroll with tldraw)
- Group by type

---

## 4. User Interface Design

### 4.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Title Bar [Tauri]                              [- □ ×]     │
├──┬──────────────────────────────────────────────────────┬───┤
│  │                                                      │   │
│L │          tldraw Canvas                               │ R │
│e │    (Cards, Shapes, Images, PDFs, etc.)              │ i │
│f │                                                      │ g │
│t │    [All interactions via tldraw]                    │ h │
│  │                                                      │ t │
│S │    Custom Shapes:                                   │   │
│i │    - CardShape (TipTap inside)                      │ S │
│d │    - PDFShape (preview)                             │ i │
│e │    - HighlightShape (snippet)                       │ d │
│b │    - MindMapShape (nested)                          │ e │
│a │                                                      │ b │
│r │                                                      │ a │
│  │                                                      │ r │
│  │                                                      │   │
│  │                                                      │   │
├──┴──────────────────────────────────────────────────────┴───┤
│  tldraw Toolbar + Custom Tools              Status Info     │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Left Sidebar (shadcn/ui Collapsible)

```typescript
<Sidebar>
  <SidebarSection title="Quick Actions">
    <Button>New Card</Button>
    <Button>New Project</Button>
    <Button>Import Files</Button>
  </SidebarSection>
  
  <SidebarSection title="Favorites" collapsible>
    <FavoritesList /> {/* dnd-kit sortable */}
  </SidebarSection>
  
  <SidebarSection title="Recents" collapsible>
    <RecentsList />
  </SidebarSection>
  
  <SidebarSection title="Projects" collapsible>
    <ProjectTree /> {/* Expandable tree */}
  </SidebarSection>
  
  <SidebarSection title="Library">
    <Tabs>
      <TabsList>
        <Tab>Cards</Tab>
        <Tab>Files</Tab>
        <Tab>Highlights</Tab>
      </TabsList>
      <TabContent>
        <LibraryGrid /> {/* dnd-kit draggable */}
      </TabContent>
    </Tabs>
  </SidebarSection>
  
  <SidebarSection title="Tags" collapsible>
    <TagList /> {/* dnd-kit sortable */}
  </SidebarSection>
</Sidebar>
```

### 4.3 Right Sidebar (shadcn/ui Resizable)

```typescript
<ResizablePanel>
  <Tabs>
    <Tab icon={<Info />}>
      <InfoPanel /> {/* Shows selected element info */}
    </Tab>
    <Tab icon={<Library />}>
      <QuickLibrary /> {/* Drag items to canvas */}
    </Tab>
    <Tab icon={<Highlight />}>
      <HighlightsList /> {/* PDF/card highlights */}
    </Tab>
    <Tab icon={<Layers />}>
      <BoardsList /> {/* Navigate boards */}
    </Tab>
  </Tabs>
</ResizablePanel>
```

### 4.4 tldraw Toolbar Customization

**Default tldraw Tools:**
- Select (V)
- Hand (H)
- Draw (D)
- Eraser (E)
- Arrow (A)
- Text (T)
- Shapes (Rectangle, Ellipse, etc.)
- Frame (F)

**Our Custom Tools:**
```typescript
const customTools = [
  {
    id: 'card',
    icon: <FileText />,
    label: 'Card',
    kbd: 'C',
    onSelect: () => createCard()
  