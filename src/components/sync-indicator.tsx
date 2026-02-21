"use client";

import { useSyncState } from "@/lib/hooks/use-sync";
import { cn } from "@/lib/utils";

export function SyncIndicator() {
  const { isOnline, isSyncing, pendingCount } = useSyncState();

  if (isOnline && pendingCount === 0 && !isSyncing) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          !isOnline
            ? "bg-yellow-400"
            : isSyncing
              ? "bg-cyan-400 animate-pulse"
              : "bg-green-400"
        )}
      />
      <span className="text-muted-foreground">
        {!isOnline
          ? "オフライン"
          : isSyncing
            ? "同期中..."
            : pendingCount > 0
              ? `未同期: ${pendingCount}`
              : ""}
      </span>
    </div>
  );
}
