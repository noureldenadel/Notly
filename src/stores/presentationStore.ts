import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface PresentationState {
    isPresenting: boolean;
    currentFrameIndex: number;
    frames: string[]; // Frame shape IDs in order
    laserEnabled: boolean;
    laserColor: string;

    // Actions
    startPresentation: (frameIds: string[]) => void;
    exitPresentation: () => void;
    nextFrame: () => void;
    previousFrame: () => void;
    goToFrame: (index: number) => void;
    toggleLaser: () => void;
    setLaserColor: (color: string) => void;
}

export const usePresentationStore = create<PresentationState>()(
    immer((set, get) => ({
        isPresenting: false,
        currentFrameIndex: 0,
        frames: [],
        laserEnabled: false,
        laserColor: '#ff0000',

        startPresentation: (frameIds: string[]) => {
            if (frameIds.length === 0) {
                console.warn('No frames to present');
                return;
            }
            set((state) => {
                state.isPresenting = true;
                state.frames = frameIds;
                state.currentFrameIndex = 0;
            });
        },

        exitPresentation: () => {
            set((state) => {
                state.isPresenting = false;
                state.currentFrameIndex = 0;
                state.frames = [];
                state.laserEnabled = false;
            });
        },

        nextFrame: () => {
            const { currentFrameIndex, frames } = get();
            if (currentFrameIndex < frames.length - 1) {
                set((state) => {
                    state.currentFrameIndex = currentFrameIndex + 1;
                });
            }
        },

        previousFrame: () => {
            const { currentFrameIndex } = get();
            if (currentFrameIndex > 0) {
                set((state) => {
                    state.currentFrameIndex = currentFrameIndex - 1;
                });
            }
        },

        goToFrame: (index: number) => {
            const { frames } = get();
            if (index >= 0 && index < frames.length) {
                set((state) => {
                    state.currentFrameIndex = index;
                });
            }
        },

        toggleLaser: () => {
            set((state) => {
                state.laserEnabled = !state.laserEnabled;
            });
        },

        setLaserColor: (color: string) => {
            set((state) => {
                state.laserColor = color;
            });
        },
    }))
);
