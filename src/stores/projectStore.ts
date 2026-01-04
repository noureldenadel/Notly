import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import type { Project, Board } from './types';

interface ProjectState {
    // Data
    projects: Project[];
    boards: Board[];
    activeProjectId: string | null;
    activeBoardId: string | null;

    // Project actions
    createProject: (title: string, description?: string, color?: string) => Project;
    updateProject: (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => void;
    deleteProject: (id: string) => void;
    setActiveProject: (id: string | null) => void;

    // Board actions
    createBoard: (projectId: string, title: string, parentBoardId?: string) => Board;
    updateBoard: (id: string, updates: Partial<Omit<Board, 'id' | 'projectId' | 'createdAt'>>) => void;
    deleteBoard: (id: string) => void;
    setActiveBoard: (id: string | null) => void;
    reorderBoards: (projectId: string, boardIds: string[]) => void;

    // Getters
    getProject: (id: string) => Project | undefined;
    getBoard: (id: string) => Board | undefined;
    getBoardsByProject: (projectId: string) => Board[];
}

export const useProjectStore = create<ProjectState>()(
    immer((set, get) => ({
        // Initial state
        projects: [],
        boards: [],
        activeProjectId: null,
        activeBoardId: null,

        // Project actions
        createProject: (title, description, color) => {
            const now = Date.now();
            const project: Project = {
                id: nanoid(),
                title,
                description,
                color,
                createdAt: now,
                updatedAt: now,
            };
            set((state) => {
                state.projects.push(project);
            });
            return project;
        },

        updateProject: (id, updates) => {
            set((state) => {
                const project = state.projects.find((p) => p.id === id);
                if (project) {
                    Object.assign(project, updates, { updatedAt: Date.now() });
                }
            });
        },

        deleteProject: (id) => {
            set((state) => {
                state.projects = state.projects.filter((p) => p.id !== id);
                state.boards = state.boards.filter((b) => b.projectId !== id);
                if (state.activeProjectId === id) {
                    state.activeProjectId = null;
                    state.activeBoardId = null;
                }
            });
        },

        setActiveProject: (id) => {
            set((state) => {
                state.activeProjectId = id;
                // Auto-select first board of the project
                if (id) {
                    const projectBoards = state.boards
                        .filter((b) => b.projectId === id)
                        .sort((a, b) => a.position - b.position);
                    state.activeBoardId = projectBoards[0]?.id ?? null;
                } else {
                    state.activeBoardId = null;
                }
            });
        },

        // Board actions
        createBoard: (projectId, title, parentBoardId) => {
            const now = Date.now();
            const existingBoards = get().boards.filter((b) => b.projectId === projectId);
            const board: Board = {
                id: nanoid(),
                projectId,
                parentBoardId,
                title,
                position: existingBoards.length,
                createdAt: now,
                updatedAt: now,
            };
            set((state) => {
                state.boards.push(board);
            });
            return board;
        },

        updateBoard: (id, updates) => {
            set((state) => {
                const board = state.boards.find((b) => b.id === id);
                if (board) {
                    Object.assign(board, updates, { updatedAt: Date.now() });
                }
            });
        },

        deleteBoard: (id) => {
            set((state) => {
                state.boards = state.boards.filter((b) => b.id !== id);
                if (state.activeBoardId === id) {
                    state.activeBoardId = null;
                }
            });
        },

        setActiveBoard: (id) => {
            set((state) => {
                state.activeBoardId = id;
            });
        },

        reorderBoards: (projectId, boardIds) => {
            set((state) => {
                boardIds.forEach((id, index) => {
                    const board = state.boards.find((b) => b.id === id && b.projectId === projectId);
                    if (board) {
                        board.position = index;
                        board.updatedAt = Date.now();
                    }
                });
            });
        },

        // Getters
        getProject: (id) => get().projects.find((p) => p.id === id),
        getBoard: (id) => get().boards.find((b) => b.id === id),
        getBoardsByProject: (projectId) =>
            get()
                .boards.filter((b) => b.projectId === projectId)
                .sort((a, b) => a.position - b.position),
    }))
);
