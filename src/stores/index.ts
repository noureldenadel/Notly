// Store barrel exports
export { useProjectStore } from './projectStore';
export { useCanvasStore } from './canvasStore';
export { useCardStore } from './cardStore';
export { useFileStore } from './fileStore';
export { useSearchStore } from './searchStore';
export { useUIStore } from './uiStore';
export { useSyncStore } from './syncStore';
export { usePDFStore } from './pdfStore';
export { useSettingsStore, useAppearanceSettings, useBehaviorSettings, useBackupSettings } from './settingsStore';
export { useBackupStore, formatBackupSize } from './backupStore';
export { usePresentationStore } from './presentationStore';
export { useFavoritesStore, useFavorites, useRecents } from './favoritesStore';
export type { Favorite as FavoriteItem, RecentItem, FavoriteType } from './favoritesStore';
export { useLinkStore, useLinksFrom, useBacklinks, extractWikiLinks, processWikiLinks } from './linkStore';
export type { Link as CardLink, LinkType } from './linkStore';
export { useJournalStore, useCurrentJournalEntry, useJournalDate, getTodayDate, formatJournalDate } from './journalStore';
export type { JournalEntry } from './journalStore';


// Type exports
export type {
    Project,
    Board,
    Card,
    CanvasElement,
    FileEntry,
    Highlight,
    Tag,
    TagRelation,
    Link,
    Favorite,
    SearchResult,
    UIState,
} from './types';
