export type Step = "received" | "working" | "submitted" | "retake" | "done";

export type WorkType = "genga" | "nigen" | "douga" | "sakkan" | "layout" | "other";

export type PricingType = "per_cut" | "per_sheet";

export interface Studio {
  id?: number;
  name: string;
  shortName: string;
  defaultPricePerCut: number;
  contactInfo?: string;
  notes?: string;
}

export interface Cut {
  id?: number;
  studioId?: number;
  projectName: string;
  episodeNumber: number;
  sceneNumber?: string;
  cutNumber: string;
  step: Step;
  workType: WorkType;
  pricingType: PricingType;
  pricePerCut: number;      // per_cut: カット単価, per_sheet: 枚単価
  sheetCount: number;        // per_sheet時の枚数
  deadline?: string;
  retakeCount: number;
  notes: string;
  createdAt: string;
  completedAt?: string;
  updatedAt: string;
}

// Helper: カットの合計金額を計算
export function getCutTotalPrice(cut: Cut): number {
  if (cut.pricingType === "per_sheet") {
    return cut.pricePerCut * cut.sheetCount;
  }
  return cut.pricePerCut;
}

export type QuickLinkType = "url" | "tel" | "email" | "other";

export interface QuickLink {
  id?: number;
  label: string;
  value: string;
  type: QuickLinkType;
  order: number;
}

export interface RetakeHistory {
  id?: number;
  cutId: number;
  returnedAt: string;
  reason?: string;
  resolvedAt?: string;
}
