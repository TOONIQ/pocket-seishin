import type { Step, WorkType } from "@/types/cut";

export const STEPS: Step[] = ["received", "working", "submitted", "retake", "done"];

export const STEP_LABELS: Record<Step, string> = {
  received: "受取",
  working: "作業中",
  submitted: "提出済",
  retake: "リテイク",
  done: "完了",
};

export const STEP_COLORS: Record<Step, string> = {
  received: "text-muted-foreground",
  working: "text-cyan-400",
  submitted: "text-blue-400",
  retake: "text-red-400",
  done: "text-green-400",
};

export const STEP_BG_COLORS: Record<Step, string> = {
  received: "bg-muted",
  working: "bg-cyan-400/20 text-cyan-400",
  submitted: "bg-blue-400/20 text-blue-400",
  retake: "bg-red-400/20 text-red-400",
  done: "bg-green-400/20 text-green-400",
};

export const STEP_TRANSITIONS: Record<Step, Step[]> = {
  received: ["working"],
  working: ["submitted"],
  submitted: ["retake", "done"],
  retake: ["working"],
  done: [],
};

export function getNextSteps(step: Step): Step[] {
  return STEP_TRANSITIONS[step];
}

export const WORK_TYPES: WorkType[] = ["genga", "nigen", "douga", "sakkan", "layout", "other"];

export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  genga: "原画",
  nigen: "第二原画",
  douga: "動画",
  sakkan: "作画監督",
  layout: "レイアウト",
  other: "その他",
};

export const WORK_TYPE_SHORT: Record<WorkType, string> = {
  genga: "原画",
  nigen: "二原",
  douga: "動画",
  sakkan: "作監",
  layout: "LO",
  other: "他",
};

export function getStepIndex(step: Step): number {
  // For display: received=0, working=1, submitted=2, done=3
  // retake maps to working position (index 1)
  const displayMap: Record<Step, number> = {
    received: 0,
    working: 1,
    submitted: 2,
    retake: 1, // loops back to working position
    done: 3,
  };
  return displayMap[step];
}
