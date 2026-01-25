# Visual Thinking Workspace

A comprehensive, infinite-canvas based workspace designed for visual thinkers. Organize your projects, boards, and ideas in a flexible, open environment. This application combines the power of freeform drawing with structured data management, allowing you to manage cards, files, links, and more on a boundless canvas.

## 🚀 Key Features

*   **Infinite Canvas Engine**: Powered by [tldraw](https://tldraw.com/), providing a smooth, performant, and infinite workspace for all your content.
*   **Project & Board Management**: Create and manage multiple projects, each containing multiple boards to segregate different workflows or topics.
*   **Rich Content Support**:
    *   **Cards**: Create detailed notes or tasks directly on the canvas.
    *   **Files & PDFs**: Upload, view, and organize PDF documents and images seamlessly.
    *   **Links**: Save and categorize web resources with preview metadata.
    *   **Journal**: A built-in daily journal to capture thoughts and progress.
*   **Productivity Tools**:
    *   **Global Search**: Instantly find projects and boards.
    *   **Presentation Mode**: Present your boards cleanly without UI distractions.
    *   **Draggable Tabs**: Organize your workspace with browser-like tabs.
*   **Local First**: Your data is stored locally, ensuring privacy and speed.
*   **Customization**: Enhanced UI with themes and settings (Light/Dark mode support).

## 🛠️ Tech Stack

This project is built using modern web technologies to ensure performance and maintainability:

*   **Frontend Framework**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
*   **Canvas Engine**: [tldraw](https://github.com/tldraw/tldraw)
*   **State Management**: [Zustand](https://github.com/pmndrs/zustand)
*   **Data Fetching**: [TanStack Query](https://tanstack.com/query/latest)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Desktop Support**: [Tauri](https://tauri.app/) (Configuration included)

## 📦 Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (Latest LTS recommended)
*   npm or pnpm

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd pixel-perfect-pages-main
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the development server**
    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:8080`.

### Building for Production

To build the application for production:

```bash
npm run build
```

Previews can be viewed using:

```bash
npm run preview
```

## 📂 Project Structure

*   `src/components`: Reusable UI components and feature-specific widgets.
*   `src/pages`: Main application views (Projects dashboard, Canvas workspace).
*   `src/stores`: Global state management using Zustand (ProjectStore, CanvasStore, etc.).
*   `src/lib`: Utility functions and helpers.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source.
