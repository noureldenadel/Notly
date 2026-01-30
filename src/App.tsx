import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppInitializer } from "@/components/AppInitializer";
import { setupGlobalErrorHandlers, logError, type AppError } from "@/lib/errorHandling";
import { useAppearanceSettings } from "@/stores/settingsStore";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Handle global errors
function handleGlobalError(error: AppError) {
  logError(error);
  // Could add toast notification here if needed
}

// Theme provider component
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, uiScale } = useAppearanceSettings();

  useEffect(() => {
    const root = document.documentElement;

    // Apply UI scaling
    // Standard base font-size is 16px (100%). We scale this percentage.
    // Tailwind uses rems, so changing root font-size scales everything.
    root.style.fontSize = `${(uiScale || 1.0) * 100}%`;

    // Remove existing theme classes
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      // Use system preference
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);

      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        root.classList.remove('light', 'dark');
        root.classList.add(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      root.classList.add(theme);
    }
  }, [theme, uiScale]);

  return <>{children}</>;
}


const App = () => {
  // Set up global error handlers
  useEffect(() => {
    const cleanup = setupGlobalErrorHandlers(handleGlobalError);
    return cleanup;
  }, []);

  return (
    <ErrorBoundary showDetails={import.meta.env.DEV} onError={handleGlobalError}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeProvider>
            <AppInitializer />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Projects />} />
                <Route path="/canvas" element={<Index />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;

