import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Keyboard,
  HelpCircle,
  Sun,
  Moon,
  Monitor,
  ExternalLink,
  Mail,
  MessageCircle,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "general" | "shortcuts" | "support";
}

type Theme = "light" | "dark" | "system";

const ThemeOption = ({
  theme,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  theme: Theme;
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
      active
        ? "border-primary bg-primary/5"
        : "border-border hover:border-primary/50 hover:bg-accent/50"
    )}
  >
    <Icon className={cn("w-6 h-6", active ? "text-primary" : "text-muted-foreground")} />
    <span className={cn("text-sm font-medium", active ? "text-primary" : "text-foreground")}>
      {label}
    </span>
  </button>
);

const ShortcutItem = ({ keys, description }: { keys: string[]; description: string }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-muted-foreground">{description}</span>
    <div className="flex items-center gap-1">
      {keys.map((key, i) => (
        <span key={i}>
          <kbd className="px-2 py-1 text-xs font-mono bg-muted border border-border rounded">
            {key}
          </kbd>
          {i < keys.length - 1 && <span className="mx-1 text-muted-foreground">+</span>}
        </span>
      ))}
    </div>
  </div>
);

const SupportLink = ({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/30 transition-all group"
  >
    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1">
        <p className="font-medium text-sm group-hover:text-primary transition-colors">{title}</p>
        <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
  </a>
);

export const SettingsModal = ({ isOpen, onClose, defaultTab = "general" }: SettingsModalProps) => {
  const [theme, setTheme] = useState<Theme>("dark");

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    const root = document.documentElement;
    
    if (newTheme === "system") {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("light", !systemDark);
    } else {
      root.classList.toggle("light", newTheme === "light");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 bg-card">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-lg font-semibold">Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={defaultTab} key={defaultTab} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-auto p-0 px-4">
            <TabsTrigger
              value="general"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5"
            >
              <Settings className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger
              value="shortcuts"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5"
            >
              <Keyboard className="w-4 h-4 mr-2" />
              Shortcuts
            </TabsTrigger>
            <TabsTrigger
              value="support"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Support
            </TabsTrigger>
          </TabsList>

          <div className="p-4 min-h-[320px]">
            <TabsContent value="general" className="mt-0 space-y-6">
              {/* Appearance */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Appearance</Label>
                <p className="text-xs text-muted-foreground mb-4">
                  Choose how the app looks. Select a theme or sync with your system.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <ThemeOption
                    theme="light"
                    label="Light"
                    icon={Sun}
                    active={theme === "light"}
                    onClick={() => handleThemeChange("light")}
                  />
                  <ThemeOption
                    theme="dark"
                    label="Dark"
                    icon={Moon}
                    active={theme === "dark"}
                    onClick={() => handleThemeChange("dark")}
                  />
                  <ThemeOption
                    theme="system"
                    label="System"
                    icon={Monitor}
                    active={theme === "system"}
                    onClick={() => handleThemeChange("system")}
                  />
                </div>
              </div>

              {/* Auto-save */}
              <div className="flex items-center justify-between py-3 border-t border-border">
                <div>
                  <Label className="text-sm font-medium">Auto-save</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Automatically save changes as you work
                  </p>
                </div>
                <Button variant="outline" size="sm" className="text-xs">
                  Enabled
                </Button>
              </div>

              {/* Show Grid */}
              <div className="flex items-center justify-between py-3 border-t border-border">
                <div>
                  <Label className="text-sm font-medium">Show canvas grid</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Display dot grid pattern on the canvas
                  </p>
                </div>
                <Button variant="outline" size="sm" className="text-xs">
                  Visible
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="shortcuts" className="mt-0 space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-3">Navigation</h4>
                <div className="space-y-1 border border-border rounded-lg p-3">
                  <ShortcutItem keys={["⌘", "K"]} description="Quick search" />
                  <ShortcutItem keys={["⌘", "."]} description="Toggle right sidebar" />
                  <ShortcutItem keys={["⌘", "["]} description="Toggle left sidebar" />
                  <ShortcutItem keys={["⌘", "+"]} description="Zoom in" />
                  <ShortcutItem keys={["⌘", "-"]} description="Zoom out" />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-3">Canvas Actions</h4>
                <div className="space-y-1 border border-border rounded-lg p-3">
                  <ShortcutItem keys={["V"]} description="Select tool" />
                  <ShortcutItem keys={["H"]} description="Hand/Pan tool" />
                  <ShortcutItem keys={["T"]} description="Text tool" />
                  <ShortcutItem keys={["N"]} description="New card" />
                  <ShortcutItem keys={["Delete"]} description="Delete selected" />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-3">General</h4>
                <div className="space-y-1 border border-border rounded-lg p-3">
                  <ShortcutItem keys={["⌘", "S"]} description="Save" />
                  <ShortcutItem keys={["⌘", "Z"]} description="Undo" />
                  <ShortcutItem keys={["⌘", "⇧", "Z"]} description="Redo" />
                  <ShortcutItem keys={["⌘", ","]} description="Open settings" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="support" className="mt-0 space-y-4">
              <p className="text-sm text-muted-foreground">
                Need help? We're here to assist you.
              </p>

              <div className="space-y-3">
                <SupportLink
                  icon={BookOpen}
                  title="Documentation"
                  description="Learn how to use all features effectively"
                  href="https://docs.lovable.dev/"
                />
                <SupportLink
                  icon={MessageCircle}
                  title="Community Discord"
                  description="Join our community for tips and discussions"
                  href="https://discord.com/channels/1119885301872070706/1280461670979993613"
                />
                <SupportLink
                  icon={Mail}
                  title="Contact Support"
                  description="Get help from our support team"
                  href="mailto:support@lovable.dev"
                />
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  Version 1.0.0 • Made with ❤️ by Lovable
                </p>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
