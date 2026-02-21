"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { isToday, isTomorrow, isPast, differenceInDays, parseISO } from "date-fns";
import type { Cut } from "@/types/cut";

export interface DeadlineGroup {
  label: string;
  cuts: Cut[];
  isUrgent: boolean;
}

export function useDeadlines() {
  return useLiveQuery(async () => {
    const cuts = await db.cuts
      .filter((c) => c.step !== "done" && !!c.deadline)
      .toArray();

    const overdue: Cut[] = [];
    const today: Cut[] = [];
    const tomorrow: Cut[] = [];
    const thisWeek: Cut[] = [];

    for (const cut of cuts) {
      if (!cut.deadline) continue;
      const deadline = parseISO(cut.deadline);
      if (isPast(deadline) && !isToday(deadline)) {
        overdue.push(cut);
      } else if (isToday(deadline)) {
        today.push(cut);
      } else if (isTomorrow(deadline)) {
        tomorrow.push(cut);
      } else if (differenceInDays(deadline, new Date()) <= 7) {
        thisWeek.push(cut);
      }
    }

    const groups: DeadlineGroup[] = [];
    if (overdue.length > 0) groups.push({ label: "期限超過", cuts: overdue, isUrgent: true });
    if (today.length > 0) groups.push({ label: "今日", cuts: today, isUrgent: true });
    if (tomorrow.length > 0) groups.push({ label: "明日", cuts: tomorrow, isUrgent: false });
    if (thisWeek.length > 0) groups.push({ label: "今週", cuts: thisWeek, isUrgent: false });

    return groups;
  });
}

export function useDeadlineCount() {
  return useLiveQuery(async () => {
    const cuts = await db.cuts
      .filter(
        (c) =>
          c.step !== "done" &&
          !!c.deadline &&
          differenceInDays(parseISO(c.deadline), new Date()) <= 3
      )
      .count();
    return cuts;
  });
}
