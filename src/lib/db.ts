import Dexie, { type EntityTable } from "dexie";
import type { Cut, RetakeHistory, Studio, QuickLink } from "@/types/cut";
import type { SyncQueue } from "@/types/sync";

export interface Settings {
  key: string;
  value: string;
}

class SeishinDB extends Dexie {
  studios!: EntityTable<Studio, "id">;
  cuts!: EntityTable<Cut, "id">;
  retakeHistory!: EntityTable<RetakeHistory, "id">;
  quickLinks!: EntityTable<QuickLink, "id">;
  syncQueue!: EntityTable<SyncQueue, "id">;
  settings!: EntityTable<Settings, "key">;

  constructor() {
    super("seishin");

    this.version(1).stores({
      studios: "++id, name",
      cuts: "++id, studioId, projectName, episodeNumber, cutNumber, currentPhase, currentStatus, deadline, isPriority, updatedAt",
      cutPhases: "++id, cutId, phase, status",
      syncQueue: "++id, cutId, operation, createdAt",
      settings: "key",
    });

    this.version(2)
      .stores({
        studios: "++id, name",
        cuts: "++id, studioId, projectName, episodeNumber, cutNumber, step, deadline, updatedAt, completedAt",
        cutPhases: null, // delete table
        retakeHistory: "++id, cutId, returnedAt",
        syncQueue: "++id, cutId, operation, createdAt",
        settings: "key",
      })
      .upgrade(async (tx) => {
        // Migrate existing cuts
        const cuts = tx.table("cuts");
        await cuts.toCollection().modify((cut: Record<string, unknown>) => {
          // Map old status to new step
          const statusMap: Record<string, string> = {
            completed: "done",
            in_progress: "working",
            pending: "received",
            retake: "retake",
            delayed: "working",
          };
          const oldStatus = (cut.currentStatus as string) || "pending";
          cut.step = statusMap[oldStatus] || "received";

          // Initialize new fields
          cut.pricePerCut = 0;
          cut.retakeCount = 0;
          cut.createdAt = cut.updatedAt || new Date().toISOString();
          if (oldStatus === "completed") {
            cut.completedAt = cut.updatedAt;
          }

          // Remove old fields
          delete cut.currentPhase;
          delete cut.currentStatus;
          delete cut.difficulty;
          delete cut.isPriority;
          delete cut.finalDeadline;
          delete cut.syncedAt;
        });

        // Add default fields to studios
        const studios = tx.table("studios");
        await studios.toCollection().modify((studio: Record<string, unknown>) => {
          studio.defaultPricePerCut = 0;
        });
      });

    this.version(3)
      .stores({
        studios: "++id, name",
        cuts: "++id, studioId, projectName, episodeNumber, cutNumber, step, workType, deadline, updatedAt, completedAt",
        retakeHistory: "++id, cutId, returnedAt",
        syncQueue: "++id, cutId, operation, createdAt",
        settings: "key",
      })
      .upgrade(async (tx) => {
        const cuts = tx.table("cuts");
        await cuts.toCollection().modify((cut: Record<string, unknown>) => {
          if (!cut.workType) {
            cut.workType = "genga";
          }
        });
      });

    this.version(4).stores({
      studios: "++id, name",
      cuts: "++id, studioId, projectName, episodeNumber, cutNumber, step, workType, deadline, updatedAt, completedAt",
      retakeHistory: "++id, cutId, returnedAt",
      quickLinks: "++id, order",
      syncQueue: "++id, cutId, operation, createdAt",
      settings: "key",
    });

    this.version(5)
      .stores({
        studios: "++id, name",
        cuts: "++id, studioId, projectName, episodeNumber, sceneNumber, cutNumber, step, workType, deadline, updatedAt, completedAt",
        retakeHistory: "++id, cutId, returnedAt",
        quickLinks: "++id, order",
        syncQueue: "++id, cutId, operation, createdAt",
        settings: "key",
      })
      .upgrade(async (tx) => {
        const cuts = tx.table("cuts");
        await cuts.toCollection().modify((cut: Record<string, unknown>) => {
          if (!cut.pricingType) cut.pricingType = "per_cut";
          if (cut.sheetCount === undefined) cut.sheetCount = 0;
        });
      });
  }
}

export const db = new SeishinDB();

export async function getSetting(key: string): Promise<string | undefined> {
  const setting = await db.settings.get(key);
  return setting?.value;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.settings.put({ key, value });
}
