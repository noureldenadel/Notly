import { useEffect, useState } from "react";
import { useEditor } from "@/hooks/useEditorContext";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DefaultColorStyle, DefaultSizeStyle } from "tldraw";
import { useAppearanceSettings } from "@/stores/settingsStore";
import { Square, Menu } from "lucide-react";

// Tool settings colors (matching Tldraw's palette)
const DRAW_COLORS = [
    { id: 'black', value: 'currentColor', label: 'Black' },
    { id: 'grey', value: '#adb5bd', label: 'Grey' },
    { id: 'light-violet', value: '#e599f7', label: 'Light Violet' },
    { id: 'violet', value: '#ae3ec9', label: 'Violet' },
    { id: 'blue', value: '#4dabf7', label: 'Blue' },
    { id: 'light-blue', value: '#74c0fc', label: 'Light Blue' },
    { id: 'yellow', value: '#ffd43b', label: 'Yellow' },
    { id: 'orange', value: '#ff922b', label: 'Orange' },
    { id: 'red', value: '#ff6b6b', label: 'Red' },
    { id: 'light-red', value: '#ffa8a8', label: 'Light Red' },
    { id: 'green', value: '#51cf66', label: 'Green' },
    { id: 'light-green', value: '#8ce99a', label: 'Light Green' },
];

interface ToolSettingsPanelProps {
    activeTool: string;
    drawToolClickCount: number;
}

export const ToolSettingsPanel = ({ activeTool, drawToolClickCount }: ToolSettingsPanelProps) => {
    const { editor } = useEditor();
    const { theme } = useAppearanceSettings();
    const [isVisible, setIsVisible] = useState(false);
    const [isHiding, setIsHiding] = useState(false);
    const [strokeWidth, setStrokeWidth] = useState(4);
    const [selectedColor, setSelectedColor] = useState('black');
    const [strokePopoverOpen, setStrokePopoverOpen] = useState(false);
    const [colorPopoverOpen, setColorPopoverOpen] = useState(false);

    // Show panel when draw tool is active
    useEffect(() => {
        if (activeTool === 'draw') {
            setIsVisible(true);
        } else {
            setIsVisible(false);
            // Close popovers when switching tools
            setStrokePopoverOpen(false);
            setColorPopoverOpen(false);
        }
    }, [activeTool]);

    // Re-show panel when draw tool is clicked again
    useEffect(() => {
        if (activeTool === 'draw' && drawToolClickCount > 0) {
            setIsVisible(true);
        }
    }, [drawToolClickCount, activeTool]);

    // Hide panel when user starts drawing (clicks on canvas)
    useEffect(() => {
        if (!editor || activeTool !== 'draw') return;

        const handlePointerDown = (e: PointerEvent) => {
            // Only hide if clicking on the canvas itself, not on the settings panel
            const target = e.target as HTMLElement;
            if (target.closest('[data-tool-settings]')) {
                return; // Don't hide if clicking within the settings panel
            }

            // Close any open popovers
            setStrokePopoverOpen(false);
            setColorPopoverOpen(false);

            // Trigger hide animation
            setIsHiding(true);
            setTimeout(() => {
                setIsVisible(false);
                setIsHiding(false);
            }, 200); // Match animation duration
        };

        // Listen for pointer down on the canvas
        const container = editor.getContainer();
        container.addEventListener('pointerdown', handlePointerDown);

        return () => {
            container.removeEventListener('pointerdown', handlePointerDown);
        };
    }, [editor, activeTool]);

    // Update stroke width using the correct Tldraw API
    const handleStrokeWidthChange = (value: number[]) => {
        const newWidth = value[0];
        setStrokeWidth(newWidth);

        if (!editor) return;

        // Map pixel width to Tldraw's size style values
        let tldrawSize: 's' | 'm' | 'l' | 'xl' = 's';
        if (newWidth <= 2) tldrawSize = 's';
        else if (newWidth <= 7) tldrawSize = 'm';
        else if (newWidth <= 13) tldrawSize = 'l';
        else tldrawSize = 'xl';

        try {
            // Set default style for next shapes - this sets it for the draw tool
            editor.setStyleForNextShapes(DefaultSizeStyle, tldrawSize);
        } catch (error) {
            console.error('Error setting stroke width:', error);
        }
    };

    // Update color
    const handleColorChange = (colorId: string) => {
        setSelectedColor(colorId);

        if (!editor) return;

        try {
            // Set default color for next shapes
            editor.setStyleForNextShapes(DefaultColorStyle, colorId);
        } catch (error) {
            console.error('Error setting color:', error);
        }
    };

    if (!isVisible && !isHiding) return null;

    return (
        <div
            className={cn(
                "absolute bottom-[72px] left-1/2 z-40 transition-all duration-200",
                isHiding
                    ? "opacity-0 scale-50"
                    : "opacity-100 scale-100"
            )}
            data-tool-settings
            style={{
                transform: 'translateX(calc(-50% - 190px))',
                transformOrigin: '50% 100%' // Animate from center bottom (toward draw button)
            }}
        >
            <div className="flex items-center gap-0.5 p-1.5 bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]">
                {/* Stroke Width Popover */}
                <Popover open={strokePopoverOpen} onOpenChange={setStrokePopoverOpen}>
                    <PopoverTrigger asChild>
                        <button
                            className={cn(
                                "w-9 h-9 flex items-center justify-center rounded-md transition-colors hover:bg-accent",
                                strokePopoverOpen && "bg-accent"
                            )}
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3" side="top" align="center">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Stroke Width</label>
                            <div className="flex items-center gap-3">
                                <Slider
                                    value={[strokeWidth]}
                                    onValueChange={handleStrokeWidthChange}
                                    min={1}
                                    max={16}
                                    step={1}
                                    className="flex-1"
                                />
                                <span className="text-xs font-mono text-muted-foreground w-8 text-right">
                                    {strokeWidth}px
                                </span>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Color Popover */}
                <Popover open={colorPopoverOpen} onOpenChange={setColorPopoverOpen}>
                    <PopoverTrigger asChild>
                        <button
                            className={cn(
                                "w-9 h-9 flex items-center justify-center rounded-md transition-colors hover:bg-accent",
                                colorPopoverOpen && "bg-accent"
                            )}
                        >
                            <Square
                                className="w-5 h-5"
                                fill={DRAW_COLORS.find(c => c.id === selectedColor)?.value}
                                stroke={DRAW_COLORS.find(c => c.id === selectedColor)?.value}
                            />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2" side="top" align="center">
                        <div className="grid grid-cols-4 gap-1.5">
                            {DRAW_COLORS.map((color) => {
                                // Dynamic label for adaptive color
                                let label = color.label;
                                if (color.id === 'black') {
                                    if (theme === 'dark') label = 'White';
                                    else if (theme === 'light') label = 'Black';
                                    else label = 'Auto'; // System
                                }

                                return (
                                    <Tooltip key={color.id}>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={() => {
                                                    handleColorChange(color.id);
                                                    setColorPopoverOpen(false);
                                                }}
                                                className={cn(
                                                    "w-8 h-8 rounded-md border-2 transition-all hover:scale-110",
                                                    selectedColor === color.id
                                                        ? "border-primary ring-2 ring-primary/30"
                                                        : "border-transparent hover:border-muted"
                                                )}
                                                style={{ backgroundColor: color.value }}
                                                aria-label={label}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            <span className="text-xs">{label}</span>
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            })}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
};
