import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface PDFCardProps {
  id: string;
  title: string;
  pageCount: number;
  x: number;
  y: number;
  isSelected?: boolean;
  onSelect: (id: string) => void;
  onOpen: () => void;
}

export const PDFCard = ({
  id,
  title,
  pageCount,
  x,
  y,
  isSelected,
  onSelect,
  onOpen,
}: PDFCardProps) => {
  const handleClick = (e: React.MouseEvent) => {
    onSelect(id);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpen();
  };

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={cn(
        "absolute p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 w-48",
        "hover:shadow-lg hover:-translate-y-1 group",
        isSelected
          ? "border-primary ring-2 ring-primary/30 shadow-lg"
          : "border-border"
      )}
      style={{
        left: x,
        top: y,
        backgroundColor: "hsl(var(--card))",
      }}
    >
      {/* PDF Icon/Preview */}
      <div className="w-full aspect-[3/4] bg-muted/50 rounded-lg flex items-center justify-center mb-3 border border-border group-hover:border-primary/30 transition-colors">
        <div className="flex flex-col items-center gap-2">
          <FileText className="w-10 h-10 text-red-400" />
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
            PDF
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-medium text-foreground truncate mb-1">
        {title}
      </h3>

      {/* Meta */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>{pageCount} pages</span>
        <span>•</span>
        <span className="text-primary/80">Double-click to view</span>
      </div>
    </div>
  );
};
