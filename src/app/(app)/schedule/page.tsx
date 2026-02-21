"use client";

import { useMemo } from "react";
import { useCuts } from "@/lib/hooks/use-cuts";
import { CutCard } from "@/components/cut-card";
import { getCutTotalPrice } from "@/types/cut";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { STEPS, STEP_LABELS } from "@/lib/steps";
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  addWeeks,
  isToday,
} from "date-fns";
import { ja } from "date-fns/locale";

export default function SchedulePage() {
  const cuts = useCuts();

  const cutsWithDeadlines = useMemo(
    () =>
      (cuts ?? [])
        .filter((c) => c.deadline && c.step !== "done")
        .sort((a, b) => a.deadline!.localeCompare(b.deadline!)),
    [cuts]
  );

  const now = new Date();
  const weeks = [0, 1, 2].map((offset) => {
    const weekStart = startOfWeek(addWeeks(now, offset), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(addWeeks(now, offset), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    return { weekStart, weekEnd, days };
  });

  // Step summary
  const stepSummary = STEPS.filter((s) => s !== "done").map((step) => ({
    step,
    count: (cuts ?? []).filter((c) => c.step === step).length,
  })).filter((p) => p.count > 0);

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-lg font-bold">スケジュール</h2>

      {/* Step summary */}
      {stepSummary.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {stepSummary.map(({ step, count }) => (
            <Badge key={step} variant="secondary" className="text-xs">
              {STEP_LABELS[step]}: {count}
            </Badge>
          ))}
        </div>
      )}

      {/* Weekly Timeline */}
      {(() => {
        let firstDeadlineMarked = false;
        return weeks.map(({ weekStart, days }, weekIdx) => (
          <div key={weekIdx} className="space-y-2">
            <h3 className="text-sm font-bold text-muted-foreground">
              {weekIdx === 0
                ? "今週"
                : weekIdx === 1
                  ? "来週"
                  : format(weekStart, "M/d〜", { locale: ja })}
            </h3>

            <div className="space-y-1">
              {days.map((day) => {
                const dayCuts = cutsWithDeadlines.filter(
                  (c) => c.deadline && isSameDay(parseISO(c.deadline), day)
                );
                const todayFlag = isToday(day);

                // Mark first day with deadlines for tutorial spotlight
                const shouldMark = dayCuts.length > 0 && !firstDeadlineMarked;
                if (shouldMark) firstDeadlineMarked = true;

                // Calculate daily price total
                const dayTotal = dayCuts.reduce((sum, c) => sum + getCutTotalPrice(c), 0);

                return (
                  <div
                    key={day.toISOString()}
                    className={`rounded-lg p-2 ${
                      todayFlag ? "bg-primary/5 border border-primary/20" : ""
                    } ${dayCuts.length === 0 ? "opacity-50" : ""}`}
                    {...(shouldMark ? { "data-tutorial": "schedule-deadline" } : {})}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-mono ${
                          todayFlag ? "text-primary font-bold" : "text-muted-foreground"
                        }`}
                      >
                        {format(day, "M/d (E)", { locale: ja })}
                      </span>
                      {dayCuts.length > 0 && (
                        <Badge variant="secondary" className="text-[10px]">
                          {dayCuts.length}件
                        </Badge>
                      )}
                      {dayTotal > 0 && (
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          ¥{dayTotal.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {dayCuts.length > 0 && (
                      <div className="space-y-1 ml-2">
                        {dayCuts.map((cut) => (
                          <CutCard key={cut.id} cut={cut} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ));
      })()}

      {/* No deadlines */}
      {cutsWithDeadlines.length === 0 && (
        <Card className="p-8 text-center gap-2">
          <p className="text-4xl">📅</p>
          <p className="text-sm font-medium">締切のあるカットがありません</p>
          <p className="text-xs text-muted-foreground">
            カットに締切日を設定するとここに表示されます
          </p>
        </Card>
      )}
    </div>
  );
}
