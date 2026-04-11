import { cn } from "@/lib/utils";

import { liveConnectionLabel } from "@/lib/session-user-copy";

interface ConnectionStatusProps {
  isConnected: boolean;
  className?: string;
}

export function ConnectionStatus({ isConnected, className }: ConnectionStatusProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground", className)}>
      <span
        className={cn("size-1.5 rounded-full", isConnected ? "bg-primary" : "bg-muted-foreground/40 animate-pulse")}
        aria-hidden
      />
      {liveConnectionLabel(isConnected)}
    </span>
  );
}
