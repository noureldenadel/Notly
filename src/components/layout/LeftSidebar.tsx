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
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  name: string;
  color: string;
  isActive?: boolean;
  boards?: { id: string; name: string }[];
}

const ProjectItem = ({ name, color, isActive, boards = [] }: ProjectItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
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
        <div className={cn("w-2.5 h-2.5 rounded-sm flex-shrink-0", color)} />
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

  const projects = [
    { 
      id: "1", 
      name: "Research Notes", 
      color: "bg-highlight-blue",
      boards: [
        { id: "1a", name: "Literature Review" },
        { id: "1b", name: "Key Findings" },
      ]
    },
    { 
      id: "2", 
      name: "Product Design", 
      color: "bg-highlight-purple",
      boards: [
        { id: "2a", name: "User Flows" },
      ]
    },
    { 
      id: "3", 
      name: "Learning", 
      color: "bg-highlight-green",
      boards: []
    },
  ];

  const favorites = [
    { id: "1", name: "Design System", icon: <FileText className="w-4 h-4" /> },
    { id: "2", name: "Weekly Planning", icon: <FileText className="w-4 h-4" /> },
  ];

  const recents = [
    { id: "1", name: "API Architecture", type: "card" },
    { id: "2", name: "Wireframes.pdf", type: "file" },
    { id: "3", name: "Meeting Notes", type: "card" },
  ];

  const tags = [
    { id: "1", name: "Important", color: "bg-highlight-yellow" },
    { id: "2", name: "Review", color: "bg-highlight-blue" },
    { id: "3", name: "Ideas", color: "bg-highlight-green" },
  ];

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
          <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs justify-start gap-2 text-muted-foreground hover:text-primary">
            <Plus className="w-3.5 h-3.5" />
            New Card
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs justify-start gap-2 text-muted-foreground hover:text-primary">
            <FolderOpen className="w-3.5 h-3.5" />
            New Project
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Favorites */}
        <SidebarSection 
          title="Favorites" 
          icon={<Star className="w-3 h-3" />}
          actions={<Plus className="w-3 h-3" />}
        >
          <div className="space-y-0.5 px-1">
            {favorites.map((item) => (
              <SidebarItem key={item.id} icon={item.icon} label={item.name} />
            ))}
          </div>
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
                label={item.name} 
              />
            ))}
          </div>
        </SidebarSection>

        {/* Projects */}
        <SidebarSection 
          title="Projects" 
          icon={<FolderOpen className="w-3 h-3" />}
          actions={<Plus className="w-3 h-3" />}
        >
          <div className="space-y-0.5 px-1">
            {projects.map((project) => (
              <ProjectItem 
                key={project.id} 
                name={project.name} 
                color={project.color}
                boards={project.boards}
              />
            ))}
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
                  {["Research Summary", "Key Insights", "Action Items"].map((card) => (
                    <div 
                      key={card}
                      className="p-2 bg-sidebar-accent rounded-md cursor-grab hover:bg-primary/10 transition-colors border border-transparent hover:border-primary/20"
                    >
                      <p className="text-xs font-medium truncate">{card}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">3 min ago</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="files" className="mt-2">
                <div className="grid grid-cols-2 gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i}
                      className="aspect-square bg-sidebar-accent rounded-md cursor-grab hover:bg-primary/10 transition-colors flex items-center justify-center"
                    >
                      <Image className="w-6 h-6 text-muted-foreground" />
                    </div>
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
            {tags.map((tag) => (
              <button
                key={tag.id}
                className="flex items-center gap-2 w-full px-2 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent rounded-md transition-colors"
              >
                <div className={cn("w-2 h-2 rounded-full", tag.color)} />
                <span>{tag.name}</span>
              </button>
            ))}
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
