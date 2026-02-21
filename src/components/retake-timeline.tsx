"use client";

import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import type { RetakeHistory } from "@/types/cut";

interface RetakeTimelineProps {
  history: RetakeHistory[];
}

export function RetakeTimeline({ history }: RetakeTimelineProps) {
  if (history.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-red-400">
        リテイク履歴 ({history.length}回)
      </h3>
      <div className="relative pl-4 border-l-2 border-red-400/30 space-y-3">
        {history.map((entry, idx) => (
          <div key={entry.id ?? idx} className="relative">
            {/* Dot */}
            <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-red-400/60 border-2 border-background" />

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">
                  {format(parseISO(entry.returnedAt), "M/d HH:mm", {
                    locale: ja,
                  })}
                </span>
                {entry.resolvedAt && (
                  <span className="text-[10px] text-green-400">
                    解決済
                  </span>
                )}
              </div>
              {entry.reason && (
                <p className="text-sm text-foreground/80">{entry.reason}</p>
              )}
              {entry.resolvedAt && (
                <p className="text-[10px] text-muted-foreground">
                  解決: {format(parseISO(entry.resolvedAt), "M/d HH:mm", {
                    locale: ja,
                  })}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
