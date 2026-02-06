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
    loadProjects: (force?: boolean) => Promise<void>;

    // Project actions
    createProject: (title: string, description?: string, color?: string) => Promise<Project>;
    updateProject: (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => void;
    deleteProject: (id: string) => void;
    setActiveProject: (id: string | null) => void;

    // Board actions
    createBoard: (projectId: string, title: string, parentBoardId?: string) => Promise<Board>;
    updateBoard: (id: string, updates: Partial<Omit<Board, 'id' | 'projectId' | 'createdAt'>>) => void;
    deleteBoard: (id: string) => void;
    setActiveBoard: (id: string | null) => void;
    reorderBoards: (projectId: string, boardIds: string[]) => void;

    // Getters
    getProject: (id: string) => Project | undefined;
    getBoard: (id: string) => Board | undefined;
    getBoardsByProject: (projectId: string) => Board[];
}

import { persist } from 'zustand/middleware';

export const useProjectStore = create<ProjectState>()(
    persist(
        immer((set, get) => ({
            // Initial state
            projects: [],
            boards: [],
            activeProjectId: null,
            activeBoardId: null,
            isLoaded: false,

            // Load from persistence
            loadProjects: async (force?: boolean) => {
                if (get().isLoaded && !force) return;
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
            createProject: async (title, description, color) => {
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
                    // Automatically switch to new project
                    state.activeProjectId = project.id;
                    state.activeBoardId = null;
                });
                // Await persistence to ensure project exists before boards can reference it
                await saveProjectToPersistence(project);
                return project;
            },

            updateProject: (id, updates) => {
                set((state) => {
                    const project = state.projects.find((p) => p.id === id);
                    if (project) {
                        Object.assign(project, updates, { updatedAt: Date.now() });
                    }
                });
                // Move async call outside set() to avoid Immer proxy issues
                const updatedProject = get().getProject(id);
                if (updatedProject) {
                    saveProjectToPersistence(updatedProject);
                }
            },

            deleteProject: (id) => {
                // Capture project and boards for error recovery
                const projectToDelete = get().getProject(id);
                const boardsToDelete = get().boards.filter((b) => b.projectId === id);

                set((state) => {
                    state.projects = state.projects.filter((p) => p.id !== id);
                    state.boards = state.boards.filter((b) => b.projectId !== id);
                    if (state.activeProjectId === id) {
                        state.activeProjectId = null;
                        state.activeBoardId = null;
                    }
                });

                // Delete from persistence with error recovery
                (async () => {
                    try {
                        const { getPersistence } = await import('@/lib/persistence');
                        const p = await getPersistence();
                        await p.deleteProject(id);
                        for (const board of boardsToDelete) {
                            await p.deleteBoard(board.id);
                        }
                        log.debug('Deleted project:', id);
                    } catch (e) {
                        log.error('Failed to delete project from persistence, restoring:', e);
                        // Restore project and boards on failure
                        if (projectToDelete) {
                            set((state) => {
                                state.projects.push(projectToDelete);
                                boardsToDelete.forEach(b => state.boards.push(b));
                            });
                        }
                    }
                })();
            },

            setActiveProject: (id) => {
                set((state) => {
                    state.activeProjectId = id;
                    // Auto-select first board of the project
                    if (id) {
                        const projectBoards = state.boards
                            .filter((b) => b.projectId === id)
                            .sort((a, b) => a.position - b.position);

                        // If current active board is not in this project, switch
                        if (!state.activeBoardId || !projectBoards.find(b => b.id === state.activeBoardId)) {
                            state.activeBoardId = projectBoards[0]?.id ?? null;
                        }
                    } else {
                        state.activeBoardId = null;
                    }
                });
            },

            // Board actions
            createBoard: async (projectId, title, parentBoardId) => {
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
                    // Automatically switch to new board
                    state.activeBoardId = board.id;
                });
                // Await persistence to ensure board exists before canvas can save snapshots
                await saveBoardToPersistence(board);
                return board;
            },

            updateBoard: (id, updates) => {
                set((state) => {
                    const board = state.boards.find((b) => b.id === id);
                    if (board) {
                        Object.assign(board, updates, { updatedAt: Date.now() });
                    }
                });
                // Move async call outside set() to avoid Immer proxy issues
                const updatedBoard = get().getBoard(id);
                if (updatedBoard) {
                    saveBoardToPersistence(updatedBoard);
                }
            },

            deleteBoard: (id) => {
                // Capture board for error recovery
                const boardToDelete = get().getBoard(id);
                let newBoardCreated: Board | null = null;

                set((state) => {
                    const stateBoard = state.boards.find((b) => b.id === id);
                    if (!stateBoard) return;

                    const projectId = stateBoard.projectId;
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
                        state.activeBoardId = newBoard.id;
                        newBoardCreated = newBoard;
                    } else if (state.activeBoardId === id) {
                        const nextBoard = projectBoards.find(b => b.id !== id);
                        if (nextBoard) {
                            state.activeBoardId = nextBoard.id;
                        }
                    }

                    state.boards = state.boards.filter((b) => b.id !== id);
                });

                // Save new board outside set() if created
                if (newBoardCreated) {
                    saveBoardToPersistence(newBoardCreated);
                }

                // Delete from persistence with error recovery
                (async () => {
                    try {
                        const { getPersistence } = await import('@/lib/persistence');
                        const p = await getPersistence();
                        await p.deleteBoard(id);
                        log.debug('Deleted board:', id);
                    } catch (e) {
                        log.error('Failed to delete board from persistence, restoring:', e);
                        if (boardToDelete) {
                            set((state) => {
                                state.boards.push(boardToDelete);
                            });
                        }
                    }
                })();
            },

            setActiveBoard: (id) => {
                set((state) => {
                    state.activeBoardId = id;
                });
            },

            reorderBoards: (projectId: string, boardIds: string[]) => {
                set((state) => {
                    boardIds.forEach((id, index) => {
                        const board = state.boards.find((b) => b.id === id && b.projectId === projectId);
                        if (board) {
                            board.position = index;
                            board.updatedAt = Date.now();
                        }
                    });
                });
                // Persist all reordered boards outside set()
                boardIds.forEach((id) => {
                    const board = get().getBoard(id);
                    if (board) {
                        saveBoardToPersistence(board);
                    }
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
        })),
        {
            name: 'visual-thinking-project-session',
            partialize: (state) => ({
                activeProjectId: state.activeProjectId,
                activeBoardId: state.activeBoardId,
            }),
        }
    )
);

