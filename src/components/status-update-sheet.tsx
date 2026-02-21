"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { updateCutStep } from "@/lib/hooks/use-cuts";
import { STEP_LABELS } from "@/lib/steps";
import type { Step } from "@/types/cut";

interface StatusUpdateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cutId: number;
  currentStep: Step;
}

export function StatusUpdateSheet({
  open,
  onOpenChange,
  cutId,
  currentStep,
}: StatusUpdateSheetProps) {
  const [showRetakeInput, setShowRetakeInput] = useState(false);
  const [retakeReason, setRetakeReason] = useState("");

  async function handleStepUpdate(newStep: Step) {
    if (newStep === "retake") {
      setShowRetakeInput(true);
      return;
    }
    await updateCutStep(cutId, newStep);
    track("step_change", { from: currentStep, to: newStep });
    onOpenChange(false);
  }

  async function handleRetakeSubmit() {
    await updateCutStep(cutId, "retake", retakeReason || undefined);
    track("step_change", { from: currentStep, to: "retake" });
    setRetakeReason("");
    setShowRetakeInput(false);
    onOpenChange(false);
  }

  function handleClose(open: boolean) {
    if (!open) {
      setShowRetakeInput(false);
      setRetakeReason("");
    }
    onOpenChange(open);
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{STEP_LABELS[currentStep]}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-4">
          {showRetakeInput ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">リテイク理由（任意）</p>
              <textarea
                className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="リテイクの理由を入力..."
                value={retakeReason}
                onChange={(e) => setRetakeReason(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={() => setShowRetakeInput(false)}
                >
                  戻る
                </Button>
                <Button
                  className="flex-1 h-12 bg-red-500 hover:bg-red-600"
                  onClick={handleRetakeSubmit}
                >
                  リテイク登録
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {currentStep === "received" && (
                <Button
                  className="w-full h-14 text-base"
                  onClick={() => handleStepUpdate("working")}
                >
                  作業開始
                </Button>
              )}

              {currentStep === "working" && (
                <Button
                  className="w-full h-14 text-base"
                  onClick={() => handleStepUpdate("submitted")}
                >
                  提出する
                </Button>
              )}

              {currentStep === "submitted" && (
                <div className="space-y-2">
                  <Button
                    className="w-full h-14 text-base bg-green-600 hover:bg-green-700"
                    onClick={() => handleStepUpdate("done")}
                  >
                    完了（OK）
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-14 text-base text-red-400 border-red-400/30 hover:bg-red-400/10"
                    onClick={() => handleStepUpdate("retake")}
                  >
                    リテイク来た
                  </Button>
                </div>
              )}

              {currentStep === "retake" && (
                <Button
                  className="w-full h-14 text-base"
                  onClick={() => handleStepUpdate("working")}
                >
                  修正開始
                </Button>
              )}

              {currentStep === "done" && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  このカットは完了しています
                </p>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
