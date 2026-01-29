import {
    MoreVertical,
    Upload,
    Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { PROJECT_COLORS } from "./ProjectCard";

interface ProjectActionsMenuProps {
    onRename: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onExport: () => void;
    onChangeColor: (color: string) => void;
    currentColor?: string;
    triggerClassName?: string;
}

export const ProjectActionsMenu = ({
    onRename,
    onDuplicate,
    onDelete,
    onExport,
    onChangeColor,
    currentColor,
    triggerClassName
}: ProjectActionsMenuProps) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "w-6 h-6 text-muted-foreground hover:text-foreground transition-opacity",
                        triggerClassName
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    <MoreVertical className="w-3.5 h-3.5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={onRename}>Rename</DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate}>Duplicate</DropdownMenuItem>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        Color
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <div className="flex gap-1.5 p-2">
                            {PROJECT_COLORS.map((c) => (
                                <button
                                    key={c.value}
                                    onClick={() => onChangeColor(c.value)}
                                    className={cn(
                                        "w-6 h-6 rounded-full transition-transform hover:scale-110",
                                        currentColor?.includes(c.value) && "ring-2 ring-offset-2 ring-primary"
                                    )}
                                    style={{ backgroundColor: c.hex }}
                                    title={c.name}
                                />
                            ))}
                        </div>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                {/* Export is allowed, Import is removed as per requirements */}
                <DropdownMenuItem onClick={onExport}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={onDelete}>Delete</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
