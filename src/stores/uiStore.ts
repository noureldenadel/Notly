import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import type { UIState } from './types';

interface ModalState {
    isOpen: boolean;
    type?: string;
    data?: Record<string, unknown>;
}

interface UIStoreState extends UIState {
    // Modal state
    modal: ModalState;

    // Sidebar actions
    toggleLeftSidebar: () => void;
    setLeftSidebarCollapsed: (collapsed: boolean) => void;
    toggleRightSidebar: () => void;
    setRightSidebarOpen: (open: boolean) => void;
    setRightSidebarTab: (tab: UIState['rightSidebarTab']) => void;

    // Tool actions
    setActiveTool: (tool: string) => void;

    // Theme actions
    setTheme: (theme: UIState['theme']) => void;
    toggleGrid: () => void;

    // Zoom actions
    setZoomLevel: (level: number) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;

    // Modal actions
    openModal: (type: string, data?: Record<string, unknown>) => void;
    closeModal: () => void;
}

export const useUIStore = create<UIStoreState>()(
    persist(
        immer((set) => ({
            // Initial UI state
            leftSidebarCollapsed: false,
            rightSidebarOpen: true,
            rightSidebarTab: 'info',
            activeTool: 'select',
            theme: 'dark',
            gridVisible: true,
            zoomLevel: 100,
            modal: { isOpen: false },

            // Sidebar actions
            toggleLeftSidebar: () => {
                set((state) => {
                    state.leftSidebarCollapsed = !state.leftSidebarCollapsed;
                });
            },

            setLeftSidebarCollapsed: (collapsed) => {
                set((state) => {
                    state.leftSidebarCollapsed = collapsed;
                });
            },

            toggleRightSidebar: () => {
                set((state) => {
                    state.rightSidebarOpen = !state.rightSidebarOpen;
                });
            },

            setRightSidebarOpen: (open) => {
                set((state) => {
                    state.rightSidebarOpen = open;
                });
            },

            setRightSidebarTab: (tab) => {
                set((state) => {
                    state.rightSidebarTab = tab;
                    // Auto-open right sidebar when selecting a tab
                    state.rightSidebarOpen = true;
                });
            },

            // Tool actions
            setActiveTool: (tool) => {
                set((state) => {
                    state.activeTool = tool;
                });
            },

            // Theme actions
            setTheme: (theme) => {
                set((state) => {
                    state.theme = theme;
                });
            },

            toggleGrid: () => {
                set((state) => {
                    state.gridVisible = !state.gridVisible;
                });
            },

            // Zoom actions
            setZoomLevel: (level) => {
                set((state) => {
                    state.zoomLevel = Math.min(400, Math.max(10, level));
                });
            },

            zoomIn: () => {
                set((state) => {
                    state.zoomLevel = Math.min(400, state.zoomLevel + 10);
                });
            },

            zoomOut: () => {
                set((state) => {
                    state.zoomLevel = Math.max(10, state.zoomLevel - 10);
                });
            },

            resetZoom: () => {
                set((state) => {
                    state.zoomLevel = 100;
                });
            },

            // Modal actions
            openModal: (type, data) => {
                set((state) => {
                    state.modal = { isOpen: true, type, data };
                });
            },

            closeModal: () => {
                set((state) => {
                    state.modal = { isOpen: false };
                });
            },
        })),
        {
            name: 'visual-thinking-ui',
            partialize: (state) => ({
                leftSidebarCollapsed: state.leftSidebarCollapsed,
                rightSidebarOpen: state.rightSidebarOpen,
                rightSidebarTab: state.rightSidebarTab,
                theme: state.theme,
                gridVisible: state.gridVisible,
                zoomLevel: state.zoomLevel,
            }),
        }
    )
);
