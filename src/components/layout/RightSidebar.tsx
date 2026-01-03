import { useState } from "react";
import { 
  Info, 
  Library, 
  Highlighter, 
  Layers, 
  X,
  FileText,
  Calendar,
  Tag,
  Link2,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const InfoRow = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => (
  <div className="flex items-center justify-between py-1.5">
    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
      {icon}
      {label}
    </span>
    <span className="text-xs font-medium">{value}</span>
  </div>
);

const BacklinkItem = ({ title, type, date }: { title: string; type: string; date: string }) => (
  <button className="flex items-start gap-2 w-full p-2 hover:bg-accent/50 rounded-md transition-colors text-left group">
    <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{title}</p>
      <p className="text-xs text-muted-foreground">{type} • {date}</p>
    </div>
    <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 mt-1" />
  </button>
);

export const RightSidebar = ({ isOpen, onClose }: RightSidebarProps) => {
  const [activeTab, setActiveTab] = useState("info");

  if (!isOpen) return null;

  return (
    <div className="w-72 h-full bg-card border-l border-border flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="h-7 p-0.5 bg-muted">
            <TabsTrigger value="info" className="h-6 px-2.5 text-xs data-[state=active]:bg-card">
              <Info className="w-3 h-3" />
            </TabsTrigger>
            <TabsTrigger value="library" className="h-6 px-2.5 text-xs data-[state=active]:bg-card">
              <Library className="w-3 h-3" />
            </TabsTrigger>
            <TabsTrigger value="highlights" className="h-6 px-2.5 text-xs data-[state=active]:bg-card">
              <Highlighter className="w-3 h-3" />
            </TabsTrigger>
            <TabsTrigger value="boards" className="h-6 px-2.5 text-xs data-[state=active]:bg-card">
              <Layers className="w-3 h-3" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="ghost" size="icon" className="w-6 h-6 ml-2" onClick={onClose}>
          <X className="w-3 h-3" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="info" className="mt-0 space-y-4">
            {/* Selected Element Info */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Selected Element</h3>
              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-md bg-highlight-blue/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-highlight-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">Research Summary</p>
                    <p className="text-xs text-muted-foreground">Card</p>
                  </div>
                </div>
                <Separator className="my-2" />
                <div className="space-y-0.5">
                  <InfoRow label="Words" value="234" icon={<FileText className="w-3 h-3" />} />
                  <InfoRow label="Created" value="Dec 28, 2025" icon={<Calendar className="w-3 h-3" />} />
                  <InfoRow label="Modified" value="2 hours ago" icon={<Calendar className="w-3 h-3" />} />
                  <InfoRow label="Tags" value="3 tags" icon={<Tag className="w-3 h-3" />} />
                  <InfoRow label="Links" value="5 links" icon={<Link2 className="w-3 h-3" />} />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Tags</h4>
              <div className="flex flex-wrap gap-1.5">
                {["Research", "Important", "Review"].map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                <button className="px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border rounded-full hover:border-primary transition-colors">
                  + Add
                </button>
              </div>
            </div>

            {/* Backlinks */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Backlinks (3)
              </h4>
              <div className="space-y-1">
                <BacklinkItem title="Weekly Planning" type="Card" date="Dec 27" />
                <BacklinkItem title="Project Overview" type="Board" date="Dec 25" />
                <BacklinkItem title="Key Insights" type="Card" date="Dec 24" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="library" className="mt-0">
            <h3 className="text-sm font-semibold mb-3">Quick Library</h3>
            <p className="text-xs text-muted-foreground">
              Drag items from here directly to the canvas.
            </p>
            <div className="mt-4 space-y-2">
              {["Card Template", "Mind Map", "Image Frame", "PDF Page"].map((item) => (
                <div
                  key={item}
                  className="p-2.5 bg-muted/50 rounded-md border border-border hover:border-primary/30 cursor-grab transition-colors"
                >
                  <p className="text-sm font-medium">{item}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="highlights" className="mt-0">
            <h3 className="text-sm font-semibold mb-3">Highlights</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Annotations from PDFs and cards.
            </p>
            <div className="space-y-2">
              {[
                { text: "The key insight from this research...", color: "bg-highlight-yellow", source: "Paper.pdf" },
                { text: "Important note about the methodology...", color: "bg-highlight-blue", source: "Notes" },
              ].map((highlight, i) => (
                <div
                  key={i}
                  className={cn(
                    "p-2 rounded-md border-l-2 cursor-pointer hover:bg-accent/30 transition-colors",
                    highlight.color.replace("bg-", "border-l-")
                  )}
                  style={{ borderLeftColor: `var(--${highlight.color.replace("bg-", "")})` }}
                >
                  <p className="text-xs line-clamp-2">{highlight.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{highlight.source}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="boards" className="mt-0">
            <h3 className="text-sm font-semibold mb-3">Boards</h3>
            <div className="space-y-1">
              {[
                { name: "Main Canvas", active: true },
                { name: "Literature Review", active: false },
                { name: "Key Findings", active: false },
              ].map((board) => (
                <button
                  key={board.name}
                  className={cn(
                    "flex items-center gap-2 w-full p-2 rounded-md transition-colors text-left",
                    board.active 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Layers className="w-4 h-4" />
                  <span className="text-sm">{board.name}</span>
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
