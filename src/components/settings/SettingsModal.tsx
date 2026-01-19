import { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Palette,
    Settings2,
    Archive,
    Keyboard,
    Trash2,
    RotateCcw,
    Download,
    RefreshCw,
} from 'lucide-react';
import {
    useSettingsStore,
    useBackupStore,
    formatBackupSize,
} from '@/stores';
import type { AppearanceSettings, BehaviorSettings, BackupConfig } from '@/stores/settingsStore';

interface SettingsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}



export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
    const [activeTab, setActiveTab] = useState('appearance');

    const { appearance, behavior, backup, updateAppearance, updateBehavior, updateBackup, resetToDefaults } = useSettingsStore();
    const { backups, lastBackupTime, createBackup, restoreBackup, deleteBackup, clearOldBackups } = useBackupStore();

    // Auto-cleanup old backups when settings change
    useEffect(() => {
        clearOldBackups(backup.maxBackups);
    }, [backup.maxBackups, clearOldBackups]);

    const handleCreateBackup = useCallback(() => {
        createBackup();
    }, [createBackup]);

    const handleRestoreBackup = useCallback((backupId: string) => {
        const restored = restoreBackup(backupId);
        if (restored) {
            // Reload to apply restored settings
            window.location.reload();
        }
    }, [restoreBackup]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] h-[600px] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings2 className="w-5 h-5" />
                        Settings
                    </DialogTitle>
                    <DialogDescription>
                        Configure your Visual Thinking workspace
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="appearance" className="flex items-center gap-1">
                            <Palette className="w-4 h-4" />
                            <span className="hidden sm:inline">Appearance</span>
                        </TabsTrigger>
                        <TabsTrigger value="behavior" className="flex items-center gap-1">
                            <Settings2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Behavior</span>
                        </TabsTrigger>
                        <TabsTrigger value="backups" className="flex items-center gap-1">
                            <Archive className="w-4 h-4" />
                            <span className="hidden sm:inline">Backups</span>
                        </TabsTrigger>
                        <TabsTrigger value="shortcuts" className="flex items-center gap-1">
                            <Keyboard className="w-4 h-4" />
                            <span className="hidden sm:inline">Shortcuts</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Appearance Tab */}
                    {/* Appearance Tab */}
                    <TabsContent value="appearance" className="flex-1 overflow-hidden mt-2">
                        <ScrollArea className="h-full pr-4">
                            <div className="space-y-4 pb-4">
                                {/* Theme */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Theme</Label>
                                        <p className="text-sm text-muted-foreground">Select your preferred theme</p>
                                    </div>
                                    <Select
                                        value={appearance.theme}
                                        onValueChange={(value: AppearanceSettings['theme']) =>
                                            updateAppearance({ theme: value })
                                        }
                                    >
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="light">Light</SelectItem>
                                            <SelectItem value="dark">Dark</SelectItem>
                                            <SelectItem value="system">System</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Separator />

                                {/* Show Grid */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Show Grid</Label>
                                        <p className="text-sm text-muted-foreground">Display canvas grid</p>
                                    </div>
                                    <Switch
                                        checked={appearance.showGrid}
                                        onCheckedChange={(checked) => updateAppearance({ showGrid: checked })}
                                    />
                                </div>
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    {/* Behavior Tab */}
                    <TabsContent value="behavior" className="flex-1 overflow-hidden mt-2">
                        <ScrollArea className="h-full pr-4">
                            <div className="space-y-4 pb-4">
                                {/* Auto-save Interval */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Auto-save Interval</Label>
                                        <span className="text-sm text-muted-foreground">{behavior.autoSaveInterval}s</span>
                                    </div>
                                    <Slider
                                        value={[behavior.autoSaveInterval]}
                                        onValueChange={([value]) => updateBehavior({ autoSaveInterval: value })}
                                        min={5}
                                        max={120}
                                        step={5}
                                    />
                                </div>

                                <Separator />

                                {/* Double-click Action */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Double-click Action</Label>
                                        <p className="text-sm text-muted-foreground">What happens when you double-click a card</p>
                                    </div>
                                    <Select
                                        value={behavior.doubleClickAction}
                                        onValueChange={(value: BehaviorSettings['doubleClickAction']) =>
                                            updateBehavior({ doubleClickAction: value })
                                        }
                                    >
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="inline">Edit Inline</SelectItem>
                                            <SelectItem value="popup">Open Popup</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Separator />

                                {/* Zoom Sensitivity */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Zoom Sensitivity</Label>
                                        <span className="text-sm text-muted-foreground">{behavior.zoomSensitivity.toFixed(1)}x</span>
                                    </div>
                                    <Slider
                                        value={[behavior.zoomSensitivity * 10]}
                                        onValueChange={([value]) => updateBehavior({ zoomSensitivity: value / 10 })}
                                        min={1}
                                        max={20}
                                        step={1}
                                    />
                                </div>

                                <Separator />

                                {/* Default Card Size */}
                                <div className="space-y-2">
                                    <Label>Default Card Size</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Width</Label>
                                            <Slider
                                                value={[behavior.defaultCardWidth]}
                                                onValueChange={([value]) => updateBehavior({ defaultCardWidth: value })}
                                                min={150}
                                                max={500}
                                                step={10}
                                            />
                                            <span className="text-xs text-muted-foreground">{behavior.defaultCardWidth}px</span>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Height</Label>
                                            <Slider
                                                value={[behavior.defaultCardHeight]}
                                                onValueChange={([value]) => updateBehavior({ defaultCardHeight: value })}
                                                min={100}
                                                max={400}
                                                step={10}
                                            />
                                            <span className="text-xs text-muted-foreground">{behavior.defaultCardHeight}px</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    {/* Backups Tab */}
                    <TabsContent value="backups" className="flex-1 overflow-hidden mt-2">
                        <ScrollArea className="h-full pr-4">
                            <div className="space-y-4 pb-4">
                                {/* Auto-backup Toggle */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Auto Backup</Label>
                                        <p className="text-sm text-muted-foreground">Automatically backup your data</p>
                                    </div>
                                    <Switch
                                        checked={backup.enabled}
                                        onCheckedChange={(checked) => updateBackup({ enabled: checked })}
                                    />
                                </div>

                                {backup.enabled && (
                                    <>
                                        <Separator />

                                        {/* Backup Interval */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label>Backup Interval</Label>
                                                <span className="text-sm text-muted-foreground">{backup.intervalMinutes} min</span>
                                            </div>
                                            <Slider
                                                value={[backup.intervalMinutes]}
                                                onValueChange={([value]) => updateBackup({ intervalMinutes: value })}
                                                min={5}
                                                max={120}
                                                step={5}
                                            />
                                        </div>

                                        <Separator />

                                        {/* Max Backups */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label>Max Backups to Keep</Label>
                                                <span className="text-sm text-muted-foreground">{backup.maxBackups}</span>
                                            </div>
                                            <Slider
                                                value={[backup.maxBackups]}
                                                onValueChange={([value]) => updateBackup({ maxBackups: value })}
                                                min={1}
                                                max={50}
                                                step={1}
                                            />
                                        </div>
                                    </>
                                )}

                                <Separator />

                                {/* Manual Backup */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Create Backup Now</Label>
                                        {lastBackupTime && (
                                            <p className="text-sm text-muted-foreground">
                                                Last backup: {new Date(lastBackupTime).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                    <Button variant="outline" size="sm" onClick={handleCreateBackup}>
                                        <Download className="w-4 h-4 mr-2" />
                                        Backup
                                    </Button>
                                </div>

                                <Separator />

                                {/* Backup List */}
                                <div className="space-y-2">
                                    <Label>Saved Backups ({backups.length})</Label>
                                    <ScrollArea className="h-[150px] rounded-md border p-2">
                                        {backups.length === 0 ? (
                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                No backups yet
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                {backups.map((b) => (
                                                    <div
                                                        key={b.id}
                                                        className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                                                    >
                                                        <div>
                                                            <p className="text-sm font-medium">{b.name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {formatBackupSize(b.size)}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleRestoreBackup(b.id)}
                                                                title="Restore"
                                                            >
                                                                <RotateCcw className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => deleteBackup(b.id)}
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </ScrollArea>
                                </div>
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    {/* Shortcuts Tab */}
                    <TabsContent value="shortcuts" className="flex-1 overflow-hidden mt-2">
                        <ScrollArea className="h-full pr-4">
                            <div className="space-y-3 pb-4">
                                <ShortcutRow keys="Ctrl/⌘ + K" description="Open global search" />
                                <ShortcutRow keys="Ctrl/⌘ + N" description="Create new card" />
                                <ShortcutRow keys="Ctrl/⌘ + S" description="Save/sync changes" />
                                <ShortcutRow keys="Ctrl/⌘ + Z" description="Undo" />
                                <ShortcutRow keys="Ctrl/⌘ + Shift + Z" description="Redo" />
                                <ShortcutRow keys="Ctrl/⌘ + D" description="Duplicate selected" />
                                <ShortcutRow keys="Delete / Backspace" description="Delete selected" />
                                <ShortcutRow keys="Escape" description="Deselect / Close modal" />
                                <ShortcutRow keys="F11 / Ctrl/⌘ + Enter" description="Start presentation" />
                                <ShortcutRow keys="Ctrl/⌘ + ," description="Open settings" />
                                <ShortcutRow keys="?" description="Show shortcuts" />
                                <Separator />
                                <ShortcutRow keys="V" description="Select tool" />
                                <ShortcutRow keys="H" description="Hand/pan tool" />
                                <ShortcutRow keys="D" description="Draw tool" />
                                <ShortcutRow keys="E" description="Eraser tool" />
                                <ShortcutRow keys="A" description="Arrow tool" />
                                <ShortcutRow keys="T" description="Text tool" />
                                <ShortcutRow keys="F" description="Frame tool" />
                                <ShortcutRow keys="C" description="Card tool" />
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>

                {/* Footer */}
                <div className="flex justify-between pt-4 border-t">
                    <Button variant="ghost" onClick={resetToDefaults}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reset to Defaults
                    </Button>
                    <Button onClick={() => onOpenChange(false)}>Done</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Helper component for shortcuts
function ShortcutRow({ keys, description }: { keys: string; description: string }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{description}</span>
            <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded">{keys}</kbd>
        </div>
    );
}

export default SettingsModal;
