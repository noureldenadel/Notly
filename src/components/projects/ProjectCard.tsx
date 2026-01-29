import { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";
import { ProjectActionsMenu } from "./ProjectActionsMenu";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

// Available project colors with hex values
export const PROJECT_COLORS = [
    { name: "Blue", value: "highlight-blue", hex: "#3B82F6" },
    { name: "Purple", value: "highlight-purple", hex: "#8B5CF6" },
    { name: "Green", value: "highlight-green", hex: "#22C55E" },
    { name: "Yellow", value: "highlight-yellow", hex: "#EAB308" },
    { name: "Pink", value: "highlight-pink", hex: "#EC4899" },
    { name: "Orange", value: "highlight-orange", hex: "#F97316" },
] as const;

// Helper to get hex color from value
export const getColorHex = (colorValue?: string): string => {
    const found = PROJECT_COLORS.find(c => colorValue?.includes(c.value));
    return found?.hex || "#3B82F6";
};

interface ProjectCardProps {
    id: string;
    name: string;
    color?: string;
    thumbnail?: string;
    lastViewed?: string;
    onClick: () => void;
    onRename?: (newName: string) => void;
    onDuplicate?: () => void;
    onDelete?: () => void;
    onExport?: () => void;
    onChangeColor?: (color: string) => void;
}

export const ProjectCard = ({
    id,
    name,
    color = "bg-highlight-blue",
    thumbnail,
    lastViewed,
    onClick,
    onRename,
    onDuplicate,
    onDelete,
    onExport,
    onChangeColor,
}: ProjectCardProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(name);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when editing starts
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    // Update editName when name prop changes
    useEffect(() => {
        setEditName(name);
    }, [name]);

    const handleStartRename = () => {
        setEditName(name);
        setIsEditing(true);
    };

    const handleSaveRename = () => {
        if (editName.trim() && editName !== name) {
            onRename?.(editName.trim());
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveRename();
        } else if (e.key === 'Escape') {
            setEditName(name);
            setIsEditing(false);
        }
    };

    return (
        <div
            className="group cursor-pointer"
            onClick={isEditing ? undefined : onClick}
        >
            {/* Thumbnail */}
            <div className="relative aspect-[4/3] rounded-lg border border-border bg-card overflow-hidden mb-2 transition-all group-hover:border-primary/50 group-hover:shadow-md">
                {/* Canvas preview or placeholder */}
                {thumbnail ? (
                    <img
                        src={thumbnail}
                        alt={`${name} preview`}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
                        <div className="w-16 h-16 rounded-lg bg-muted/50 flex items-center justify-center">
                            <div
                                className="w-8 h-8 rounded-md"
                                style={{ backgroundColor: getColorHex(color) }}
                            />
                        </div>
                    </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
            </div>

            {/* Title row with actions */}
            <div className="flex items-center gap-2">
                <div
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: getColorHex(color) }}
                />

                {isEditing ? (
                    <Input
                        ref={inputRef}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={handleSaveRename}
                        onKeyDown={handleKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        className="h-6 text-sm font-medium flex-1 py-0 px-1"
                    />
                ) : (
                    <span className="text-sm font-medium truncate flex-1">{name}</span>
                )}

                {/* Shared Project Actions Menu */}
                <ProjectActionsMenu
                    onRename={handleStartRename}
                    onDuplicate={onDuplicate!}
                    onDelete={onDelete!}
                    onExport={onExport!}
                    onChangeColor={onChangeColor!}
                    currentColor={color}
                    triggerClassName="opacity-0 group-hover:opacity-100"
                />
            </div>
            {lastViewed && (
                <p className="text-xs text-muted-foreground mt-0.5 ml-4">{lastViewed}</p>
            )}
        </div>
    );
};

export default ProjectCard;
