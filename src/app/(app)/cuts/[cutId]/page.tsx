"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCut, useRetakeHistory, useStudios, updateCut, deleteCut } from "@/lib/hooks/use-cuts";
import { StepIndicator } from "@/components/step-indicator";
import { StatusUpdateSheet } from "@/components/status-update-sheet";
import { RetakeTimeline } from "@/components/retake-timeline";
import { DeadlineBadge } from "@/components/deadline-badge";
import { DatePicker } from "@/components/date-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STEP_LABELS, STEP_BG_COLORS, WORK_TYPES, WORK_TYPE_LABELS } from "@/lib/steps";
import { getCutTotalPrice } from "@/types/cut";
import type { WorkType, PricingType } from "@/types/cut";
import { cn } from "@/lib/utils";

export default function CutDetailPage({
  params,
}: {
  params: Promise<{ cutId: string }>;
}) {
  const { cutId } = use(params);
  const router = useRouter();
  const cut = useCut(parseInt(cutId));
  const retakeHistory = useRetakeHistory(parseInt(cutId));
  const studios = useStudios();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [editProjectName, setEditProjectName] = useState("");
  const [editEpisode, setEditEpisode] = useState("");
  const [editScene, setEditScene] = useState("");
  const [editCutNumber, setEditCutNumber] = useState("");
  const [editStudioId, setEditStudioId] = useState<string>("__none__");
  const [editWorkType, setEditWorkType] = useState<WorkType>("genga");
  const [editPricingType, setEditPricingType] = useState<PricingType>("per_cut");
  const [editPrice, setEditPrice] = useState("");
  const [editSheetCount, setEditSheetCount] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Initialize edit form when entering edit mode
  useEffect(() => {
    if (isEditing && cut) {
      setEditProjectName(cut.projectName);
      setEditEpisode(String(cut.episodeNumber));
      setEditScene(cut.sceneNumber || "");
      setEditCutNumber(cut.cutNumber);
      setEditStudioId(cut.studioId ? String(cut.studioId) : "__none__");
      setEditWorkType(cut.workType);
      setEditPricingType(cut.pricingType);
      setEditPrice(String(cut.pricePerCut));
      setEditSheetCount(String(cut.sheetCount));
      setEditDeadline(cut.deadline || "");
      setEditNotes(cut.notes);
    }
  }, [isEditing, cut]);

  if (cut === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">読み込み中...</p>
      </div>
    );
  }

  if (cut === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">カットが見つかりません</p>
      </div>
    );
  }

  const studio = studios?.find((s) => s.id === cut.studioId);

  async function handleDelete() {
    if (!cut?.id) return;
    await deleteCut(cut.id);
    router.push("/cuts");
  }

  async function handleSave() {
    if (!cut?.id) return;
    await updateCut(cut.id, {
      projectName: editProjectName,
      episodeNumber: parseInt(editEpisode) || 1,
      sceneNumber: editScene || undefined,
      cutNumber: editCutNumber,
      studioId: editStudioId !== "__none__" ? parseInt(editStudioId) : undefined,
      workType: editWorkType,
      pricingType: editPricingType,
      pricePerCut: parseInt(editPrice) || 0,
      sheetCount: editPricingType === "per_sheet" ? (parseInt(editSheetCount) || 0) : 0,
      deadline: editDeadline || undefined,
      notes: editNotes,
    });
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="space-y-4 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">カット編集</h2>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => setIsEditing(false)}
            >
              キャンセル
            </Button>
            <Button size="sm" className="h-8" onClick={handleSave}>
              保存
            </Button>
          </div>
        </div>

        {/* Edit Form */}
        <div className="space-y-3">
          <div>
            <Label className="text-xs">作品名</Label>
            <Input value={editProjectName} onChange={(e) => setEditProjectName(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">話数</Label>
              <Input type="number" min="1" value={editEpisode} onChange={(e) => setEditEpisode(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">シーン</Label>
              <Input placeholder="A" value={editScene} onChange={(e) => setEditScene(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">カット番号</Label>
              <Input value={editCutNumber} onChange={(e) => setEditCutNumber(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">スタジオ</Label>
              <Select value={editStudioId} onValueChange={setEditStudioId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">なし</SelectItem>
                  {studios?.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.shortName || s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">タイプ</Label>
              <Select value={editWorkType} onValueChange={(v) => setEditWorkType(v as WorkType)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORK_TYPES.map((wt) => (
                    <SelectItem key={wt} value={wt}>
                      {WORK_TYPE_LABELS[wt]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">料金体系</Label>
              <Select value={editPricingType} onValueChange={(v) => setEditPricingType(v as PricingType)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_cut">カット単価</SelectItem>
                  <SelectItem value="per_sheet">枚単価</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">
                {editPricingType === "per_sheet" ? "枚単価 (円)" : "カット単価 (円)"}
              </Label>
              <Input
                type="number"
                min="0"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
              />
            </div>
          </div>
          {editPricingType === "per_sheet" && (
            <div>
              <Label className="text-xs">枚数</Label>
              <Input
                type="number"
                min="0"
                value={editSheetCount}
                onChange={(e) => setEditSheetCount(e.target.value)}
              />
            </div>
          )}
          <div>
            <Label className="text-xs">締切日</Label>
            <DatePicker value={editDeadline} onChange={setEditDeadline} />
          </div>
          <div>
            <Label className="text-xs">メモ</Label>
            <textarea
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Read-only info */}
        <Card className="p-3 gap-1">
          <p className="text-xs text-muted-foreground">編集不可</p>
          <div className="flex items-center gap-3 text-xs">
            <span>ステップ: {STEP_LABELS[cut.step]}</span>
            <span>リテイク: {cut.retakeCount}回</span>
            <span>作成: {new Date(cut.createdAt).toLocaleDateString("ja-JP")}</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() => router.back()}
        >
          ← 戻る
        </Button>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => setIsEditing(true)}
          >
            編集
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-red-400"
            onClick={handleDelete}
          >
            削除
          </Button>
        </div>
      </div>

      {/* Cut Info */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold font-mono">{cut.cutNumber}</h2>
          {cut.retakeCount > 0 && (
            <Badge variant="destructive">R{cut.retakeCount}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {studio && <span>{studio.name}</span>}
          <span>{cut.projectName}</span>
          <span>EP{cut.episodeNumber}</span>
          {cut.sceneNumber && <span>S{cut.sceneNumber}</span>}
          <Badge variant="secondary" className="text-[10px]">
            {WORK_TYPE_LABELS[cut.workType]}
          </Badge>
        </div>
        {cut.pricePerCut > 0 && (
          <p className="text-sm font-medium">
            {cut.pricingType === "per_sheet" ? (
              <>¥{cut.pricePerCut.toLocaleString()}/枚 × {cut.sheetCount}枚 = ¥{getCutTotalPrice(cut).toLocaleString()}</>
            ) : (
              <>¥{cut.pricePerCut.toLocaleString()}/カット</>
            )}
          </p>
        )}
        {cut.deadline && <DeadlineBadge deadline={cut.deadline} />}
      </div>

      {/* Step Indicator */}
      <Card className="p-4">
        <StepIndicator step={cut.step} retakeCount={cut.retakeCount} />
      </Card>

      {/* Current Status Card */}
      <Card
        className="p-4 gap-3 cursor-pointer active:scale-[0.98] transition-transform"
        onClick={() => setSheetOpen(true)}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">現在のステップ</p>
            <p className="text-lg font-bold">{STEP_LABELS[cut.step]}</p>
          </div>
          <Badge className={cn("text-sm", STEP_BG_COLORS[cut.step])}>
            {STEP_LABELS[cut.step]}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          タップでステータスを更新
        </p>
      </Card>

      {/* Retake History */}
      {retakeHistory && retakeHistory.length > 0 && (
        <RetakeTimeline history={retakeHistory} />
      )}

      {/* Notes */}
      {cut.notes && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold">メモ</h3>
          <Card className="p-3">
            <p className="text-sm whitespace-pre-wrap">{cut.notes}</p>
          </Card>
        </div>
      )}

      {/* Status Update Sheet */}
      {cut.id && (
        <StatusUpdateSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          cutId={cut.id}
          currentStep={cut.step}
        />
      )}
    </div>
  );
}
