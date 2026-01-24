import { useState } from "react";
import {
  Library,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RightSidebar = ({ isOpen, onClose }: RightSidebarProps) => {
  const [activeTab, setActiveTab] = useState("library");

  if (!isOpen) return null;

  return (
    <div className="w-72 h-full bg-card border-l border-border flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="h-7 p-0.5 bg-muted">

            <TabsTrigger value="library" className="h-6 px-2.5 text-xs data-[state=active]:bg-card">
              <Library className="w-3 h-3" />
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




        </Tabs>
      </div>
    </div>
  );
};
