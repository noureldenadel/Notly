import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  FolderOpen,
  Home,
  Settings,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCardStore } from "@/stores/cardStore";
import { useProjectStore } from "@/stores/projectStore";
import { useToast } from "@/hooks/use-toast";

interface SidebarSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  actions?: React.ReactNode;
}

const SidebarSection = ({ title, icon, children, defaultOpen = true, actions }: SidebarSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
      >
        <div className="flex items-center gap-2">
          {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          {icon}
          <span className="uppercase tracking-wider">{title}</span>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          {actions}
        </div>
      </button>
      {isOpen && (
        <div className="animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
};

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  badge?: string | number;
  color?: string;
}

const SidebarItem = ({ icon, label, isActive, onClick, badge, color }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 w-full px-3 py-1.5 text-sm rounded-md transition-all group",
      isActive
        ? "bg-primary/10 text-primary"
        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    )}
  >
    <span className={cn("w-4 h-4 flex-shrink-0", color && `text-${color}`)}>{icon}</span>
    <span className="truncate flex-1 text-left">{label}</span>
    {badge && (
      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
        {badge}
      </span>
    )}
    <MoreHorizontal className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
  </button>
);

interface ProjectItemProps {
  id: string;
  name: string;
  color: string;
  isActive?: boolean;
  boards?: { id: string; name: string }[];
  onProjectClick?: (projectId: string) => void;
  onBoardClick?: (boardId: string) => void;
}

const ProjectItem = ({ id, name, color, isActive, boards = [], onProjectClick, onBoardClick }: ProjectItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleProjectClick = () => {
    if (boards.length > 0) {
      setIsExpanded(!isExpanded);
    }
    onProjectClick?.(id);
  };

  return (
    <div>
      <button
        onClick={handleProjectClick}
        className={cn(
          "flex items-center gap-2 w-full px-3 py-1.5 text-sm rounded-md transition-all group",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        {boards.length > 0 ? (
          isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
        ) : (
          <div className="w-3" />
        )}
        <div
          className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
          style={{ backgroundColor: color.startsWith('bg-') ? undefined : color }}
        />
        <span className="truncate flex-1 text-left">{name}</span>
        <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100">
          {boards.length}
        </span>
      </button>
      {isExpanded && boards.length > 0 && (
        <div className="ml-6 mt-0.5 space-y-0.5 animate-fade-in">
          {boards.map((board) => (
            <button
              key={board.id}
              onClick={() => onBoardClick?.(board.id)}
              className="flex items-center gap-2 w-full px-3 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent rounded-md transition-colors"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
              <span className="truncate">{board.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface LeftSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const LeftSidebar = ({ isCollapsed, onToggle }: LeftSidebarProps) => {
  const { toast } = useToast();

  // Real store data
  const { createCard } = useCardStore();

  // Project store
  const {
    projects: storeProjects,
    createProject,
    setActiveProject,
    createBoard,
    setActiveBoard,
    getBoardsByProject
  } = useProjectStore();

  // Handle New Card with toast
  const handleNewCard = () => {
    const card = createCard('', 'New Card', 'highlight-blue');
    toast({
      title: "Card Created",
      description: `"${card.title}" has been created`,
    });
  };

  // Handle New Project with toast
  const handleNewProject = () => {
    const project = createProject('New Project', '', '#3b82f6');
    const board = createBoard(project.id, 'Main Board');
    setActiveProject(project.id);
    setActiveBoard(board.id);
    toast({
      title: "Project Created",
      description: `"${project.title}" has been created with a main board`,
    });
  };

  // Build projects list from store with their boards
  const projects = storeProjects.map(p => ({
    id: p.id,
    name: p.title,
    color: p.color ? `bg-[${p.color}]` : 'bg-highlight-blue',
    boards: getBoardsByProject(p.id).map(b => ({ id: b.id, name: b.title }))
  }));

  if (isCollapsed) {
    return (
      <div className="w-12 h-full bg-sidebar border-r border-sidebar-border flex flex-col items-center py-3 gap-2">
        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={onToggle}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <div className="w-6 h-px bg-border my-1" />
        <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-primary">
          <Home className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-primary">
          <Search className="w-4 h-4" />
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-primary">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-64 h-full bg-sidebar border-r border-sidebar-border flex flex-col animate-slide-in-left">
      {/* Header */}
      <div className="p-3 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">V</span>
            </div>
            <span className="font-semibold text-sm">Visual Think</span>
          </div>
          <Button variant="ghost" size="icon" className="w-6 h-6" onClick={onToggle}>
            <ChevronRight className="w-3 h-3 rotate-180" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search everything..."
            className="h-8 pl-8 text-sm bg-sidebar-accent border-none focus-visible:ring-1 focus-visible:ring-primary/50"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-2 border-b border-sidebar-border">
        <div className="flex gap-1">
          <Button onClick={handleNewCard} variant="ghost" size="sm" className="flex-1 h-8 text-xs justify-start gap-2 text-muted-foreground hover:text-primary">
            <Plus className="w-3.5 h-3.5" />
            New Card
          </Button>
          <Button onClick={handleNewProject} variant="ghost" size="sm" className="flex-1 h-8 text-xs justify-start gap-2 text-muted-foreground hover:text-primary">
            <FolderOpen className="w-3.5 h-3.5" />
            New Project
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Projects */}
        <SidebarSection
          title="Projects"
          icon={<FolderOpen className="w-3 h-3" />}
          actions={<Plus className="w-3 h-3" onClick={handleNewProject} />}
        >
          <div className="space-y-0.5 px-1">
            {projects.length > 0 ? projects.map((project) => (
              <ProjectItem
                key={project.id}
                id={project.id}
                name={project.name}
                color={project.color}
                boards={project.boards}
                onProjectClick={(projectId) => {
                  setActiveProject(projectId);
                  const projectBoards = getBoardsByProject(projectId);
                  if (projectBoards.length > 0) {
                    setActiveBoard(projectBoards[0].id);
                  }
                }}
                onBoardClick={(boardId) => {
                  setActiveBoard(boardId);
                }}
              />
            )) : (
              <p className="text-xs text-muted-foreground px-2 py-2">No projects yet. Click "New Project" to start.</p>
            )}
          </div>
        </SidebarSection>

      </div>

      {/* Footer */}
      <div className="p-2 border-t border-sidebar-border">
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground h-8">
          <Settings className="w-4 h-4" />
          <span className="text-xs">Settings</span>
        </Button>
      </div>
    </div>
  );
};
