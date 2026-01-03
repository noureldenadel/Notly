import { useState } from "react";
import { Plus, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface CanvasCardProps {
  id: string;
  title: string;
  content: string;
  x: number;
  y: number;
  width: number;
  color: string;
  isSelected?: boolean;
  onSelect: (id: string) => void;
}

const CanvasCard = ({ id, title, content, x, y, width, color, isSelected, onSelect }: CanvasCardProps) => {
  // Map color names to actual HSL values
  const colorMap: Record<string, string> = {
    "highlight-blue": "210 90% 65%",
    "highlight-purple": "270 70% 65%",
    "highlight-green": "150 70% 50%",
    "highlight-yellow": "45 93% 65%",
    "highlight-pink": "330 80% 65%",
  };
  
  const hslColor = colorMap[color] || "210 90% 65%";
  
  return (
    <div
      onClick={() => onSelect(id)}
      className={cn(
        "absolute p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
        "hover:shadow-lg hover:-translate-y-1",
        isSelected 
          ? "border-primary ring-2 ring-primary/30 shadow-lg" 
          : "border-transparent"
      )}
      style={{
        left: x,
        top: y,
        width: width,
        backgroundColor: `hsl(${hslColor} / 0.12)`,
        borderColor: isSelected ? undefined : `hsl(${hslColor} / 0.25)`,
      }}
    >
      <div className="flex items-start gap-2 mb-2">
        <FileText 
          className="w-4 h-4 mt-0.5 flex-shrink-0" 
          style={{ color: `hsl(${hslColor})` }} 
        />
        <h3 className="text-sm font-semibold leading-tight text-foreground">{title}</h3>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{content}</p>
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[10px] px-2 py-0.5 bg-background/60 rounded-full text-muted-foreground font-medium">
          234 words
        </span>
        <span className="text-[10px] text-muted-foreground">• 2h ago</span>
      </div>
    </div>
  );
};

const CanvasStickyNote = ({ x, y, content, color }: { x: number; y: number; content: string; color: string }) => {
  const colorMap: Record<string, string> = {
    "highlight-yellow": "45 93% 65%",
    "highlight-pink": "330 80% 65%",
    "highlight-blue": "210 90% 65%",
  };
  
  const hslColor = colorMap[color] || "45 93% 65%";
  
  return (
    <div
      className="absolute p-3 rounded-lg shadow-md cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:rotate-1"
      style={{
        left: x,
        top: y,
        width: 150,
        height: 150,
        backgroundColor: `hsl(${hslColor})`,
      }}
    >
      <p className="text-xs font-medium leading-relaxed" style={{ color: "hsl(220 16% 8%)" }}>{content}</p>
    </div>
  );
};

const CanvasConnection = ({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) => {
  const midX = (x1 + x2) / 2;
  
  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill="hsl(215 15% 55%)"
            opacity="0.6"
          />
        </marker>
      </defs>
      <path
        d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
        fill="none"
        stroke="hsl(215 15% 55%)"
        strokeWidth="2"
        opacity="0.4"
        strokeDasharray="6 4"
        markerEnd="url(#arrowhead)"
      />
    </svg>
  );
};

export const CanvasArea = () => {
  const [selectedCard, setSelectedCard] = useState<string | null>("1");

  const cards = [
    {
      id: "1",
      title: "Research Summary",
      content: "The key findings from the literature review indicate that visual thinking improves retention by 40% compared to text-only methods.",
      x: 80,
      y: 60,
      width: 280,
      color: "highlight-blue",
    },
    {
      id: "2", 
      title: "Key Insights",
      content: "Users prefer spatial organization over linear lists. The ability to connect ideas visually creates stronger mental models.",
      x: 420,
      y: 120,
      width: 260,
      color: "highlight-purple",
    },
    {
      id: "3",
      title: "Action Items",
      content: "1. Implement infinite canvas\n2. Add rich text editor\n3. Create PDF viewer\n4. Build mind map feature",
      x: 140,
      y: 280,
      width: 240,
      color: "highlight-green",
    },
  ];

  const stickyNotes = [
    { id: "s1", x: 720, y: 80, content: "Remember to add keyboard shortcuts for power users", color: "highlight-yellow" },
    { id: "s2", x: 460, y: 340, content: "Review tldraw integration docs", color: "highlight-pink" },
  ];

  return (
    <div 
      className="flex-1 relative overflow-hidden"
      style={{ 
        backgroundColor: "hsl(220 16% 6%)",
        backgroundImage: "radial-gradient(circle, hsl(220 14% 15%) 1px, transparent 1px)",
        backgroundSize: "24px 24px"
      }}
    >
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse at 30% 20%, hsl(38 92% 60% / 0.05) 0%, transparent 50%)"
      }} />

      {/* Canvas content container with proper z-index */}
      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        {/* Connections */}
        <CanvasConnection x1={340} y1={130} x2={420} y2={160} />
        <CanvasConnection x1={260} y1={200} x2={180} y2={280} />

        {/* Cards */}
        {cards.map((card) => (
          <CanvasCard
            key={card.id}
            {...card}
            isSelected={selectedCard === card.id}
            onSelect={setSelectedCard}
          />
        ))}

        {/* Sticky Notes */}
        {stickyNotes.map((note) => (
          <CanvasStickyNote key={note.id} {...note} />
        ))}
      </div>

      {/* UI Overlays with higher z-index */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
        {/* Empty State Helper */}
        <div className="absolute bottom-24 right-8 flex flex-col items-end gap-2 animate-fade-in pointer-events-auto">
          <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 bg-muted/50 rounded text-[10px] font-medium">C</kbd>
            <span>to create a card</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
            <span>Drag from library to add items</span>
          </div>
        </div>

        {/* Quick Add Button */}
        <button className="absolute bottom-24 left-8 w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-glow hover:scale-110 transition-all duration-200 flex items-center justify-center group pointer-events-auto">
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
        </button>
      </div>
    </div>
  );
};
