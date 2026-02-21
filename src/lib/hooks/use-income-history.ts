"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { getCutTotalPrice } from "@/types/cut";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";

export interface MonthlyIncome {
  month: string; // "2026年2月" format
  earned: number;
  cutCount: number;
}

export function useIncomeHistory(monthsBack: number = 6): MonthlyIncome[] | undefined {
  return useLiveQuery(async () => {
    const now = new Date();
    const result: MonthlyIncome[] = [];

    for (let i = monthsBack - 1; i >= 0; i--) {
      const target = subMonths(now, i);
      const monthStart = startOfMonth(target);
      const monthEnd = endOfMonth(target);

      const cuts = await db.cuts
        .filter((c) => {
          if (c.step !== "done" || !c.completedAt) return false;
          const d = new Date(c.completedAt);
          return d >= monthStart && d <= monthEnd;
        })
        .toArray();

      const earned = cuts.reduce((sum, c) => sum + getCutTotalPrice(c), 0);

      result.push({
        month: format(target, "yyyy年M月"),
        earned,
        cutCount: cuts.length,
      });
    }

    return result;
  }, [monthsBack]);
}
