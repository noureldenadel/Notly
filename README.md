<div align="center">
  <img src="public/logo.svg" alt="Nōtly Logo" width="120" height="120" />
  <h1>Nōtly</h1>
  <p><strong>Limitless Visual Thinking & Knowledge Management</strong></p>

  <p>
    <a href="#1-overview">Overview</a> •
    <a href="#2-getting-started">Getting Started</a> •
    <a href="#3-user-guide">User Guide</a> •
    <a href="#4-technical-documentation">Technical Docs</a> •
    <a href="#5-for-developers">Developers</a>
  </p>
</div>

---

## 1. Overview

**Nōtly** is a next-generation visual workspace designed for researchers, students, and creative professionals. It bridges the gap between structured note-taking and freeform visual thinking. Built on an infinite canvas engine, it allows you to organize PDFs, images, notes, and mind maps in a boundless spatial environment.

### Key Features & Benefits
- **Infinite Canvas**: A boundless workspace to map out complex ideas without constraints.
- **Privacy First**: Local-first architecture ensures your data stays on your machine.
- **Visual Knowledge Management**: Combine PDFs, sticky notes, images, and diagrams in one place.
- **Project Organization**: Structure your work into projects and boards for easy retrieval.

### Target Audience
- **Researchers**: Annotate multiple PDFs side-by-side and connect concepts.
- **Students**: Create visual study guides and mind maps.
- **Designers**: Moodboarding and visual planning.
- **Developers**: Architecture diagrams and system planning.

---

## 2. Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (v9 or higher) or pnpm
- **Rust** (only if building the Desktop app via Tauri)

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/notly.git
   cd notly
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   Access the app at `http://localhost:8080` to see the Web version.

### Quick Start Tutorial
1. **Create a Project**: Click the "+" button in the sidebar to create your first project.
2. **Add Content**: Use the toolbar to add a "Card" or drag and drop an image onto the canvas.
3. **Import PDF**: Click the "PDF" icon in the toolbar or press `P` to select a PDF file.
4. **Annotate**: Double-click the PDF to open it in the viewer and start highlighting.

---

## 3. User Guide

### Core Features Explained
- **Canvas Navigation**: Pan with Space+Drag or Middle Mouse Button. Zoom with Ctrl/Cmd + Scroll.
- **Cards**: Rich text cards that support Markdown. customizable colors and sizes.
- **Mind Maps**: Specialized nodes that auto-layout for rapid brainstorming.
- **PDF Integration**: Import PDFs, view them in-app, and extract pages as images.

### How-to Guides
**Annotating a PDF:**
1. Select the PDF tool or press `P`.
2. Choose a file from your computer.
3. Once loaded, double-click the PDF shape on the canvas.
4. Use the highlight tool in the modal to mark text. Context saves automatically.

**Connecting Ideas:**
1. Select the Arrow tool (`A`).
2. Drag from one shape to another to create a dynamic link.
3. The arrow stays connected even when you move the shapes.

### Tips & Best Practices
- Use **Shortcuts**: `V` for Select, `H` for Hand, `T` for Text. Press `?` to see all shortcuts.
- **Group Items**: Select multiple items and press `Ctrl+G` to group them for easier movement.
- **Snapshots**: Use the "Export" feature to save your board as a JSON file for backup.

---

## 4. Technical Documentation

### Tech Stack
- **Frontend**: [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Canvas Engine**: [tldraw](https://tldraw.com/) (Customized)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Desktop Runtime**: [Tauri v2](https://tauri.app/) (Rust)

### Architecture Overview
Nōtly uses a **multi-store architecture**:
- **`projectStore`**: Manages project metadata (Projects -> Boards). Persisted to LocalStorage/File System.
- **`canvasStore`**: Manages the transient state of the React application relative to the canvas.
- **`fileStore`**: Handles file paths and asset references.

Data flow follows a unidirectional pattern: `User Action -> Store Update -> UI Reactivity`.

### System Requirements
- **OS**: Windows 10/11, macOS 10.15+, or modern Linux (Web version runs in any modern browser).
- **Memory**: Minimum 4GB RAM recommended for large PDF handling.

---

## 5. For Developers

### Development Setup
1. Follow the **Installation** steps above.
2. For Desktop development, install [Rust](https://www.rust-lang.org/tools/install).
3. Run `npm run tauri dev` to launch the desktop window.

### Project Structure
```bash
src/
├── components/          # GUI Components (Canvas, Sidebar, Modals)
├── hooks/               # React Hooks (useEditorContext, useTheme)
├── lib/                 # Utilities (assetManager, constants)
├── stores/              # State Management (Zustand stores)
└── types/               # TypeScript Interfaces
src-tauri/               # Rust backend code
```

### Contributing Guidelines
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/NewFeature`).
3. Commit changes (`git commit -m 'Add NewFeature'`).
4. Push content (`git push origin feature/NewFeature`).
5. Open a Pull Request.

### Build and Deployment
- **Web**: `npm run build` -> Output in `dist/`
- **Desktop**: `npm run tauri build` -> Output in `src-tauri/target/release/`

---

## 6. Integrations

### Third-Party Libraries
- **PDF.js**: Used via `react-pdf` for rendering and text layer extraction.
- **Tldraw**: The core engine providing the infinite canvas capabilities, adapted for custom shapes.

### Extensions
Currently, Nōtly supports internal extensions via the `src/components/canvas/shapes` directory. Developers can add new shape types (e.g., "VideoShape", "ChartShape") by registering a new `ShapeUtil`.

---

## 7. Troubleshooting & Support

### FAQ
**Q: My PDF is blank?**
A: Ensure the PDF is not password-protected. Try re-importing it.

**Q: Can I sync between devices?**
A: Nōtly is currently local-first. You can manually export/import projects to transfer data.

### Common Issues
- **"Failed to load resource"**: Check if the file was moved or deleted outside the app. Use the Asset Manager to consolidate files.
- **Performance Drop**: Large boards with >1000 items may slow down. Try grouping items or using multiple boards.

### How to get help
Open an issue on the [GitHub Issues](https://github.com/your-username/notly/issues) page.

---

## 8. Additional Resources

### Changelog
- **v0.1.0** (Current): Initial Beta. Added Asset Storage, PDF Viewer, and Undo/Redo.

### Security
This app runs locally. No data is sent to cloud servers. Be careful when effectively sharing project files containing sensitive info.

### License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
