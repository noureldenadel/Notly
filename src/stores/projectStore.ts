import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import type { Project, Board } from './types';
import type { Project as PProject, Board as PBoard } from '@/lib/persistence/types';
import { createLogger } from '@/lib/logger';

const log = createLogger('ProjectStore');

// Helper to save project to persistence
async function saveProjectToPersistence(project: Project) {
    try {
        const { getPersistence } = await import('@/lib/persistence');
        const p = await getPersistence();
        await p.saveProject({
            id: project.id,
            title: project.title,
            description: project.description,
            thumbnailPath: project.thumbnailPath,
            color: project.color,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
        });
        log.debug('Saved project:', project.id);
    } catch (e) {
        log.error('Error saving project:', e);
    }
}

// Helper to save board to persistence
async function saveBoardToPersistence(board: Board) {
    try {
        const { getPersistence } = await import('@/lib/persistence');
        const p = await getPersistence();
        await p.saveBoard({
            id: board.id,
            projectId: board.projectId,
            parentBoardId: board.parentBoardId,
            title: board.title,
            position: board.position,
            createdAt: board.createdAt,
            updatedAt: board.updatedAt,
        });
        log.debug('Saved board:', board.id);
    } catch (e) {
        log.error('Error saving board:', e);
    }
}

interface ProjectState {
    // Data
    projects: Project[];
    boards: Board[];
    activeProjectId: string | null;
    activeBoardId: string | null;
    isLoaded: boolean;

    // Load from persistence
    loadProjects: () => Promise<void>;

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
        isLoaded: false,

        // Load from persistence
        loadProjects: async () => {
            if (get().isLoaded) return;
            try {
                const { getPersistence } = await import('@/lib/persistence');
                const p = await getPersistence();
                const [projects, boards] = await Promise.all([
                    p.getProjects(),
                    p.getBoards(),
                ]);
                set((state) => {
                    state.projects = projects.map((proj: PProject) => ({
                        id: proj.id,
                        title: proj.title,
                        description: proj.description,
                        thumbnailPath: proj.thumbnailPath,
                        color: proj.color,
                        createdAt: proj.createdAt,
                        updatedAt: proj.updatedAt,
                    }));
                    state.boards = boards.map((b: PBoard) => ({
                        id: b.id,
                        projectId: b.projectId,
                        parentBoardId: b.parentBoardId,
                        title: b.title,
                        position: b.position,
                        createdAt: b.createdAt,
                        updatedAt: b.updatedAt,
                    }));
                    state.isLoaded = true;
                });
                log.debug('Loaded', projects.length, 'projects and', boards.length, 'boards');
            } catch (e) {
                log.error('Error loading projects:', e);
                set((state) => { state.isLoaded = true; });
            }
        },

        // Project actions
        // Project actions
        createProject: (title, description, color) => {
            const now = Date.now();

            // Random color if not provided
            let finalColor = color;
            if (!finalColor) {
                const colors = [
                    'highlight-blue',
                    'highlight-purple',
                    'highlight-green',
                    'highlight-yellow',
                    'highlight-pink',
                    'highlight-orange'
                ];
                finalColor = colors[Math.floor(Math.random() * colors.length)];
            }

            const project: Project = {
                id: nanoid(),
                title,
                description,
                color: finalColor,
                createdAt: now,
                updatedAt: now,
            };
            set((state) => {
                state.projects.push(project);
            });
            saveProjectToPersistence(project);
            return project;
        },

        updateProject: (id, updates) => {
            set((state) => {
                const project = state.projects.find((p) => p.id === id);
                if (project) {
                    Object.assign(project, updates, { updatedAt: Date.now() });
                    // Clone the project to avoid Immer proxy revocation in async function
                    const projectClone = { ...project };
                    saveProjectToPersistence(projectClone);
                }
            });
        },

        deleteProject: (id) => {
            set((state) => {
                state.projects = state.projects.filter((p) => p.id !== id);
                const boardsToDelete = state.boards.filter((b) => b.projectId === id);
                state.boards = state.boards.filter((b) => b.projectId !== id);
                if (state.activeProjectId === id) {
                    state.activeProjectId = null;
                    state.activeBoardId = null;
                }
                // Delete from persistence
                (async () => {
                    const { getPersistence } = await import('@/lib/persistence');
                    const p = await getPersistence();
                    await p.deleteProject(id);
                    for (const board of boardsToDelete) {
                        await p.deleteBoard(board.id);
                    }
                })();
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
            saveBoardToPersistence(board);
            return board;
        },

        updateBoard: (id, updates) => {
            set((state) => {
                const board = state.boards.find((b) => b.id === id);
                if (board) {
                    Object.assign(board, updates, { updatedAt: Date.now() });
                    // Clone to avoid Immer proxy revocation
                    const boardClone = { ...board };
                    saveBoardToPersistence(boardClone);
                }
            });
        },

        deleteBoard: (id) => {
            set((state) => {
                const boardToDelete = state.boards.find((b) => b.id === id);
                if (!boardToDelete) return;

                const projectId = boardToDelete.projectId;
                const projectBoards = state.boards.filter((b) => b.projectId === projectId);

                // Safety check: Is this the last board?
                if (projectBoards.length <= 1) {
                    // Create a new fresh board before deleting the last one
                    const now = Date.now();
                    const newBoard: Board = {
                        id: nanoid(),
                        projectId,
                        title: 'New Board',
                        position: 0,
                        createdAt: now,
                        updatedAt: now,
                    };
                    state.boards.push(newBoard);

                    // Switch to new board
                    state.activeBoardId = newBoard.id;

                    // Save new board
                    saveBoardToPersistence(newBoard);
                } else if (state.activeBoardId === id) {
                    // If deleting the active board, switch to another one (e.g. the first available that isn't the one being deleted)
                    const nextBoard = projectBoards.find(b => b.id !== id);
                    if (nextBoard) {
                        state.activeBoardId = nextBoard.id;
                    }
                }

                // Delete the target board
                state.boards = state.boards.filter((b) => b.id !== id);
            });

            // Delete from persistence
            (async () => {
                const { getPersistence } = await import('@/lib/persistence');
                const p = await getPersistence();
                await p.deleteBoard(id);
            })();
        },

        setActiveBoard: (id) => {
            set((state) => {
                state.activeBoardId = id;
            });
        },

        reorderBoards: (projectId: string, boardIds: string[]) => {
            set((state) => {
                // Update position for each board in the list
                boardIds.forEach((id, index) => {
                    const board = state.boards.find((b) => b.id === id && b.projectId === projectId);
                    if (board) {
                        board.position = index;
                        board.updatedAt = Date.now();
                        // Clone to avoid Immer proxy revocation issues with async calls
                        const boardClone = { ...board };
                        // Persist change
                        saveBoardToPersistence(boardClone);
                    }
                });
            });
            log.debug('Boards reordered for project:', projectId);
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
