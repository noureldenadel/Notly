import { useEffect, useState, useRef } from "react";
import { useEditor } from "@/hooks/useEditorContext";
import {
    AlignLeft,
    AlignCenter,
    AlignRight,
    Type,
    ChevronUp,
    ChevronDown,
    Palette,
    PaintBucket,
    Baseline
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
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

// Base sizes for calculation (approximate pixels for tldraw sizes)
const BASE_SIZES: Record<string, number> = {
    s: 16,
    m: 24,
    l: 32,
    xl: 48,
};

// Text colors
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
    const [currentSize, setCurrentSize] = useState(24);
    const [selectedTextAlign, setSelectedTextAlign] = useState('start');
    const [selectedTextColor, setSelectedTextColor] = useState('black');
    const [selectedFillColor, setSelectedFillColor] = useState('yellow');
    const [isNote, setIsNote] = useState(false);

    // Prevent closing when interacting with input
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!editor) return;

        const updateToolbar = () => {
            // Only show toolbar if using the select tool
            const currentToolId = editor.getCurrentToolId();
            if (currentToolId !== 'select') {
                setIsVisible(false);
                return;
            }

            if (editor.isIn('select.translating') || editor.isIn('select.resizing') || editor.isIn('select.brushing')) {
                setIsVisible(false);
                return;
            }

            const selectedShapes = editor.getSelectedShapes();

            if (selectedShapes.length === 0) {
                setIsVisible(false);
                return;
            }

            // Check if all shapes are of the same type and that type is supported
            const firstType = selectedShapes[0].type;
            const isSupportedType = firstType === 'text' || firstType === 'note';
            const allSameType = selectedShapes.every((shape: any) => shape.type === firstType);

            if (!isSupportedType || !allSameType) {
                setIsVisible(false);
                return;
            }

            const targetShapes = selectedShapes;
            // Use first shape for initial state
            const primaryShape = targetShapes[0] as any;

            // Calculate position based on selection bounds
            try {
                // usage of selection bounds if multiple, or shape bounds if single
                const bounds = targetShapes.length === 1
                    ? editor.getShapePageBounds(primaryShape.id)
                    : editor.getSelectionPageBounds();

                if (bounds) {
                    const camera = editor.getCamera();
                    const zoom = camera.z;
                    const screenX = (bounds.x + camera.x) * zoom;
                    const screenY = (bounds.y + camera.y) * zoom; // Relative to canvas top
                    const headerOffset = 44; // Height of TopBar
                    const actualScreenY = screenY + headerOffset;

                    setPosition({
                        top: actualScreenY - 48,
                        left: screenX + (bounds.width * zoom) / 2,
                    });

                    setIsVisible(true);
                    // Show "Note" specific options if the primary selection is a note
                    setIsNote(primaryShape.type === 'note');

                    // Update state from primary shape
                    if (primaryShape.props) {
                        setSelectedFont(primaryShape.props.font || 'sans');
                        const sizeKey = primaryShape.props.size || 'm';
                        const scale = primaryShape.props.scale ?? 1;
                        const baseSize = BASE_SIZES[sizeKey] || 24;
                        setCurrentSize(Math.round(baseSize * scale));

                        if (primaryShape.type === 'note') {
                            setSelectedTextAlign(primaryShape.props.align || 'middle');
                            setSelectedTextColor(primaryShape.props.labelColor || 'black');
                            setSelectedFillColor(primaryShape.props.color || 'yellow');
                        } else {
                            setSelectedTextAlign(primaryShape.props.textAlign || 'start');
                            setSelectedTextColor(primaryShape.props.color || 'black');
                            setSelectedFillColor('transparent');
                        }
                    }
                } else {
                    setIsVisible(false);
                }
            } catch (error) {
                console.error('Error calculating toolbar position:', error);
                setIsVisible(false);
            }
        };

        const unsubscribe = editor.store.listen(updateToolbar, { scope: 'all' });

        const handlePointerUp = () => requestAnimationFrame(updateToolbar);
        window.addEventListener('pointerup', handlePointerUp);
        updateToolbar();

        return () => {
            unsubscribe();
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [editor]);

    const handleFontChange = (font: string) => {
        if (!editor) return;
        const selectedShapes = editor.getSelectedShapes();
        // Update both text and note shapes if they support font
        const textShapes = selectedShapes.filter((shape: any) => shape.type === 'text' || shape.type === 'note');

        textShapes.forEach((shape) => {
            editor.updateShape({
                id: shape.id,
                type: shape.type,
                props: { font },
            });
        });

        setSelectedFont(font);
    };

    const handleSizeChange = (newSize: number) => {
        if (!editor || newSize < 4 || newSize > 200) return;

        const selectedShapes = editor.getSelectedShapes();
        const targetShapes = selectedShapes.filter((shape: any) => shape.type === 'text' || shape.type === 'note');

        targetShapes.forEach((shape: any) => {
            const sizeKey = shape.props.size || 'm';
            const baseSize = BASE_SIZES[sizeKey] || 24;
            const newScale = newSize / baseSize;

            editor.updateShape({
                id: shape.id,
                type: shape.type,
                props: { scale: newScale },
            });
        });

        setCurrentSize(newSize);
    };

    const handleSizeIncrement = (amount: number) => {
        handleSizeChange(currentSize + amount);
    };

    const handleColorChange = (key: string, value: string) => {
        if (!editor) return;
        const selectedShapes = editor.getSelectedShapes();
        const targetShapes = selectedShapes.filter((shape: any) => shape.type === 'text' || shape.type === 'note');

        targetShapes.forEach((shape: any) => {
            const propName = key === 'fill' ? 'color' : (shape.type === 'note' ? 'labelColor' : 'color');
            if (key === 'fill' && shape.type !== 'note') return;

            editor.updateShape({
                id: shape.id,
                type: shape.type,
                props: { [propName]: value },
            });
        });

        if (key === 'fill') setSelectedFillColor(value);
        else setSelectedTextColor(value);
    };

    const handleAlignChange = (align: string) => {
        if (!editor) return;
        const selectedShapes = editor.getSelectedShapes();
        const targetShapes = selectedShapes.filter((shape: any) => shape.type === 'text' || shape.type === 'note');

        targetShapes.forEach((shape: any) => {
            const propName = shape.type === 'note' ? 'align' : 'textAlign';
            editor.updateShape({
                id: shape.id,
                type: shape.type,
                props: { [propName]: align },
            });
        });

        setSelectedTextAlign(align);
    };

    if (!isVisible) return null;

    // Helper to get font style
    const getFontStyle = (fontId: string) => {
        switch (fontId) {
            case 'sans': return 'var(--tl-font-sans)';
            case 'serif': return 'var(--tl-font-serif)';
            case 'mono': return 'var(--tl-font-mono)';
            case 'draw': return 'var(--tl-font-draw), cursive';
            default: return 'inherit';
        }
    };

    return (
        <div
            className="fixed z-30 flex items-center justify-center p-1.5 gap-1 bg-card/95 backdrop-blur-md border border-border rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                transform: 'translate(-50%, -100%)',
            }}
            onPointerDown={(e) => e.stopPropagation()}
        >
            {/* Font Family */}
            <Select value={selectedFont} onValueChange={handleFontChange}>
                <SelectTrigger className="w-[100px] h-7 text-xs border-none bg-muted/30 focus:ring-0">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {FONTS.map((font) => (
                        <SelectItem
                            key={font.id}
                            value={font.id}
                            className="text-xs"
                            style={{ fontFamily: getFontStyle(font.id) }}
                        >
                            {font.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <div className="w-px h-5 bg-border mx-0.5" />

            {/* Font Size Input */}
            <div className="flex items-center gap-0.5 bg-muted/30 rounded-md border border-border/50 p-0.5">
                <Input
                    ref={inputRef}
                    type="number"
                    value={currentSize}
                    onChange={(e) => handleSizeChange(parseInt(e.target.value) || 0)}
                    className="w-10 h-7 text-xs p-0 pl-1.5 border-none bg-transparent focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    min={4}
                    max={200}
                />
                <div className="flex flex-col">
                    <button
                        className="h-3.5 w-4 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground rounded-sm"
                        onClick={(e) => handleSizeIncrement(e.shiftKey ? 10 : 1)}
                    >
                        <ChevronUp className="w-2.5 h-2.5" />
                    </button>
                    <button
                        className="h-3.5 w-4 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground rounded-sm"
                        onClick={(e) => handleSizeIncrement(e.shiftKey ? -10 : -1)}
                    >
                        <ChevronDown className="w-2.5 h-2.5" />
                    </button>
                </div>
            </div>

            <div className="w-px h-5 bg-border mx-0.5" />

            {/* Text Color */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-8 h-8 rounded-md hover:bg-muted">
                        <Baseline className="w-4 h-4" style={{ color: selectedTextColor !== 'black' ? selectedTextColor : undefined }} />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" side="bottom" align="center">
                    <div className="grid grid-cols-4 gap-1">
                        {TEXT_COLORS.map((color) => (
                            <button
                                key={color.id}
                                className={cn(
                                    "w-6 h-6 rounded-full border transition-all hover:scale-110",
                                    selectedTextColor === color.id ? "ring-2 ring-primary border-background" : "border-transparent"
                                )}
                                style={{ backgroundColor: color.value }}
                                onClick={() => handleColorChange('text', color.id)}
                                title={color.label}
                            />
                        ))}
                    </div>
                </PopoverContent>
            </Popover>

            {/* Sticky Fill Color */}
            {isNote && (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-md hover:bg-muted">
                            <PaintBucket className="w-4 h-4" style={{ color: selectedFillColor !== 'transparent' ? selectedFillColor : undefined }} />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2" side="bottom" align="center">
                        <div className="grid grid-cols-4 gap-1">
                            {TEXT_COLORS.map((color) => (
                                <button
                                    key={`fill-${color.id}`}
                                    className={cn(
                                        "w-6 h-6 rounded-sm border transition-all hover:scale-110",
                                        selectedFillColor === color.id ? "ring-2 ring-primary border-background" : "border-transparent"
                                    )}
                                    style={{ backgroundColor: color.value }}
                                    onClick={() => handleColorChange('fill', color.id)}
                                    title={color.label}
                                />
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            )}

            <div className="w-px h-5 bg-border mx-0.5" />

            {/* Alignment */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-8 h-8 rounded-md hover:bg-muted">
                        {selectedTextAlign === 'start' && <AlignLeft className="w-4 h-4" />}
                        {selectedTextAlign === 'middle' && <AlignCenter className="w-4 h-4" />}
                        {selectedTextAlign === 'end' && <AlignRight className="w-4 h-4" />}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-1.5 flex gap-1" side="bottom" align="center">
                    <Button
                        variant={selectedTextAlign === 'start' ? "secondary" : "ghost"}
                        size="icon"
                        className="w-7 h-7"
                        onClick={() => handleAlignChange('start')}
                    >
                        <AlignLeft className="w-4 h-4" />
                    </Button>
                    <Button
                        variant={selectedTextAlign === 'middle' ? "secondary" : "ghost"}
                        size="icon"
                        className="w-7 h-7"
                        onClick={() => handleAlignChange('middle')}
                    >
                        <AlignCenter className="w-4 h-4" />
                    </Button>
                    <Button
                        variant={selectedTextAlign === 'end' ? "secondary" : "ghost"}
                        size="icon"
                        className="w-7 h-7"
                        onClick={() => handleAlignChange('end')}
                    >
                        <AlignRight className="w-4 h-4" />
                    </Button>
                </PopoverContent>
            </Popover>

        </div>
    );
};
