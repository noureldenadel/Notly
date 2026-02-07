import * as React from "react";

import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 300;

// Duration in milliseconds for each variant
export const TOAST_DURATIONS = {
  default: 5000,
  destructive: 6000,
  success: 3000,
  error: 6000,
  warning: 5000,
  info: 4000,
} as const;

type ToastVariant = keyof typeof TOAST_DURATIONS;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  duration?: number;
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const autoDismissTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const toastStartTimes = new Map<string, number>();
const toastRemainingTimes = new Map<string, number>();
const toastDurations = new Map<string, number>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

const addAutoDismiss = (toastId: string, duration: number) => {
  if (autoDismissTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    autoDismissTimeouts.delete(toastId);
    toastStartTimes.delete(toastId);
    toastRemainingTimes.delete(toastId);
    toastDurations.delete(toastId);
    dispatch({ type: "DISMISS_TOAST", toastId });
  }, duration);

  autoDismissTimeouts.set(toastId, timeout);
  toastStartTimes.set(toastId, Date.now());
  toastDurations.set(toastId, duration);
};

const clearAutoDismiss = (toastId: string) => {
  const timeout = autoDismissTimeouts.get(toastId);
  if (timeout) {
    clearTimeout(timeout);
    autoDismissTimeouts.delete(toastId);
  }
  toastStartTimes.delete(toastId);
  toastRemainingTimes.delete(toastId);
  toastDurations.delete(toastId);
};

const pauseAutoDismiss = (toastId: string) => {
  const timeout = autoDismissTimeouts.get(toastId);
  const startTime = toastStartTimes.get(toastId);
  const duration = toastDurations.get(toastId);
  
  if (timeout && startTime && duration) {
    clearTimeout(timeout);
    autoDismissTimeouts.delete(toastId);
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(duration - elapsed, 0);
    toastRemainingTimes.set(toastId, remaining);
  }
};

const resumeAutoDismiss = (toastId: string) => {
  const remaining = toastRemainingTimes.get(toastId);
  
  if (remaining !== undefined && remaining > 0 && !autoDismissTimeouts.has(toastId)) {
    const timeout = setTimeout(() => {
      autoDismissTimeouts.delete(toastId);
      toastStartTimes.delete(toastId);
      toastRemainingTimes.delete(toastId);
      toastDurations.delete(toastId);
      dispatch({ type: "DISMISS_TOAST", toastId });
    }, remaining);
    
    autoDismissTimeouts.set(toastId, timeout);
    toastStartTimes.set(toastId, Date.now());
    toastDurations.set(toastId, remaining);
  }
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      {
        const variant = (action.toast as any).variant as ToastVariant | undefined;
        const duration = action.toast.duration ?? TOAST_DURATIONS[variant || "default"];
        addAutoDismiss(action.toast.id, duration);
        return {
          ...state,
          toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
        };
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      if (toastId) {
        addToRemoveQueue(toastId);
        clearAutoDismiss(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
          clearAutoDismiss(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t,
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      clearAutoDismiss(action.toastId);
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

type Toast = Omit<ToasterToast, "id">;

function toast({ duration, ...props }: Toast) {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      duration,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

// Helper functions for different toast variants
toast.success = (props: Omit<Toast, "variant">) => toast({ ...props, variant: "success" });
toast.error = (props: Omit<Toast, "variant">) => toast({ ...props, variant: "error" });
toast.warning = (props: Omit<Toast, "variant">) => toast({ ...props, variant: "warning" });
toast.info = (props: Omit<Toast, "variant">) => toast({ ...props, variant: "info" });

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast, pauseAutoDismiss, resumeAutoDismiss };
