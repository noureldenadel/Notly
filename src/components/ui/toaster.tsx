import { useState } from "react";
import { useToast, pauseAutoDismiss, resumeAutoDismiss, TOAST_DURATIONS } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();
  const [pausedToasts, setPausedToasts] = useState<Set<string>>(new Set());

  const handleMouseEnter = (id: string) => {
    pauseAutoDismiss(id);
    setPausedToasts(prev => new Set(prev).add(id));
  };

  const handleMouseLeave = (id: string) => {
    resumeAutoDismiss(id);
    setPausedToasts(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, duration, ...props }) {
        const toastDuration = duration ?? TOAST_DURATIONS[variant as keyof typeof TOAST_DURATIONS] ?? TOAST_DURATIONS.default;
        
        return (
          <Toast 
            key={id} 
            variant={variant}
            duration={toastDuration}
            isPaused={pausedToasts.has(id)}
            {...props}
            onMouseEnter={() => handleMouseEnter(id)}
            onMouseLeave={() => handleMouseLeave(id)}
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
