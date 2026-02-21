"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Studio } from "@/types/cut";

export interface StudioWithStats extends Studio {
  totalCuts: number;
  totalRetakes: number;
  retakeRate: number;
}

export function useStudiosWithStats() {
  return useLiveQuery(async () => {
    const studios = await db.studios.toArray();
    const cuts = await db.cuts.toArray();

    return studios.map((studio) => {
      const studioCuts = cuts.filter((c) => c.studioId === studio.id);
      const totalCuts = studioCuts.length;
      const totalRetakes = studioCuts.reduce(
        (sum, c) => sum + (c.retakeCount || 0),
        0
      );
      const retakeRate = totalCuts > 0 ? totalRetakes / totalCuts : 0;

      return {
        ...studio,
        totalCuts,
        totalRetakes,
        retakeRate,
      } as StudioWithStats;
    });
  });
}

export async function addStudio(
  studio: Omit<Studio, "id">
): Promise<number> {
  return (await db.studios.add(studio as Studio)) as number;
}

export async function updateStudio(
  id: number,
  updates: Partial<Omit<Studio, "id">>
): Promise<void> {
  await db.studios.update(id, updates);
}

export async function deleteStudio(id: number): Promise<void> {
  await db.studios.delete(id);
}
