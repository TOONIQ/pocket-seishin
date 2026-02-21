"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Cut, Step, WorkType } from "@/types/cut";
import { STEPS } from "@/lib/steps";

export function useCuts(filters?: {
  projectName?: string;
  step?: Step;
  studioId?: number;
  workType?: WorkType;
}) {
  return useLiveQuery(async () => {
    let collection = db.cuts.toCollection();

    if (filters?.projectName) {
      collection = db.cuts.where("projectName").equals(filters.projectName);
    }

    let results = await collection.toArray();

    if (filters?.step) {
      results = results.filter((c) => c.step === filters.step);
    }
    if (filters?.studioId !== undefined) {
      results = results.filter((c) => c.studioId === filters.studioId);
    }
    if (filters?.workType) {
      results = results.filter((c) => c.workType === filters.workType);
    }

    // Sort: retake → working → received → submitted → done
    const stepOrder: Record<Step, number> = {
      retake: 0,
      working: 1,
      received: 2,
      submitted: 3,
      done: 4,
    };

    return results.sort((a, b) => {
      const stepA = stepOrder[a.step];
      const stepB = stepOrder[b.step];
      if (stepA !== stepB) return stepA - stepB;
      return a.cutNumber.localeCompare(b.cutNumber);
    });
  }, [filters?.projectName, filters?.step, filters?.studioId, filters?.workType]);
}

export function useCut(cutId: number | undefined) {
  return useLiveQuery(
    async () => {
      if (!cutId) return undefined;
      return db.cuts.get(cutId);
    },
    [cutId]
  );
}

export function useRetakeHistory(cutId: number | undefined) {
  return useLiveQuery(
    async () => {
      if (!cutId) return [];
      return db.retakeHistory
        .where("cutId")
        .equals(cutId)
        .reverse()
        .sortBy("returnedAt");
    },
    [cutId]
  );
}

export async function addCut(
  cut: Omit<Cut, "id" | "updatedAt" | "createdAt" | "retakeCount">
): Promise<number> {
  const now = new Date().toISOString();
  const id = (await db.cuts.add({
    ...cut,
    retakeCount: 0,
    createdAt: now,
    updatedAt: now,
  } as Cut)) as number;
  return id;
}

export async function updateCutStep(
  cutId: number,
  newStep: Step,
  retakeReason?: string
): Promise<void> {
  const now = new Date().toISOString();

  await db.transaction("rw", [db.cuts, db.retakeHistory], async () => {
    const cut = await db.cuts.get(cutId);
    if (!cut) return;

    const updates: Partial<Cut> = {
      step: newStep,
      updatedAt: now,
    };

    // When entering retake, record history and increment counter
    if (newStep === "retake") {
      updates.retakeCount = (cut.retakeCount || 0) + 1;
      await db.retakeHistory.add({
        cutId,
        returnedAt: now,
        reason: retakeReason,
      });
    }

    // When retake resolves (going back to working), mark resolved
    if (cut.step === "retake" && newStep === "working") {
      const latestRetake = await db.retakeHistory
        .where("cutId")
        .equals(cutId)
        .last();
      if (latestRetake?.id && !latestRetake.resolvedAt) {
        await db.retakeHistory.update(latestRetake.id, {
          resolvedAt: now,
        });
      }
    }

    // When completing
    if (newStep === "done") {
      updates.completedAt = now;
    }

    await db.cuts.update(cutId, updates);
  });
}

export async function updateCut(
  id: number,
  data: Partial<Omit<Cut, "id" | "createdAt" | "step" | "retakeCount">>
): Promise<void> {
  await db.cuts.update(id, { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteCut(cutId: number): Promise<void> {
  await db.transaction("rw", [db.cuts, db.retakeHistory, db.syncQueue], async () => {
    await db.retakeHistory.where("cutId").equals(cutId).delete();
    await db.cuts.delete(cutId);
  });
}

export function useProjects() {
  return useLiveQuery(async () => {
    const cuts = await db.cuts.toArray();
    const projects = [...new Set(cuts.map((c) => c.projectName))];
    return projects.sort();
  });
}

export function useStudios() {
  return useLiveQuery(() => db.studios.toArray());
}
