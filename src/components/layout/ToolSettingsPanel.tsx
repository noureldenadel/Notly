import { useEffect, useState } from "react";
import { useEditor } from "@/hooks/useEditorContext";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DefaultColorStyle, DefaultSizeStyle } from "tldraw";

// Tool settings colors (matching Tldraw's palette)
const DRAW_COLORS = [
    { id: 'black', value: '#1d1d1d', label: 'Black' },
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
}

export const ToolSettingsPanel = ({ activeTool }: ToolSettingsPanelProps) => {
    const { editor } = useEditor();
    const [isVisible, setIsVisible] = useState(false);
    const [strokeWidth, setStrokeWidth] = useState(4);
    const [selectedColor, setSelectedColor] = useState('black');

    // Show panel only when draw tool is active
    useEffect(() => {
        setIsVisible(activeTool === 'draw');
    }, [activeTool]);

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

    if (!isVisible) return null;

    return (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-4 px-4 py-3 bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-lg">
                {/* Stroke Width Control */}
                <div className="flex items-center gap-3 min-w-[200px]">
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                        Stroke Width
                    </span>
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

                {/* Separator */}
                <div className="h-8 w-px bg-border" />

                {/* Color Picker */}
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                        Color
                    </span>
                    <div className="flex items-center gap-1">
                        {DRAW_COLORS.map((color) => (
                            <Tooltip key={color.id}>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => handleColorChange(color.id)}
                                        className={cn(
                                            "w-6 h-6 rounded border-2 transition-all hover:scale-110",
                                            selectedColor === color.id
                                                ? "border-primary ring-2 ring-primary/30"
                                                : "border-transparent hover:border-muted"
                                        )}
                                        style={{ backgroundColor: color.value }}
                                        aria-label={color.label}
                                    />
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                    <span className="text-xs">{color.label}</span>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
