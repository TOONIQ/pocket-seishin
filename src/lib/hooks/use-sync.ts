"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/db";
import type { SyncState } from "@/types/sync";

export function useSyncState(): SyncState {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const pendingCount = useLiveQuery(
    () => db.syncQueue.count(),
    [],
    0
  );

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    error,
  };
}

export function useSyncActions() {
  const sync = useCallback(async () => {
    // Phase 2: AnimaTime sync implementation
    console.log("Sync not yet implemented (Phase 2)");
  }, []);

  return { sync };
}
