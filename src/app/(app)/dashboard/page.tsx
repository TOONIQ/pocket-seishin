"use client";

import { useCuts } from "@/lib/hooks/use-cuts";
import { useDeadlines } from "@/lib/hooks/use-deadlines";
import { useIncome } from "@/lib/hooks/use-income";
import { useIncomeHistory } from "@/lib/hooks/use-income-history";
import { useQuickLinks } from "@/lib/hooks/use-quick-links";
import { CutCard } from "@/components/cut-card";
import { IncomeRing } from "@/components/income-ring";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { STEP_LABELS, STEP_BG_COLORS } from "@/lib/steps";
import type { Step } from "@/types/cut";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const cuts = useCuts();
  const deadlineGroups = useDeadlines();
  const income = useIncome();
  const incomeHistory = useIncomeHistory(6);
  const quickLinks = useQuickLinks();

  const today = format(new Date(), "M月d日 (E)", { locale: ja });

  const activeCuts = cuts?.filter((c) => c.step === "working" || c.step === "retake") ?? [];
  const retakeCuts = cuts?.filter((c) => c.step === "retake") ?? [];
  const totalCuts = cuts?.length ?? 0;

  // Step counts (exclude done)
  const stepCounts: { step: Step; label: string; count: number }[] = [
    { step: "received", label: "受取", count: cuts?.filter((c) => c.step === "received").length ?? 0 },
    { step: "working", label: "作業中", count: cuts?.filter((c) => c.step === "working").length ?? 0 },
    { step: "submitted", label: "提出", count: cuts?.filter((c) => c.step === "submitted").length ?? 0 },
    { step: "retake", label: "リテイク", count: cuts?.filter((c) => c.step === "retake").length ?? 0 },
  ];

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold">ダッシュボード</h2>
        <p className="text-sm text-muted-foreground">{today}</p>
      </div>

      {/* Deadline Alerts */}
      {deadlineGroups && deadlineGroups.length > 0 && (
        <div className="space-y-3" data-tutorial="deadline-alert">
          <h3 className="text-sm font-bold">締切アラート</h3>
          {deadlineGroups.map((group) => (
            <div key={group.label} className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge
                  variant={group.isUrgent ? "destructive" : "secondary"}
                  className="text-[10px]"
                >
                  {group.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {group.cuts.length}件
                </span>
              </div>
              {group.cuts.map((cut) => (
                <CutCard key={cut.id} cut={cut} />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Income Ring */}
      {income && income.monthlyTarget > 0 && (
        <Card className="p-4 gap-3" data-tutorial="income-ring">
          <IncomeRing earned={income.earned} target={income.monthlyTarget} />
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">
              あと{income.remainingCuts}カットで¥{income.remaining.toLocaleString()}
            </p>
          </div>
        </Card>
      )}

      {/* Daily Quota */}
      {income && income.monthlyTarget > 0 && income.remainingBusinessDays > 0 && (
        <Card className="p-3 gap-1">
          <div className="flex items-center justify-between">
            <p className="text-sm">今日のノルマ</p>
            <p className="text-lg font-bold">{income.dailyQuota.toFixed(1)}カット</p>
          </div>
          <p className="text-xs text-muted-foreground">
            残り{income.remainingBusinessDays}営業日
          </p>
        </Card>
      )}

      {/* Monthly Income History */}
      {incomeHistory && incomeHistory.some((m) => m.earned > 0) && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold">月別推移</h3>
          <Card className="p-3 gap-2">
            {(() => {
              const maxEarned = Math.max(...incomeHistory.map((m) => m.earned), 1);
              return incomeHistory.map((m) => (
                <div key={m.month} className="space-y-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground w-20 shrink-0">{m.month}</span>
                    <span className="font-medium">
                      {m.earned > 0 ? `¥${m.earned.toLocaleString()}` : "-"}
                    </span>
                    <span className="text-muted-foreground w-16 text-right shrink-0">
                      {m.cutCount > 0 ? `${m.cutCount}カット` : ""}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-400 rounded-full transition-all"
                      style={{ width: `${(m.earned / maxEarned) * 100}%` }}
                    />
                  </div>
                </div>
              ));
            })()}
          </Card>
        </div>
      )}

      {/* Step Counts */}
      {totalCuts > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {stepCounts.map(({ step, label, count }) => (
            <Card
              key={step}
              className={cn("p-2 text-center gap-0.5", count > 0 && step === "retake" && "border-red-400/30")}
            >
              <p className="text-xl font-bold">{count}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Links */}
      {quickLinks && quickLinks.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold">クイックリンク</h3>
          <div className="grid grid-cols-2 gap-2">
            {quickLinks.map((link) => {
              const href =
                link.type === "tel"
                  ? `tel:${link.value.replace(/[\s-]/g, "")}`
                  : link.type === "email"
                    ? `mailto:${link.value}`
                    : link.type === "url"
                      ? link.value
                      : undefined;
              const icon =
                link.type === "tel" ? "📞" : link.type === "email" ? "✉️" : link.type === "url" ? "🔗" : "📌";

              return href ? (
                <a key={link.id} href={href} target={link.type === "url" ? "_blank" : undefined} rel={link.type === "url" ? "noopener noreferrer" : undefined}>
                  <Card className="p-2.5 active:scale-[0.98] transition-transform">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{link.label}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{link.value}</p>
                      </div>
                    </div>
                  </Card>
                </a>
              ) : (
                <Card key={link.id} className="p-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{link.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{link.value}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Cuts */}
      {activeCuts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold">作業中のカット</h3>
          <div className="space-y-2">
            {activeCuts.map((cut) => (
              <CutCard key={cut.id} cut={cut} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalCuts === 0 && (
        <Card className="p-8 text-center gap-2">
          <p className="text-4xl">✏️</p>
          <p className="text-sm font-medium">カットがまだありません</p>
          <p className="text-xs text-muted-foreground">
            「カット」タブからカットを追加してください
          </p>
        </Card>
      )}
    </div>
  );
}
