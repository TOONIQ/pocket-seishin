"use client";

import { cn } from "@/lib/utils";
import type { Step } from "@/types/cut";

const DISPLAY_STEPS = ["受取", "作業中", "提出済", "完了"] as const;

interface StepIndicatorProps {
  step: Step;
  retakeCount?: number;
  compact?: boolean;
}

export function StepIndicator({ step, retakeCount = 0, compact }: StepIndicatorProps) {
  // Map step to display index (0-3)
  const stepIndex: Record<Step, number> = {
    received: 0,
    working: 1,
    submitted: 2,
    retake: 1, // maps to working position
    done: 3,
  };
  const currentIdx = stepIndex[step];
  const isRetake = step === "retake";

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {DISPLAY_STEPS.map((_, idx) => (
          <div
            key={idx}
            className={cn(
              "h-1.5 rounded-full flex-1 transition-colors",
              idx < currentIdx
                ? "bg-green-400"
                : idx === currentIdx
                  ? isRetake
                    ? "bg-red-400 animate-pulse"
                    : step === "done"
                      ? "bg-green-400"
                      : "bg-cyan-400"
                  : "bg-muted"
            )}
          />
        ))}
        {retakeCount > 0 && (
          <span className="text-[9px] text-red-400 font-mono ml-0.5">
            R{retakeCount}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {DISPLAY_STEPS.map((label, idx) => {
        const isCompleted = idx < currentIdx || (idx === currentIdx && step === "done");
        const isCurrent = idx === currentIdx && step !== "done";
        const isFuture = idx > currentIdx;

        return (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                isCompleted && "bg-green-400/20 text-green-400",
                isCurrent && !isRetake && "bg-cyan-400/20 text-cyan-400",
                isCurrent && isRetake && "bg-red-400/20 text-red-400 animate-pulse",
                isFuture && "bg-muted text-muted-foreground"
              )}
            >
              {isCompleted ? "✓" : isCurrent ? (isRetake ? "!" : "▶") : idx + 1}
            </div>
            <span
              className={cn(
                "text-[10px]",
                isCompleted && "text-green-400",
                isCurrent && !isRetake && "text-cyan-400",
                isCurrent && isRetake && "text-red-400",
                isFuture && "text-muted-foreground"
              )}
            >
              {idx === 1 && isRetake ? "リテイク" : label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
