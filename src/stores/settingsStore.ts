import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';

// Backup configuration
export interface BackupConfig {
    enabled: boolean;
    intervalMinutes: number;
    maxBackups: number;
}

// Appearance settings
export interface AppearanceSettings {
    theme: 'light' | 'dark' | 'system';
    canvasBackground: string;
    defaultCardColor: string;
    gridType: 'none' | 'dotted' | 'lined';
}

// Behavior settings
export interface BehaviorSettings {
    autoSaveInterval: number; // seconds
    defaultCardWidth: number;
    defaultCardHeight: number;
    doubleClickAction: 'inline' | 'popup';
    zoomSensitivity: number; // 0.1 to 2.0
}

// Full settings state
interface SettingsState {
    appearance: AppearanceSettings;
    behavior: BehaviorSettings;
    backup: BackupConfig;

    // Actions
    updateAppearance: (settings: Partial<AppearanceSettings>) => void;
    updateBehavior: (settings: Partial<BehaviorSettings>) => void;
    updateBackup: (settings: Partial<BackupConfig>) => void;
    resetToDefaults: () => void;
}

// Default values
const defaultAppearance: AppearanceSettings = {
    theme: 'dark',
    canvasBackground: '#1a1a2e',
    defaultCardColor: 'highlight-blue',
    gridType: 'dotted',
};

const defaultBehavior: BehaviorSettings = {
    autoSaveInterval: 30, // 30 seconds
    defaultCardWidth: 280,
    defaultCardHeight: 160,
    doubleClickAction: 'popup',
    zoomSensitivity: 1.0,
};

const defaultBackup: BackupConfig = {
    enabled: true,
    intervalMinutes: 30,
    maxBackups: 10,
};

export const useSettingsStore = create<SettingsState>()(
    persist(
        immer((set) => ({
            appearance: { ...defaultAppearance },
            behavior: { ...defaultBehavior },
            backup: { ...defaultBackup },

            updateAppearance: (settings) => {
                set((state) => {
                    Object.assign(state.appearance, settings);
                });
            },

            updateBehavior: (settings) => {
                set((state) => {
                    Object.assign(state.behavior, settings);
                });
            },

            updateBackup: (settings) => {
                set((state) => {
                    Object.assign(state.backup, settings);
                });
            },

            resetToDefaults: () => {
                set((state) => {
                    state.appearance = { ...defaultAppearance };
                    state.behavior = { ...defaultBehavior };
                    state.backup = { ...defaultBackup };
                });
            },
        })),
        {
            name: 'visual-thinking-settings',
        }
    )
);

// Selector hooks for optimized re-renders
export const useAppearanceSettings = () => useSettingsStore((state) => state.appearance);
export const useBehaviorSettings = () => useSettingsStore((state) => state.behavior);
export const useBackupSettings = () => useSettingsStore((state) => state.backup);
