"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useState, useEffect } from "react";
import { db, getSetting, setSetting } from "@/lib/db";
import { getCutTotalPrice } from "@/types/cut";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isWeekend,
  isAfter,
  startOfDay,
} from "date-fns";

export interface IncomeData {
  monthlyTarget: number;
  earned: number;
  remaining: number;
  completedCuts: number;
  remainingCuts: number;
  dailyQuota: number;
  remainingBusinessDays: number;
  averagePrice: number;
}

export function useIncome(): IncomeData | undefined {
  const [monthlyTarget, setMonthlyTarget] = useState(0);

  useEffect(() => {
    getSetting("monthly_target").then((val) => {
      if (val) setMonthlyTarget(parseInt(val));
    });
  }, []);

  const data = useLiveQuery(async () => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Get cuts completed this month
    const completedCuts = await db.cuts
      .filter((c) => {
        if (c.step !== "done" || !c.completedAt) return false;
        const completedDate = new Date(c.completedAt);
        return completedDate >= monthStart && completedDate <= monthEnd;
      })
      .toArray();

    const earned = completedCuts.reduce((sum, c) => sum + getCutTotalPrice(c), 0);

    // Calculate average price from all cuts with price set
    const allCutsWithPrice = await db.cuts
      .filter((c) => c.pricePerCut > 0)
      .toArray();
    const averagePrice =
      allCutsWithPrice.length > 0
        ? allCutsWithPrice.reduce((sum, c) => sum + getCutTotalPrice(c), 0) /
          allCutsWithPrice.length
        : 0;

    // Calculate remaining business days this month
    const today = startOfDay(now);
    const remainingDays = eachDayOfInterval({ start: today, end: monthEnd });
    const remainingBusinessDays = remainingDays.filter(
      (d) => !isWeekend(d)
    ).length;

    const target = monthlyTarget;
    const remaining = Math.max(0, target - earned);
    const remainingCuts =
      averagePrice > 0 ? Math.ceil(remaining / averagePrice) : 0;
    const dailyQuota =
      remainingBusinessDays > 0 ? remainingCuts / remainingBusinessDays : 0;

    return {
      monthlyTarget: target,
      earned,
      remaining,
      completedCuts: completedCuts.length,
      remainingCuts,
      dailyQuota,
      remainingBusinessDays,
      averagePrice,
    };
  }, [monthlyTarget]);

  return data;
}

export async function setMonthlyTarget(amount: number): Promise<void> {
  await setSetting("monthly_target", String(amount));
}
