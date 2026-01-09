import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  Star,
  Clock,
  FolderOpen,
  FileText,
  Image,
  Highlighter,
  Tag,
  Home,
  Settings,
  MoreHorizontal,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DraggableLibraryItem, DraggableItem, SortableItem, SortableList, arrayMove } from "@/components/dnd";
import { useFavoritesStore, useFavorites, useRecents } from "@/stores/favoritesStore";
import { useCardStore } from "@/stores/cardStore";
import { useTagStore } from "@/stores/tagStore";
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
  const [activeTab, setActiveTab] = useState("cards");
  const { toast } = useToast();

  // Real store data
  const favorites = useFavorites();
  const recents = useRecents();
  const { removeFavorite, reorderFavorites } = useFavoritesStore();
  const { cards, createCard } = useCardStore();
  const { tags } = useTagStore();

  // Project store
  const {
    projects: storeProjects,
    createProject,
    setActiveProject,
    createBoard,
    setActiveBoard,
    getBoardsByProject
  } = useProjectStore();

  // Get cards as array for library
  const cardsList = Object.values(cards).slice(0, 10);

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
        <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-primary">
          <Star className="w-4 h-4" />
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
        {/* Favorites - from store */}
        <SidebarSection
          title="Favorites"
          icon={<Star className="w-3 h-3" />}
          actions={<Plus className="w-3 h-3" />}
        >
          {favorites.length > 0 ? (
            <div className="space-y-0.5 px-1">
              {favorites.map((fav) => (
                <div key={fav.id} className="group relative">
                  <SidebarItem
                    icon={<FileText className="w-4 h-4" />}
                    label={fav.title || fav.id}
                  />
                  <button
                    onClick={() => removeFavorite(fav.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded"
                  >
                    <X className="w-3 h-3 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground px-3 py-2">No favorites yet</p>
          )}
        </SidebarSection>

        {/* Recents */}
        <SidebarSection
          title="Recents"
          icon={<Clock className="w-3 h-3" />}
        >
          <div className="space-y-0.5 px-1">
            {recents.map((item) => (
              <SidebarItem
                key={item.id}
                icon={item.type === "card" ? <FileText className="w-4 h-4" /> : <Image className="w-4 h-4" />}
                label={item.title}
              />
            ))}
          </div>
        </SidebarSection>

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

        {/* Library */}
        <SidebarSection
          title="Library"
        >
          <div className="px-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full h-7 bg-sidebar-accent p-0.5">
                <TabsTrigger value="cards" className="flex-1 h-6 text-xs data-[state=active]:bg-sidebar">
                  <FileText className="w-3 h-3 mr-1" />
                  Cards
                </TabsTrigger>
                <TabsTrigger value="files" className="flex-1 h-6 text-xs data-[state=active]:bg-sidebar">
                  <Image className="w-3 h-3 mr-1" />
                  Files
                </TabsTrigger>
                <TabsTrigger value="highlights" className="flex-1 h-6 text-xs data-[state=active]:bg-sidebar">
                  <Highlighter className="w-3 h-3 mr-1" />
                  Clips
                </TabsTrigger>
              </TabsList>
              <TabsContent value="cards" className="mt-2 space-y-1">
                <div className="text-xs text-muted-foreground p-2 text-center">
                  Drag cards to canvas
                </div>
                <div className="space-y-1">
                  {cardsList.length > 0 ? cardsList.map((card) => (
                    <DraggableLibraryItem
                      key={card.id}
                      item={{
                        id: card.id,
                        type: 'card',
                        data: { title: card.title, content: card.content, color: card.color },
                      }}
                    >
                      <div className="p-2 bg-sidebar-accent rounded-md cursor-grab hover:bg-primary/10 transition-colors border border-transparent hover:border-primary/20">
                        <p className="text-xs font-medium truncate">{card.title || 'Untitled Card'}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{card.wordCount} words</p>
                      </div>
                    </DraggableLibraryItem>
                  )) : (
                    <p className="text-xs text-muted-foreground px-2 py-4 text-center">No cards yet</p>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="files" className="mt-2">
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { id: 'file-1', filename: 'Document.pdf' },
                    { id: 'file-2', filename: 'Image.png' },
                    { id: 'file-3', filename: 'Notes.pdf' },
                    { id: 'file-4', filename: 'Photo.jpg' },
                  ].map((file) => (
                    <DraggableLibraryItem
                      key={file.id}
                      item={{
                        id: file.id,
                        type: file.filename.endsWith('.pdf') ? 'pdf' : 'file',
                        data: { filename: file.filename },
                      }}
                    >
                      <div className="aspect-square bg-sidebar-accent rounded-md cursor-grab hover:bg-primary/10 transition-colors flex items-center justify-center">
                        <Image className="w-6 h-6 text-muted-foreground" />
                      </div>
                    </DraggableLibraryItem>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="highlights" className="mt-2">
                <div className="text-xs text-muted-foreground p-2 text-center">
                  No highlights yet
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </SidebarSection>

        {/* Tags */}
        <SidebarSection
          title="Tags"
          icon={<Tag className="w-3 h-3" />}
          actions={<Plus className="w-3 h-3" />}
          defaultOpen={false}
        >
          <div className="px-2 space-y-1">
            {tags.length > 0 ? tags.map((tag) => (
              <button
                key={tag.id}
                className="flex items-center gap-2 w-full px-2 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent rounded-md transition-colors"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tag.color || 'hsl(var(--muted-foreground))' }}
                />
                <span>{tag.name}</span>
              </button>
            )) : (
              <p className="text-xs text-muted-foreground px-2 py-2">No tags yet</p>
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
