import { db, type Settings } from "@/lib/db";
import type { Studio, Cut, QuickLink, RetakeHistory } from "@/types/cut";

export interface BackupData {
  version: string;
  exportedAt: string;
  tables: {
    studios: Studio[];
    cuts: Cut[];
    retakeHistory: RetakeHistory[];
    quickLinks: QuickLink[];
    settings: Settings[];
  };
}

export async function exportAllData(): Promise<BackupData> {
  const [studios, cuts, retakeHistory, quickLinks, settings] =
    await Promise.all([
      db.studios.toArray(),
      db.cuts.toArray(),
      db.retakeHistory.toArray(),
      db.quickLinks.toArray(),
      db.settings.toArray(),
    ]);

  return {
    version: "0.3.1",
    exportedAt: new Date().toISOString(),
    tables: { studios, cuts, retakeHistory, quickLinks, settings },
  };
}

export async function importAllData(data: BackupData): Promise<void> {
  await db.transaction(
    "rw",
    [db.studios, db.cuts, db.retakeHistory, db.quickLinks, db.settings],
    async () => {
      await db.studios.clear();
      await db.cuts.clear();
      await db.retakeHistory.clear();
      await db.quickLinks.clear();
      await db.settings.clear();

      if (data.tables.studios.length > 0)
        await db.studios.bulkAdd(data.tables.studios);
      if (data.tables.cuts.length > 0)
        await db.cuts.bulkAdd(data.tables.cuts);
      if (data.tables.retakeHistory.length > 0)
        await db.retakeHistory.bulkAdd(data.tables.retakeHistory);
      if (data.tables.quickLinks.length > 0)
        await db.quickLinks.bulkAdd(data.tables.quickLinks);
      if (data.tables.settings.length > 0)
        await db.settings.bulkAdd(data.tables.settings);
    }
  );
}
