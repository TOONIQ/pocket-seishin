"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSetting, setSetting, db } from "@/lib/db";
import { insertDemoData } from "@/lib/demo-data";
import { getMonthlyExportData, exportMonthlyCSV } from "@/lib/export-csv";
import { useBackup } from "@/lib/hooks/use-backup";
import type { BackupData } from "@/lib/backup";
import {
  useStudiosWithStats,
  addStudio,
  updateStudio,
  deleteStudio,
} from "@/lib/hooks/use-studios";
import { setMonthlyTarget } from "@/lib/hooks/use-income";
import { useTheme } from "@/lib/hooks/use-theme";
import {
  useQuickLinks,
  addQuickLink,
  updateQuickLink,
  deleteQuickLink,
  swapQuickLinkOrder,
  detectLinkType,
} from "@/lib/hooks/use-quick-links";
import type { QuickLinkType } from "@/types/cut";

export default function SettingsPage() {
  const { theme, toggle: toggleTheme } = useTheme();
  const studiosWithStats = useStudiosWithStats();
  const quickLinks = useQuickLinks();
  const backupState = useBackup();

  // Restore preview
  const [restorePreview, setRestorePreview] = useState<BackupData | null>(null);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  // Monthly target
  const [targetInput, setTargetInput] = useState("");
  const [targetSaved, setTargetSaved] = useState(false);

  // Quick link form
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkValue, setLinkValue] = useState("");
  const [editingLinkId, setEditingLinkId] = useState<number | null>(null);

  // CSV Export
  const now = new Date();
  const [exportYear, setExportYear] = useState(now.getFullYear());
  const [exportMonth, setExportMonth] = useState(now.getMonth() + 1);
  const [exportPreview, setExportPreview] = useState<{ count: number; total: number } | null>(null);

  // Studio form
  const [showStudioForm, setShowStudioForm] = useState(false);
  const [studioName, setStudioName] = useState("");
  const [studioShort, setStudioShort] = useState("");
  const [studioPrice, setStudioPrice] = useState("");
  const [editingStudioId, setEditingStudioId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const target = await getSetting("monthly_target");
      if (target) setTargetInput(target);
    }
    load();
  }, []);

  async function handleTargetSave() {
    const amount = parseInt(targetInput) || 0;
    await setMonthlyTarget(amount);
    setTargetSaved(true);
    setTimeout(() => setTargetSaved(false), 2000);
  }

  async function handleStudioSave() {
    if (!studioName) return;

    const studioData = {
      name: studioName,
      shortName: studioShort || studioName.slice(0, 4),
      defaultPricePerCut: parseInt(studioPrice) || 0,
    };

    if (editingStudioId !== null) {
      await updateStudio(editingStudioId, studioData);
    } else {
      await addStudio(studioData);
    }

    resetStudioForm();
  }

  function handleEditStudio(studio: { id?: number; name: string; shortName: string; defaultPricePerCut: number }) {
    setEditingStudioId(studio.id ?? null);
    setStudioName(studio.name);
    setStudioShort(studio.shortName);
    setStudioPrice(String(studio.defaultPricePerCut));
    setShowStudioForm(true);
  }

  async function handleDeleteStudio(id: number) {
    if (!confirm("このスタジオを削除しますか？")) return;
    await deleteStudio(id);
  }

  function resetStudioForm() {
    setShowStudioForm(false);
    setEditingStudioId(null);
    setStudioName("");
    setStudioShort("");
    setStudioPrice("");
  }

  async function handleLinkSave() {
    if (!linkLabel || !linkValue) return;
    const type = detectLinkType(linkValue);

    if (editingLinkId !== null) {
      await updateQuickLink(editingLinkId, { label: linkLabel, value: linkValue, type });
    } else {
      await addQuickLink({ label: linkLabel, value: linkValue, type });
    }
    resetLinkForm();
  }

  function handleEditLink(link: { id?: number; label: string; value: string }) {
    setEditingLinkId(link.id ?? null);
    setLinkLabel(link.label);
    setLinkValue(link.value);
    setShowLinkForm(true);
  }

  async function handleDeleteLink(id: number) {
    if (!confirm("このリンクを削除しますか？")) return;
    await deleteQuickLink(id);
  }

  function resetLinkForm() {
    setShowLinkForm(false);
    setEditingLinkId(null);
    setLinkLabel("");
    setLinkValue("");
  }

  async function handleExportPreview() {
    const data = await getMonthlyExportData(exportYear, exportMonth);
    setExportPreview({ count: data.cuts.length, total: data.totalAmount });
  }

  async function handleExport() {
    const data = await getMonthlyExportData(exportYear, exportMonth);
    exportMonthlyCSV(data.cuts, exportYear, exportMonth);
  }

  async function handleClearData() {
    if (!confirm("全てのローカルデータを削除しますか？この操作は取り消せません。")) return;
    await db.delete();
    window.location.reload();
  }

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-lg font-bold">設定</h2>

      {/* Studios */}
      <Card className="p-4 gap-3" data-tutorial="studio-section">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">スタジオ管理</h3>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => {
              resetStudioForm();
              setShowStudioForm(true);
            }}
          >
            + 追加
          </Button>
        </div>

        {/* Studio list */}
        {studiosWithStats && studiosWithStats.length > 0 && (
          <div className="space-y-2">
            {studiosWithStats.map((studio) => (
              <div
                key={studio.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{studio.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({studio.shortName})
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>¥{studio.defaultPricePerCut.toLocaleString()}/カット</span>
                    <span>{studio.totalCuts}カット</span>
                    {studio.totalRetakes > 0 && (
                      <span className="text-red-400">
                        リテイク率: {(studio.retakeRate * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleEditStudio(studio)}
                  >
                    編集
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-red-400"
                    onClick={() => studio.id && handleDeleteStudio(studio.id)}
                  >
                    削除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Studio form */}
        {showStudioForm && (
          <div className="space-y-2 p-3 rounded-lg border border-border">
            <div>
              <Label className="text-xs">スタジオ名</Label>
              <Input
                placeholder="スタジオA"
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">略称</Label>
                <Input
                  placeholder="StA"
                  value={studioShort}
                  onChange={(e) => setStudioShort(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">デフォルト単価</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="4500"
                  value={studioPrice}
                  onChange={(e) => setStudioPrice(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={resetStudioForm}
              >
                キャンセル
              </Button>
              <Button size="sm" className="flex-1" onClick={handleStudioSave}>
                {editingStudioId !== null ? "更新" : "追加"}
              </Button>
            </div>
          </div>
        )}

        {(!studiosWithStats || studiosWithStats.length === 0) && !showStudioForm && (
          <p className="text-xs text-muted-foreground">
            スタジオを登録するとカット追加時に選択できます
          </p>
        )}
      </Card>

      {/* Monthly Target */}
      <Card className="p-4 gap-3">
        <h3 className="text-sm font-bold">月収目標</h3>
        <p className="text-xs text-muted-foreground">
          ダッシュボードの収入リングに反映されます
        </p>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label className="text-xs">目標金額（円）</Label>
            <Input
              type="number"
              min="0"
              step="10000"
              placeholder="300000"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
            />
          </div>
          <Button size="sm" onClick={handleTargetSave}>
            {targetSaved ? "保存しました ✓" : "保存"}
          </Button>
        </div>
      </Card>

      {/* Quick Links */}
      <Card className="p-4 gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">クイックリンク</h3>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => {
              resetLinkForm();
              setShowLinkForm(true);
            }}
          >
            + 追加
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          よく使うURL・電話番号・メールをダッシュボードに表示
        </p>

        {quickLinks && quickLinks.length > 0 && (
          <div className="space-y-2">
            {quickLinks.map((link, idx) => {
              const icon =
                link.type === "tel" ? "📞" : link.type === "email" ? "✉️" : link.type === "url" ? "🔗" : "📌";
              const isFirst = idx === 0;
              const isLast = idx === quickLinks.length - 1;
              return (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-0.5 shrink-0 mr-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 text-[10px]"
                      disabled={isFirst}
                      onClick={() => {
                        const prev = quickLinks[idx - 1];
                        if (link.id && prev.id) swapQuickLinkOrder(link.id, link.order, prev.id, prev.order);
                      }}
                    >
                      ▲
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 text-[10px]"
                      disabled={isLast}
                      onClick={() => {
                        const next = quickLinks[idx + 1];
                        if (link.id && next.id) swapQuickLinkOrder(link.id, link.order, next.id, next.order);
                      }}
                    >
                      ▼
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm">{icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{link.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{link.value}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleEditLink(link)}
                    >
                      編集
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-red-400"
                      onClick={() => link.id && handleDeleteLink(link.id)}
                    >
                      削除
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showLinkForm && (
          <div className="space-y-2 p-3 rounded-lg border border-border">
            <div>
              <Label className="text-xs">名前</Label>
              <Input
                placeholder="スタジオA 制作進行"
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">URL / 電話番号 / メール</Label>
              <Input
                placeholder="https://... or 03-1234-5678"
                value={linkValue}
                onChange={(e) => setLinkValue(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                自動判定: URL / 電話 / メール
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={resetLinkForm}
              >
                キャンセル
              </Button>
              <Button size="sm" className="flex-1" onClick={handleLinkSave}>
                {editingLinkId !== null ? "更新" : "追加"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Theme Toggle */}
      <Card className="p-4 gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold">テーマ</h3>
            <p className="text-xs text-muted-foreground">
              {theme === "dark" ? "ダークモード" : "ライトモード"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-20"
            onClick={toggleTheme}
          >
            {theme === "dark" ? "☀️ 明" : "🌙 暗"}
          </Button>
        </div>
      </Card>

      {/* Cloud Backup */}
      <Card className="p-4 gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">クラウドバックアップ</h3>
          <Badge variant="secondary" className="text-[10px]">
            Beta
          </Badge>
        </div>
        <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
          <span className="text-lg">📁</span>
          <div>
            <p className="text-sm font-medium">Google Driveバックアップ</p>
            <p className="text-[10px] text-muted-foreground">
              AES-256暗号化 / appDataFolder（非公開領域）
            </p>
          </div>
        </div>

        <div>
          <Label className="text-xs">パスフレーズ</Label>
          <Input
            type="password"
            placeholder="バックアップ暗号化用"
            value={backupState.passphrase}
            onChange={(e) => backupState.setPassphrase(e.target.value)}
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            新しいデバイスでの復元に必要です。忘れると復元できません。
          </p>
        </div>

        {!backupState.isSignedIn ? (
          <div className="space-y-2">
            <Button
              size="sm"
              variant="outline"
              onClick={backupState.signIn}
              disabled={backupState.isLoading}
            >
              {backupState.isLoading ? "接続中..." : "Googleアカウントに接続"}
            </Button>
            <p className="text-[10px] text-yellow-500">
              ベータ版のため、Google認証時に「未確認のアプリ」警告が表示されます。「詳細」→「ポケット制作進行（安全でないページ）に移動」で続行できます。
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-green-500">
              <span>✓</span>
              <span>Googleアカウント接続済み</span>
            </div>

            {backupState.lastBackup && (
              <p className="text-xs text-muted-foreground">
                最終バックアップ:{" "}
                {new Date(backupState.lastBackup).toLocaleString("ja-JP")}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={backupState.isLoading || !backupState.passphrase}
                onClick={async () => {
                  try {
                    await backupState.backup();
                    setBackupSuccess(true);
                    setTimeout(() => setBackupSuccess(false), 3000);
                  } catch {
                    // error is set in hook
                  }
                }}
              >
                {backupSuccess ? "バックアップ完了 ✓" : backupState.isLoading ? "処理中..." : "バックアップ"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={backupState.isLoading || !backupState.passphrase}
                onClick={async () => {
                  try {
                    const data = await backupState.restore();
                    setRestorePreview(data);
                  } catch {
                    // error is set in hook
                  }
                }}
              >
                復元
              </Button>
            </div>

            {/* Restore preview */}
            {restorePreview && (
              <div className="space-y-2 p-3 rounded-lg border border-border">
                <p className="text-sm font-medium">復元プレビュー</p>
                <p className="text-[10px] text-muted-foreground">
                  バックアップ日時:{" "}
                  {new Date(restorePreview.exportedAt).toLocaleString("ja-JP")}
                </p>
                <div className="space-y-1 text-xs">
                  <p>スタジオ: {restorePreview.tables.studios.length}件</p>
                  <p>カット: {restorePreview.tables.cuts.length}件</p>
                  <p>リテイク履歴: {restorePreview.tables.retakeHistory.length}件</p>
                  <p>クイックリンク: {restorePreview.tables.quickLinks.length}件</p>
                </div>
                <p className="text-[10px] text-red-400">
                  現在のデータは全て上書きされます
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setRestorePreview(null)}
                  >
                    キャンセル
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={async () => {
                      try {
                        await backupState.confirmRestore(restorePreview);
                        setRestorePreview(null);
                        setRestoreSuccess(true);
                        setTimeout(() => setRestoreSuccess(false), 3000);
                      } catch {
                        // error is set in hook
                      }
                    }}
                  >
                    復元を実行
                  </Button>
                </div>
              </div>
            )}

            {restoreSuccess && (
              <p className="text-xs text-green-500">復元が完了しました ✓</p>
            )}
          </div>
        )}

        {backupState.error && (
          <p className="text-xs text-red-400">{backupState.error}</p>
        )}

        <Separator />

        <p className="text-[10px] text-muted-foreground">
          不具合・ご要望はお気軽にどうぞ:{" "}
          <a
            href="https://x.com/oki_tooniq"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2"
          >
            @oki_tooniq
          </a>
          {" / "}
          <a
            href="mailto:contact@tooniq.co.jp?subject=%E5%88%B6%E9%80%B2%20%E3%83%95%E3%82%A3%E3%83%BC%E3%83%89%E3%83%90%E3%83%83%E3%82%AF"
            className="text-primary underline underline-offset-2"
          >
            メール
          </a>
        </p>

        <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 opacity-60">
          <span className="text-lg">🔄</span>
          <div>
            <p className="text-sm font-medium">マルチデバイス同期</p>
            <p className="text-[10px] text-muted-foreground">Coming Soon</p>
          </div>
        </div>
      </Card>

      {/* Data Management */}
      <Card className="p-4 gap-3">
        <h3 className="text-sm font-bold">データ管理</h3>
        <p className="text-xs text-muted-foreground">
          完了済みカットをCSVでエクスポート（確定申告用）
        </p>
        <div className="flex items-end gap-2">
          <div>
            <Label className="text-xs">年</Label>
            <Select
              value={String(exportYear)}
              onValueChange={(v) => { setExportYear(parseInt(v)); setExportPreview(null); }}
            >
              <SelectTrigger className="h-9 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[now.getFullYear() - 1, now.getFullYear()].map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">月</Label>
            <Select
              value={String(exportMonth)}
              onValueChange={(v) => { setExportMonth(parseInt(v)); setExportPreview(null); }}
            >
              <SelectTrigger className="h-9 w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <SelectItem key={m} value={String(m)}>{m}月</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" variant="outline" onClick={handleExportPreview}>
            確認
          </Button>
          <Button size="sm" onClick={handleExport}>
            CSVエクスポート
          </Button>
        </div>
        {exportPreview && (
          <p className="text-xs text-muted-foreground">
            {exportYear}年{exportMonth}月: {exportPreview.count}カット / ¥{exportPreview.total.toLocaleString()}
          </p>
        )}
      </Card>

      {/* App Info */}
      <Card className="p-4 gap-3">
        <h3 className="text-sm font-bold">アプリ情報</h3>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>ポケット制作進行 v0.3.1</p>
          <p>フリーランスアニメーター向け制作進行管理</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await insertDemoData();
            await setSetting("tutorial_completed", "");
            window.location.reload();
          }}
        >
          チュートリアルを再表示
        </Button>

        <Separator />

        <div className="space-y-2">
          <h4 className="text-xs font-bold">開発・運営</h4>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>大木天翔 / 合同会社TOONIQ</p>
            <a
              href="mailto:oki@tooniq.co.jp"
              className="text-primary underline underline-offset-2"
            >
              oki@tooniq.co.jp
            </a>
          </div>
        </div>

        <Separator />

        <a
          href="https://buymeacoffee.com/okim"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 rounded-lg bg-yellow-400/10 active:scale-[0.98] transition-transform"
        >
          <span className="text-lg">☕</span>
          <div>
            <p className="text-sm font-medium">Buy Me a Coffee</p>
            <p className="text-[10px] text-muted-foreground">開発を応援する</p>
          </div>
        </a>
      </Card>

      <Separator />

      {/* Danger Zone */}
      <Card className="p-4 gap-3 border-red-400/30">
        <h3 className="text-sm font-bold text-red-400">デンジャーゾーン</h3>
        <p className="text-xs text-muted-foreground">
          全てのローカルデータを削除します。この操作は取り消せません。
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleClearData}
        >
          データを全て削除
        </Button>
      </Card>
    </div>
  );
}
