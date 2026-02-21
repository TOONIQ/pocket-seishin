"use client";

import { parseISO, differenceInDays, isToday, isTomorrow, isPast, format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DeadlineBadgeProps {
  deadline: string;
  className?: string;
}

export function DeadlineBadge({ deadline, className }: DeadlineBadgeProps) {
  const date = parseISO(deadline);
  const daysUntil = differenceInDays(date, new Date());

  let label: string;
  let urgencyClass: string;

  if (isPast(date) && !isToday(date)) {
    label = `${Math.abs(daysUntil)}日超過`;
    urgencyClass = "text-red-400 bg-red-400/10";
  } else if (isToday(date)) {
    label = "今日締切";
    urgencyClass = "text-red-400 bg-red-400/10";
  } else if (isTomorrow(date)) {
    label = "明日締切";
    urgencyClass = "text-yellow-400 bg-yellow-400/10";
  } else if (daysUntil <= 3) {
    label = `${daysUntil}日後`;
    urgencyClass = "text-yellow-400 bg-yellow-400/10";
  } else {
    label = format(date, "M/d (E)", { locale: ja });
    urgencyClass = "text-muted-foreground bg-muted";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded",
        urgencyClass,
        className
      )}
    >
      {label}
    </span>
  );
}
