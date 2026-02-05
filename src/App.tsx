import { useEffect } from "react";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
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
}

// Theme provider component
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, uiScale } = useAppearanceSettings();

  useEffect(() => {
    const root = document.documentElement;

    // Apply UI scaling
    root.style.fontSize = `${(uiScale || 1.0) * 100}%`;

    // Remove existing theme classes
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);

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
            <HashRouter>
              <Routes>
                <Route path="/" element={<Projects />} />
                <Route path="/canvas" element={<Index />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </HashRouter>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
