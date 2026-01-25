import { Loader2 } from "lucide-react";

export const LoadingScreen = () => {
    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-background gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm animate-pulse">Loading workspace...</p>
        </div>
    );
};
