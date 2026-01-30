import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search,
    Plus,
    Upload,
    LayoutGrid,
    List,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Settings,
    MoreVertical,
    Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ProjectCard, getColorHex, PROJECT_COLORS } from "@/components/projects/ProjectCard";
import { ProjectActionsMenu } from "@/components/projects/ProjectActionsMenu";

import { useProjectStore } from "@/stores/projectStore";
import { useUIStore } from "@/stores/uiStore";
import { useToast } from "@/hooks/use-toast";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { ImportExportModal } from "@/components/modals/ImportExportModal";


type SortOption = "lastViewed" | "name" | "created";
type ViewMode = "grid" | "list";

const Projects = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>("lastViewed");
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [shortcutsOpen, setShortcutsOpen] = useState(false);
    const [importExportOpen, setImportExportOpen] = useState(false);
    const [importExportTab, setImportExportTab] = useState<'import' | 'export'>('import');
    // Get sidebar collapse state from UI store (persisted)
    const { leftSidebarCollapsed, toggleLeftSidebar } = useUIStore();

    // Get projects from store
    const {
        projects,
        loadProjects,
        isLoaded,
        createProject,
        updateProject,
        deleteProject,
        setActiveProject,
        createBoard,
        setActiveBoard,
        getBoardsByProject,
    } = useProjectStore();

    // Load projects on mount
    useEffect(() => {
        if (!isLoaded) {
            loadProjects();
        }
    }, [isLoaded, loadProjects]);

    // Filter and sort projects
    const filteredProjects = useMemo(() => {
        let result = projects.filter(project =>
            project.title.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Sort
        if (sortBy === "name") {
            result = [...result].sort((a, b) => a.title.localeCompare(b.title));
        } else if (sortBy === "created") {
            result = [...result].sort((a, b) => b.createdAt - a.createdAt);
        } else {
            // lastViewed - use updatedAt as proxy
            result = [...result].sort((a, b) => b.updatedAt - a.updatedAt);
        }

        return result;
    }, [projects, searchQuery, sortBy]);

    // Handle project click - navigate to canvas
    const handleProjectClick = (projectId: string) => {
        setActiveProject(projectId);
        const boards = getBoardsByProject(projectId);
        if (boards.length > 0) {
            setActiveBoard(boards[0].id);
        }
        navigate("/canvas");
    };

    // Create new project
    const handleNewProject = () => {
        const project = createProject("Untitled Project");
        const board = createBoard(project.id, "Main Board");
        setActiveProject(project.id);
        setActiveBoard(board.id);
        toast({
            title: "Project created",
            description: "New project has been created.",
        });
        navigate("/canvas");
    };

    // Rename project (called with new name from inline edit)
    const handleRename = (projectId: string, newName: string) => {
        updateProject(projectId, { title: newName });
        toast({ title: "Project renamed" });
    };

    // Duplicate project
    const handleDuplicate = (projectId: string) => {
        const original = projects.find(p => p.id === projectId);
        if (original) {
            const newProject = createProject(`${original.title} (Copy)`, original.description, original.color);
            createBoard(newProject.id, "Main Board");
            toast({ title: "Project duplicated" });
        }
    };

    // Import/Export Handlers
    const handleImport = () => {
        setImportExportTab('import');
        setImportExportOpen(true);
    };

    const handleExport = () => {
        setImportExportTab('export');
        setImportExportOpen(true);
    };

    // Delete project
    const handleDelete = (projectId: string, projectName: string) => {
        if (window.confirm(`Are you sure you want to delete "${projectName}"? This cannot be undone.`)) {
            deleteProject(projectId);
            toast({ title: "Project deleted", variant: "destructive" });
        }
    };

    // Format time ago
    const formatTimeAgo = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return "Just now";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return new Date(timestamp).toLocaleDateString();
    };

    const sortOptions: { value: SortOption; label: string }[] = [
        { value: "lastViewed", label: "Last viewed" },
        { value: "name", label: "Name" },
        { value: "created", label: "Date created" },
    ];

    return (
        <div className="h-screen w-screen flex bg-background">
            {/* Sidebar - Collapsible */}
            <div
                className={cn(
                    "h-full bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
                    leftSidebarCollapsed ? "w-14" : "w-56"
                )}
            >
                {/* Logo & Toggle */}
                <div className={cn(
                    "h-11 border-b border-sidebar-border flex items-center gap-2",
                    leftSidebarCollapsed ? "justify-center px-0" : "px-4"
                )}>
                    <button
                        onClick={() => leftSidebarCollapsed && toggleLeftSidebar()}
                        className={cn(
                            "w-6 h-6 rounded-md overflow-hidden flex-shrink-0",
                            leftSidebarCollapsed && "cursor-pointer hover:opacity-80 transition-opacity"
                        )}
                        disabled={!leftSidebarCollapsed}
                        title={leftSidebarCollapsed ? "Expand sidebar" : undefined}
                    >
                        <img src="/logo.svg" alt="Nōtly" className="w-full h-full" />
                    </button>
                    {!leftSidebarCollapsed && (
                        <>
                            <span className="font-semibold text-sm flex-1">Nōtly</span>
                            <button
                                onClick={toggleLeftSidebar}
                                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
                                title="Collapse sidebar"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex-1 py-4 px-2">
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full gap-2 text-primary bg-primary/10",
                            leftSidebarCollapsed ? "justify-center px-2" : "justify-start"
                        )}
                        title={leftSidebarCollapsed ? "All Projects" : undefined}
                    >
                        <LayoutGrid className="w-4 h-4 flex-shrink-0" />
                        {!leftSidebarCollapsed && "All Projects"}
                    </Button>
                </div>

                {/* Footer */}
                <div className="border-t border-sidebar-border p-2">
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full gap-2 text-muted-foreground",
                            leftSidebarCollapsed ? "justify-center px-2" : "justify-start"
                        )}
                        onClick={() => setSettingsOpen(true)}
                        title={leftSidebarCollapsed ? "Settings" : undefined}
                    >
                        <Settings className="w-4 h-4 flex-shrink-0" />
                        {!leftSidebarCollapsed && "Settings"}
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="h-11 flex items-center justify-between px-4 border-b border-border">
                    {/* Search */}
                    <div className="relative w-56">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                        <Input
                            placeholder="Search projects"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-7 pl-7 text-xs bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                        <Button size="sm" className="h-7 px-2.5 gap-1 text-xs" onClick={handleNewProject}>
                            <Plus className="w-3 h-3" />
                            New project
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 px-2.5 gap-1 text-xs" onClick={handleImport}>
                            <Upload className="w-3 h-3" />
                            Import
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {/* Section Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-xl font-semibold">All Projects</h1>

                        <div className="flex items-center gap-3">
                            {/* Sort Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                                        {sortOptions.find(o => o.value === sortBy)?.label}
                                        <ChevronDown className="w-3.5 h-3.5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {sortOptions.map((option) => (
                                        <DropdownMenuItem
                                            key={option.value}
                                            onClick={() => setSortBy(option.value)}
                                            className={sortBy === option.value ? "bg-accent" : ""}
                                        >
                                            {option.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* View Toggle */}
                            <div className="flex items-center border rounded-md overflow-hidden">
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={cn(
                                        "p-1.5 transition-colors",
                                        viewMode === "grid"
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    )}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={cn(
                                        "p-1.5 transition-colors",
                                        viewMode === "list"
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    )}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Projects Grid/List */}
                    {viewMode === "grid" ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                            {filteredProjects.map((project) => (
                                <ProjectCard
                                    key={project.id}
                                    id={project.id}
                                    name={project.title}
                                    color={project.color ? `bg-${project.color}` : "bg-highlight-blue"}
                                    thumbnail={project.thumbnailPath}
                                    lastViewed={formatTimeAgo(project.updatedAt)}
                                    onClick={() => handleProjectClick(project.id)}
                                    onRename={(newName) => handleRename(project.id, newName)}
                                    onDuplicate={() => handleDuplicate(project.id)}
                                    onDelete={() => handleDelete(project.id, project.title)}
                                    onExport={handleExport}
                                    onChangeColor={(color) => updateProject(project.id, { color })}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredProjects.map((project) => (
                                <div
                                    key={project.id}
                                    className="flex items-center gap-4 w-full p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                                >
                                    <div
                                        className="w-3 h-3 rounded-sm cursor-pointer"
                                        style={{ backgroundColor: getColorHex(project.color) }}
                                        onClick={() => editingId !== project.id && handleProjectClick(project.id)}
                                    />

                                    {editingId === project.id ? (
                                        <Input
                                            autoFocus
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onBlur={() => {
                                                if (editName.trim() && editName !== project.title) {
                                                    handleRename(project.id, editName.trim());
                                                }
                                                setEditingId(null);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    if (editName.trim() && editName !== project.title) {
                                                        handleRename(project.id, editName.trim());
                                                    }
                                                    setEditingId(null);
                                                } else if (e.key === 'Escape') {
                                                    setEditingId(null);
                                                }
                                            }}
                                            className="h-7 flex-1 text-sm font-medium"
                                        />
                                    ) : (
                                        <span
                                            className="font-medium flex-1 cursor-pointer"
                                            onClick={() => handleProjectClick(project.id)}
                                        >
                                            {project.title}
                                        </span>
                                    )}

                                    <span className="text-sm text-muted-foreground">{formatTimeAgo(project.updatedAt)}</span>

                                    {/* Shared Project Actions Menu */}
                                    <ProjectActionsMenu
                                        onRename={() => {
                                            setEditName(project.title);
                                            setEditingId(project.id);
                                        }}
                                        onDuplicate={() => handleDuplicate(project.id)}
                                        onDelete={() => handleDelete(project.id, project.title)}
                                        onExport={handleExport}
                                        onChangeColor={(color) => updateProject(project.id, { color })}
                                        currentColor={project.color}
                                        triggerClassName="opacity-0 group-hover:opacity-100"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty state */}
                    {filteredProjects.length === 0 && (
                        <div className="text-center py-12">
                            {searchQuery ? (
                                <p className="text-muted-foreground">No projects found matching "{searchQuery}"</p>
                            ) : (
                                <div>
                                    <p className="text-muted-foreground mb-4">No projects yet</p>
                                    <Button onClick={handleNewProject}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create your first project
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {/* Modals */}
            <SettingsModal
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
            />

            <ImportExportModal
                open={importExportOpen}
                onOpenChange={setImportExportOpen}
                initialTab={importExportTab}
            />
        </div>
    );
};

export default Projects;
