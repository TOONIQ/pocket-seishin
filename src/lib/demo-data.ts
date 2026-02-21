import { db, getSetting, setSetting } from "@/lib/db";
import type { Step, WorkType } from "@/types/cut";

export const DEMO_PROJECT = "魔法少女ぽけっと";
export const DEMO_MARKER = "__demo__";

interface DemoCut {
  cutNumber: string;
  step: Step;
  deadline?: string;
  workType: WorkType;
  pricePerCut: number;
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const DEMO_CUTS: DemoCut[] = [
  { cutNumber: "C001", step: "received", deadline: daysFromNow(3), workType: "genga", pricePerCut: 4500 },
  { cutNumber: "C002", step: "working", workType: "genga", pricePerCut: 4500 },
  { cutNumber: "C003", step: "submitted", workType: "douga", pricePerCut: 3000 },
  { cutNumber: "C004", step: "retake", deadline: daysFromNow(7), workType: "genga", pricePerCut: 4500 },
  { cutNumber: "C005", step: "done", workType: "genga", pricePerCut: 4500 },
];

export async function insertDemoData(): Promise<void> {
  // Skip if demo data already exists
  if (await hasDemoData()) return;

  const now = new Date().toISOString();

  // Insert demo studio
  const studioId = (await db.studios.add({
    name: "スタジオぽけっと",
    shortName: "ぽけ",
    defaultPricePerCut: 4500,
    notes: DEMO_MARKER,
  })) as number;

  // Insert demo cuts
  for (const dc of DEMO_CUTS) {
    await db.cuts.add({
      projectName: DEMO_PROJECT,
      episodeNumber: 1,
      cutNumber: dc.cutNumber,
      step: dc.step,
      workType: dc.workType,
      pricingType: "per_cut",
      pricePerCut: dc.pricePerCut,
      sheetCount: 0,
      studioId,
      deadline: dc.deadline,
      retakeCount: dc.step === "retake" ? 1 : 0,
      notes: DEMO_MARKER,
      createdAt: now,
      updatedAt: now,
      completedAt: dc.step === "done" ? now : undefined,
    });
  }

  // Save monthly target (preserve original)
  const original = await getSetting("monthly_target");
  if (original) {
    await setSetting("demo_original_target", original);
  }
  await setSetting("monthly_target", "200000");
}

export async function removeDemoData(): Promise<void> {
  // Remove demo cuts
  const demoCuts = await db.cuts.filter((c) => c.notes === DEMO_MARKER).toArray();
  await db.cuts.bulkDelete(demoCuts.map((c) => c.id!));

  // Remove demo studios
  const demoStudios = await db.studios.filter((s) => s.notes === DEMO_MARKER).toArray();
  await db.studios.bulkDelete(demoStudios.map((s) => s.id!));

  // Restore original monthly target
  const original = await getSetting("demo_original_target");
  if (original) {
    await setSetting("monthly_target", original);
    await db.settings.delete("demo_original_target");
  } else {
    await setSetting("monthly_target", "");
  }
}

export async function hasDemoData(): Promise<boolean> {
  const count = await db.cuts.filter((c) => c.notes === DEMO_MARKER).count();
  return count > 0;
}
