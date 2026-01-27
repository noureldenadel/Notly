import { useEffect, useState } from "react";
import { useEditor } from "@/hooks/useEditorContext";
import {
    AlignLeft,
    AlignCenter,
    AlignRight,
    ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Available fonts
const FONTS = [
    { id: 'sans', label: 'Sans Serif' },
    { id: 'serif', label: 'Serif' },
    { id: 'mono', label: 'Monospace' },
    { id: 'draw', label: 'Draw' },
];

// Font sizes
const FONT_SIZES = [
    { value: 's', label: 'Small' },
    { value: 'm', label: 'Medium' },
    { value: 'l', label: 'Large' },
    { value: 'xl', label: 'Extra Large' },
];

// Text colors (matching Tldraw's palette)
const TEXT_COLORS = [
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

export const TextFormattingToolbar = () => {
    const { editor } = useEditor();
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [selectedFont, setSelectedFont] = useState('sans');
    const [selectedSize, setSelectedSize] = useState('m');
    const [selectedTextAlign, setSelectedTextAlign] = useState('start');
    const [selectedTextColor, setSelectedTextColor] = useState('black');
    const [selectedFillColor, setSelectedFillColor] = useState('yellow'); // Default for notes
    const [isNote, setIsNote] = useState(false);

    // Monitor selection changes
    useEffect(() => {
        if (!editor) return;

        const updateToolbar = () => {
            const selectedShapes = editor.getSelectedShapes();

            // Show for single text or note shape selection
            const targetShapes = selectedShapes.filter((shape: any) => shape.type === 'text' || shape.type === 'note');

            if (targetShapes.length === 1) {
                const shape = targetShapes[0] as any;
                setIsVisible(true);
                setIsNote(shape.type === 'note');

                // Update current values from the selected shape
                if (shape.props) {
                    setSelectedFont(shape.props.font || 'sans');
                    setSelectedSize(shape.props.size || 'm');

                    // Map properties based on shape type
                    if (shape.type === 'note') {
                        setSelectedTextAlign(shape.props.align || 'middle');
                        setSelectedTextColor(shape.props.labelColor || 'black'); // Text color for note
                        setSelectedFillColor(shape.props.color || 'yellow');     // Fill color for note
                    } else {
                        setSelectedTextAlign(shape.props.textAlign || 'start');
                        setSelectedTextColor(shape.props.color || 'black');      // Text color for text
                        setSelectedFillColor('transparent'); // No fill for text
                    }
                }

                // Calculate position above the shape
                try {
                    const bounds = editor.getShapePageBounds(shape.id);
                    if (bounds) {
                        const viewport = editor.getViewportScreenBounds();
                        const zoom = editor.getZoomLevel();

                        // Convert page coordinates to screen coordinates
                        const screenX = (bounds.x - viewport.x) * zoom;
                        const screenY = (bounds.y - viewport.y) * zoom;

                        setPosition({
                            top: screenY - 60, // 60px above the shape
                            left: screenX + (bounds.width * zoom) / 2,
                        });
                    }
                } catch (error) {
                    console.error('Error calculating toolbar position:', error);
                }
            } else {
                setIsVisible(false);
            }
        };

        // Update on selection change
        const unsubscribe = editor.store.listen(() => {
            updateToolbar();
        }, { scope: 'all' });

        updateToolbar();

        return () => {
            unsubscribe();
        };
    }, [editor]);

    // Update font
    const handleFontChange = (font: string) => {
        if (!editor) return;
        const selectedShapes = editor.getSelectedShapes();
        const textShapes = selectedShapes.filter((shape: any) => shape.type === 'text');

        textShapes.forEach((shape) => {
            editor.updateShape({
                id: shape.id,
                type: shape.type,
                props: { font },
            });
        });

        setSelectedFont(font);
    };

    // Update size
    const handleSizeChange = (size: string) => {
        if (!editor) return;
        const selectedShapes = editor.getSelectedShapes();
        const textShapes = selectedShapes.filter((shape: any) => shape.type === 'text');

        textShapes.forEach((shape) => {
            editor.updateShape({
                id: shape.id,
                type: shape.type,
                props: { size },
            });
        });

        setSelectedSize(size);
    };

    // Update alignment
    const handleTextAlignChange = (align: string) => {
        if (!editor) return;
        const selectedShapes = editor.getSelectedShapes();
        const targetShapes = selectedShapes.filter((shape: any) => shape.type === 'text' || shape.type === 'note');

        targetShapes.forEach((shape) => {
            const propName = shape.type === 'note' ? 'align' : 'textAlign';
            editor.updateShape({
                id: shape.id,
                type: shape.type,
                props: { [propName]: align },
            });
        });

        setSelectedTextAlign(align);
    };

    // Update text color
    const handleTextColorChange = (color: string) => {
        if (!editor) return;
        const selectedShapes = editor.getSelectedShapes();
        const targetShapes = selectedShapes.filter((shape: any) => shape.type === 'text' || shape.type === 'note');

        targetShapes.forEach((shape) => {
            const propName = shape.type === 'note' ? 'labelColor' : 'color';
            editor.updateShape({
                id: shape.id,
                type: shape.type,
                props: { [propName]: color },
            });
        });

        setSelectedTextColor(color);
    };

    // Update fill color (only for notes)
    const handleFillColorChange = (color: string) => {
        if (!editor) return;
        const selectedShapes = editor.getSelectedShapes();
        const noteShapes = selectedShapes.filter((shape: any) => shape.type === 'note');

        noteShapes.forEach((shape) => {
            editor.updateShape({
                id: shape.id,
                type: shape.type,
                props: { color }, // 'color' is fill for notes
            });
        });

        setSelectedFillColor(color);
    };

    if (!isVisible) return null;

    return (
        <div
            className="fixed z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                transform: 'translateX(-50%)',
            }}
        >
            <div className="flex items-center gap-2 px-3 py-2 bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-lg">
                {/* Font Family */}
                <Select value={selectedFont} onValueChange={handleFontChange}>
                    <SelectTrigger className="w-[130px] h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {FONTS.map((font) => (
                            <SelectItem key={font.id} value={font.id} className="text-xs">
                                {font.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Font Size */}
                <Select value={selectedSize} onValueChange={handleSizeChange}>
                    <SelectTrigger className="w-[100px] h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {FONT_SIZES.map((size) => (
                            <SelectItem key={size.value} value={size.value} className="text-xs">
                                {size.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Separator */}
                <div className="h-6 w-px bg-border" />

                {/* Text Alignment */}
                <div className="flex items-center gap-0.5">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "w-8 h-8",
                                    selectedTextAlign === 'start' && "bg-accent"
                                )}
                                onClick={() => handleTextAlignChange('start')}
                            >
                                <AlignLeft className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><span className="text-xs">Align Left</span></TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "w-8 h-8",
                                    selectedTextAlign === 'middle' && "bg-accent"
                                )}
                                onClick={() => handleTextAlignChange('middle')}
                            >
                                <AlignCenter className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><span className="text-xs">Align Center</span></TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "w-8 h-8",
                                    selectedTextAlign === 'end' && "bg-accent"
                                )}
                                onClick={() => handleTextAlignChange('end')}
                            >
                                <AlignRight className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><span className="text-xs">Align Right</span></TooltipContent>
                    </Tooltip>
                </div>

                {/* Separator */}
                <div className="h-6 w-px bg-border" />

                {/* Text Color Picker */}
                <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase text-muted-foreground mr-1">Text</span>
                    {TEXT_COLORS.slice(0, 8).map((color) => (
                        <Tooltip key={color.id}>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => handleTextColorChange(color.id)}
                                    className={cn(
                                        "w-5 h-5 rounded-full border transition-all hover:scale-110",
                                        selectedTextColor === color.id
                                            ? "border-primary ring-1 ring-primary"
                                            : "border-transparent hover:border-muted-foreground/20"
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

                {/* Fill Color Picker (Notes only) */}
                {isNote && (
                    <>
                        <div className="h-6 w-px bg-border mx-1" />
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] uppercase text-muted-foreground mr-1">Fill</span>
                            {TEXT_COLORS.slice(0, 8).map((color) => (
                                <Tooltip key={'fill-' + color.id}>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => handleFillColorChange(color.id)}
                                            className={cn(
                                                "w-5 h-5 rounded-sm border transition-all hover:scale-110",
                                                selectedFillColor === color.id
                                                    ? "border-primary ring-1 ring-primary"
                                                    : "border-transparent hover:border-muted-foreground/20"
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
                    </>
                )}
            </div>
        </div>
    );
};
