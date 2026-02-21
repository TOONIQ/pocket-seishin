"use client";

import { useState, useMemo } from "react";
import { track } from "@vercel/analytics";
import { useCuts, useProjects, useStudios, addCut } from "@/lib/hooks/use-cuts";
import { getCutTotalPrice } from "@/types/cut";
import { CutCard } from "@/components/cut-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/date-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STEPS, STEP_LABELS, WORK_TYPES, WORK_TYPE_LABELS } from "@/lib/steps";
import type { Step, WorkType, PricingType } from "@/types/cut";

export default function CutsPage() {
  const cuts = useCuts();
  const projects = useProjects();
  const studios = useStudios();

  const [filterProject, setFilterProject] = useState<string>("__all__");
  const [filterStep, setFilterStep] = useState<string>("__all__");
  const [filterStudio, setFilterStudio] = useState<string>("__all__");
  const [filterWorkType, setFilterWorkType] = useState<string>("__all__");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<"step" | "deadline" | "price">("step");
  const [dialogOpen, setDialogOpen] = useState(false);

  // New cut form state
  const [newProjectName, setNewProjectName] = useState("");
  const [newEpisode, setNewEpisode] = useState("1");
  const [newCutNumber, setNewCutNumber] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [newStudioId, setNewStudioId] = useState<string>("__none__");
  const [newPrice, setNewPrice] = useState("");
  const [newWorkType, setNewWorkType] = useState<WorkType>("genga");
  const [newPricingType, setNewPricingType] = useState<PricingType>("per_cut");
  const [newSheetCount, setNewSheetCount] = useState("");
  const [newScene, setNewScene] = useState("");

  const filteredCuts = cuts?.filter((cut) => {
    if (filterProject !== "__all__" && cut.projectName !== filterProject) return false;
    if (filterStep !== "__all__" && cut.step !== filterStep) return false;
    if (filterStudio !== "__all__" && String(cut.studioId) !== filterStudio) return false;
    if (filterWorkType !== "__all__" && cut.workType !== filterWorkType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!cut.cutNumber.toLowerCase().includes(q) &&
          !cut.projectName.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const sortedCuts = useMemo(() => {
    if (!filteredCuts) return [];
    return [...filteredCuts].sort((a, b) => {
      if (sortMode === "deadline") {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.localeCompare(b.deadline);
      }
      if (sortMode === "price") {
        return getCutTotalPrice(b) - getCutTotalPrice(a);
      }
      return 0; // "step" は useCuts() のデフォルトソート維持
    });
  }, [filteredCuts, sortMode]);

  // Get default price from selected studio
  function handleStudioChange(val: string) {
    setNewStudioId(val);
    if (val !== "__none__") {
      const studio = studios?.find((s) => String(s.id) === val);
      if (studio && studio.defaultPricePerCut > 0) {
        setNewPrice(String(studio.defaultPricePerCut));
      }
    }
  }

  function parseCutRange(input: string): string[] {
    const parts = input.split(",").map((s) => s.trim());
    const result: string[] = [];

    for (const part of parts) {
      const rangeMatch = part.match(/^C?(\d+)\s*-\s*C?(\d+)$/i);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1]);
        const end = parseInt(rangeMatch[2]);
        for (let i = start; i <= end; i++) {
          result.push(`C${String(i).padStart(3, "0")}`);
        }
      } else {
        const numMatch = part.match(/^C?(\d+)$/i);
        if (numMatch) {
          result.push(`C${String(parseInt(numMatch[1])).padStart(3, "0")}`);
        }
      }
    }
    return result;
  }

  async function handleBulkAdd() {
    if (!newProjectName || !newCutNumber) return;

    const cutNumbers = parseCutRange(newCutNumber);
    const studioId = newStudioId !== "__none__" ? parseInt(newStudioId) : undefined;
    const price = newPrice ? parseInt(newPrice) : 0;

    for (const cutNum of cutNumbers) {
      await addCut({
        projectName: newProjectName,
        episodeNumber: parseInt(newEpisode),
        sceneNumber: newScene || undefined,
        cutNumber: cutNum,
        step: "received",
        workType: newWorkType,
        pricingType: newPricingType,
        pricePerCut: price,
        sheetCount: newPricingType === "per_sheet" ? (parseInt(newSheetCount) || 0) : 0,
        studioId,
        deadline: newDeadline || undefined,
        notes: "",
      });
    }

    track("cut_add", { count: cutNumbers.length });
    setNewCutNumber("");
    setDialogOpen(false);
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">カット一覧</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8" data-tutorial="cut-add-button">
              + 追加
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>カット追加</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">作品名</Label>
                <Input
                  placeholder="作品名"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">話数</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newEpisode}
                    onChange={(e) => setNewEpisode(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">シーン</Label>
                  <Input
                    placeholder="A"
                    value={newScene}
                    onChange={(e) => setNewScene(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">タイプ</Label>
                  <Select value={newWorkType} onValueChange={(v) => setNewWorkType(v as WorkType)}>
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
                  <Label className="text-xs">スタジオ</Label>
                  <Select value={newStudioId} onValueChange={handleStudioChange}>
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
              </div>
              <div>
                <Label className="text-xs">カット番号</Label>
                <Input
                  placeholder="C001 or C001-C010"
                  value={newCutNumber}
                  onChange={(e) => setNewCutNumber(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  範囲指定可: C001-C010, C001,C003,C005
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">料金体系</Label>
                  <Select value={newPricingType} onValueChange={(v) => setNewPricingType(v as PricingType)}>
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
                    {newPricingType === "per_sheet" ? "枚単価 (円)" : "カット単価 (円)"}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder={newPricingType === "per_sheet" ? "200" : "4500"}
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                  />
                </div>
              </div>
              {newPricingType === "per_sheet" && (
                <div>
                  <Label className="text-xs">枚数</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="30"
                    value={newSheetCount}
                    onChange={(e) => setNewSheetCount(e.target.value)}
                  />
                </div>
              )}
              <div>
                <Label className="text-xs">締切日</Label>
                <DatePicker
                  value={newDeadline}
                  onChange={setNewDeadline}
                />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleBulkAdd}>
                  追加
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Input
        placeholder="カット番号・作品名で検索"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="h-8 text-sm"
      />

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {studios && studios.length > 0 && (
          <Select value={filterStudio} onValueChange={setFilterStudio}>
            <SelectTrigger className="h-7 text-xs w-auto min-w-[80px]">
              <SelectValue placeholder="スタジオ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">全て</SelectItem>
              {studios.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.shortName || s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={filterWorkType} onValueChange={setFilterWorkType}>
          <SelectTrigger className="h-7 text-xs w-auto min-w-[80px]">
            <SelectValue placeholder="タイプ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全て</SelectItem>
            {WORK_TYPES.map((wt) => (
              <SelectItem key={wt} value={wt}>
                {WORK_TYPE_LABELS[wt]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStep} onValueChange={setFilterStep}>
          <SelectTrigger className="h-7 text-xs w-auto min-w-[80px]">
            <SelectValue placeholder="ステップ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全て</SelectItem>
            {STEPS.map((s) => (
              <SelectItem key={s} value={s}>
                {STEP_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="h-7 text-xs w-auto min-w-[80px]">
            <SelectValue placeholder="作品" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全て</SelectItem>
            {projects?.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortMode} onValueChange={(v) => setSortMode(v as "step" | "deadline" | "price")}>
          <SelectTrigger className="h-7 text-xs w-auto min-w-[80px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="step">ステップ順</SelectItem>
            <SelectItem value="deadline">締切順</SelectItem>
            <SelectItem value="price">単価順</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Count */}
      <p className="text-xs text-muted-foreground">
        {sortedCuts.length}件
      </p>

      {/* Cut List */}
      <div className="space-y-3">
        {sortedCuts.map((cut) => (
          <CutCard key={cut.id} cut={cut} />
        ))}
      </div>

      {sortedCuts.length === 0 && cuts && cuts.length > 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          フィルタに一致するカットがありません
        </p>
      )}
    </div>
  );
}
