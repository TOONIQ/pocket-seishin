import { db } from "@/lib/db";
import { getCutTotalPrice } from "@/types/cut";
import type { Cut } from "@/types/cut";
import { WORK_TYPE_LABELS } from "@/lib/steps";

export interface MonthlyExportData {
  cuts: Cut[];
  totalAmount: number;
}

export async function getMonthlyExportData(
  year: number,
  month: number
): Promise<MonthlyExportData> {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);

  const cuts = await db.cuts
    .filter((c) => {
      if (c.step !== "done" || !c.completedAt) return false;
      const d = new Date(c.completedAt);
      return d >= monthStart && d <= monthEnd;
    })
    .toArray();

  const totalAmount = cuts.reduce((sum, c) => sum + getCutTotalPrice(c), 0);

  return { cuts, totalAmount };
}

export function exportMonthlyCSV(
  cuts: Cut[],
  year: number,
  month: number
): void {
  const header = "完了日,作品名,話数,シーン,カット番号,スタジオ,タイプ,単価種別,単価,枚数,合計金額";
  const rows = cuts.map((cut) => {
    const completedDate = cut.completedAt
      ? new Date(cut.completedAt).toLocaleDateString("ja-JP")
      : "";
    const pricingLabel = cut.pricingType === "per_sheet" ? "枚単価" : "カット単価";
    const total = getCutTotalPrice(cut);

    return [
      completedDate,
      cut.projectName,
      cut.episodeNumber,
      cut.sceneNumber || "",
      cut.cutNumber,
      "", // studioName is resolved at call site if needed
      WORK_TYPE_LABELS[cut.workType],
      pricingLabel,
      cut.pricePerCut,
      cut.sheetCount,
      total,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",");
  });

  const csv = "\uFEFF" + [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `seishin_${year}_${String(month).padStart(2, "0")}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}
