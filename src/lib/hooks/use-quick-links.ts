"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { QuickLink, QuickLinkType } from "@/types/cut";

export function useQuickLinks() {
  return useLiveQuery(() => db.quickLinks.orderBy("order").toArray());
}

export async function addQuickLink(
  link: Omit<QuickLink, "id" | "order">
): Promise<number> {
  const count = await db.quickLinks.count();
  return (await db.quickLinks.add({
    ...link,
    order: count,
  } as QuickLink)) as number;
}

export async function updateQuickLink(
  id: number,
  updates: Partial<Omit<QuickLink, "id">>
): Promise<void> {
  await db.quickLinks.update(id, updates);
}

export async function deleteQuickLink(id: number): Promise<void> {
  await db.quickLinks.delete(id);
}

export async function swapQuickLinkOrder(
  idA: number,
  orderA: number,
  idB: number,
  orderB: number
): Promise<void> {
  await db.transaction("rw", db.quickLinks, async () => {
    await db.quickLinks.update(idA, { order: orderB });
    await db.quickLinks.update(idB, { order: orderA });
  });
}

export function detectLinkType(value: string): QuickLinkType {
  if (/^https?:\/\//.test(value)) return "url";
  if (/^0\d{1,4}-?\d{1,4}-?\d{3,4}$/.test(value.replace(/[\s-]/g, ""))) return "tel";
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "email";
  return "other";
}
