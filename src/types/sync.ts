export type SyncOperation = "create" | "update" | "delete";

export interface SyncQueue {
  id?: number;
  cutId: number;
  operation: SyncOperation;
  payload: string;
  createdAt: string;
  retryCount: number;
}

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt?: string;
  error?: string;
}
