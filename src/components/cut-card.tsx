"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StepIndicator } from "@/components/step-indicator";
import { DeadlineBadge } from "@/components/deadline-badge";
import { STEP_LABELS, STEP_BG_COLORS, WORK_TYPE_SHORT } from "@/lib/steps";
import { type Cut, getCutTotalPrice } from "@/types/cut";
import { cn } from "@/lib/utils";
import { useStudios } from "@/lib/hooks/use-cuts";

interface CutCardProps {
  cut: Cut;
}

export function CutCard({ cut }: CutCardProps) {
  const studios = useStudios();
  const studio = studios?.find((s) => s.id === cut.studioId);

  return (
    <Link href={`/cuts/${cut.id}`}>
      <Card className="p-3 gap-2 active:scale-[0.98] transition-transform">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-base">
              {cut.cutNumber}
            </span>
            {cut.retakeCount > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1 py-0">
                R{cut.retakeCount}
              </Badge>
            )}
          </div>
          <Badge className={cn("text-[10px]", STEP_BG_COLORS[cut.step])}>
            {STEP_LABELS[cut.step]}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {studio && <span>{studio.shortName}</span>}
          <span>{cut.projectName}</span>
          <span>EP{cut.episodeNumber}</span>
          {cut.sceneNumber && <span>S{cut.sceneNumber}</span>}
          <span className="text-foreground font-medium">
            {WORK_TYPE_SHORT[cut.workType]}
          </span>
          {cut.pricePerCut > 0 && (
            <span className="text-foreground font-medium">
              ¥{getCutTotalPrice(cut).toLocaleString()}
              {cut.pricingType === "per_sheet" && (
                <span className="text-muted-foreground font-normal">
                  ({cut.sheetCount}枚)
                </span>
              )}
            </span>
          )}
        </div>

        <StepIndicator
          step={cut.step}
          retakeCount={cut.retakeCount}
          compact
        />

        {cut.deadline && (
          <DeadlineBadge deadline={cut.deadline} />
        )}
      </Card>
    </Link>
  );
}
