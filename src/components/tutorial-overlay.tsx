"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTutorial } from "@/lib/hooks/use-tutorial";
import { AnimatePresence, motion } from "framer-motion";

interface TutorialStep {
  icon: string;
  title: string;
  body: string;
  /** CSS selector for the element to spotlight. null = centered card */
  target?: string;
  /** Where to show the info card relative to spotlight */
  cardPosition?: "above" | "below";
}

const steps: TutorialStep[] = [
  {
    icon: "🎬",
    title: "ようこそ",
    body: "フリーランスアニメーターのためのカット管理アプリです。受け取ったカットの進捗・収入をまとめて管理できます。",
  },
  {
    icon: "🔒",
    title: "データは端末の中だけ",
    body: "データは全てお使いの端末にローカル保存され、私たちのサーバーには一切送信されません。試しにWi-Fiを切っても使えます。\n\n情報漏洩が不安な方は、自分だけがわかる隠語で登録してもOKです。\n\nただしブラウザの履歴・データを削除すると消えてしまうのでご注意を。Google Driveへの自動バックアップ機能を準備中です！",
  },
  {
    icon: "🏢",
    title: "スタジオ登録",
    body: "まずは取引先スタジオを登録しましょう。設定画面からスタジオ名とデフォルト単価を設定できます。",
    target: '[data-tutorial="settings"]',
    cardPosition: "above",
  },
  {
    icon: "📋",
    title: "カットを追加",
    body: "受け取ったカットを登録して進捗管理。受領 → 作業中 → 提出 → 完了のステップで状態を追跡できます。",
    target: '[data-tutorial="cuts"]',
    cardPosition: "above",
  },
  {
    icon: "💰",
    title: "収入管理",
    body: "月収目標を設定すると、日ノルマと達成率がダッシュボードに表示されます。確定申告用のCSVエクスポートも可能です。",
    target: '[data-tutorial="dashboard"]',
    cardPosition: "above",
  },
  {
    icon: "🚀",
    title: "準備完了！",
    body: "さっそく始めましょう！カットを追加するか、まずは設定からスタジオを登録するのがおすすめです。",
  },
];

const cardVariants = {
  enter: { y: 16, opacity: 0 },
  center: { y: 0, opacity: 1 },
  exit: { y: -16, opacity: 0 },
};

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function useTargetRect(selector: string | undefined, isOpen: boolean) {
  const [rect, setRect] = useState<Rect | null>(null);

  const measure = useCallback(() => {
    if (!selector) {
      setRect(null);
      return;
    }
    const el = document.querySelector(selector);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ x: r.x, y: r.y, width: r.width, height: r.height });
  }, [selector]);

  useEffect(() => {
    if (!isOpen) return;
    // measure immediately + on resize/scroll
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure, isOpen]);

  return rect;
}

/** Padding around the spotlight circle */
const SPOT_PAD = 12;

export function TutorialOverlay() {
  const { isOpen, step, totalSteps, loaded, next, prev, skip, complete } =
    useTutorial();

  const current = steps[step];
  const targetRect = useTargetRect(current?.target, isOpen);

  if (!loaded || !isOpen) return null;

  const isLast = step === totalSteps - 1;
  const isFirst = step === 0;
  const hasSpotlight = !!current.target && !!targetRect;

  // Spotlight circle center & radius
  const spotCx = hasSpotlight ? targetRect.x + targetRect.width / 2 : 0;
  const spotCy = hasSpotlight ? targetRect.y + targetRect.height / 2 : 0;
  const spotRadius = hasSpotlight
    ? Math.max(targetRect.width, targetRect.height) / 2 + SPOT_PAD
    : 0;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Dark overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="tutorial-spotlight">
            <rect width="100%" height="100%" fill="white" />
            {hasSpotlight && (
              <motion.circle
                cx={spotCx}
                cy={spotCy}
                r={spotRadius}
                fill="black"
                initial={{ r: 0 }}
                animate={{ cx: spotCx, cy: spotCy, r: spotRadius }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.65)"
          mask="url(#tutorial-spotlight)"
        />
      </svg>

      {/* Spotlight ring pulse */}
      {hasSpotlight && (
        <motion.div
          className="absolute rounded-full border-2 border-primary/60 pointer-events-none"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: [0.6, 0.2, 0.6],
            scale: [1, 1.15, 1],
            x: spotCx - spotRadius,
            y: spotCy - spotRadius,
            width: spotRadius * 2,
            height: spotRadius * 2,
          }}
          transition={{
            opacity: { duration: 2, repeat: Infinity },
            scale: { duration: 2, repeat: Infinity },
            x: { duration: 0.4, ease: "easeInOut" },
            y: { duration: 0.4, ease: "easeInOut" },
            width: { duration: 0.4, ease: "easeInOut" },
            height: { duration: 0.4, ease: "easeInOut" },
          }}
        />
      )}

      {/* Skip button */}
      <button
        onClick={skip}
        className="absolute top-4 right-4 z-10 safe-area-top text-sm text-white/60 hover:text-white/90 transition-colors"
      >
        スキップ
      </button>

      {/* Info card */}
      <div
        className={`absolute left-0 right-0 z-10 flex justify-center px-4 ${
          hasSpotlight && current.cardPosition === "above"
            ? "bottom-auto"
            : "top-1/2 -translate-y-1/2"
        }`}
        style={
          hasSpotlight && current.cardPosition === "above"
            ? { top: Math.max(16, spotCy - spotRadius - 16) + "px", transform: "translateY(-100%)" }
            : undefined
        }
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={cardVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-sm"
          >
            <Card className="p-5 gap-3">
              <div className="flex flex-col items-center text-center gap-2">
                <span className="text-3xl">{current.icon}</span>
                <h3 className="text-base font-bold">{current.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {current.body}
                </p>
              </div>

              {/* Dot indicators */}
              <div className="flex justify-center gap-1.5">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-200 ${
                      i === step
                        ? "w-4 bg-primary"
                        : "w-1.5 bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div className="flex gap-2">
                {!isFirst && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={prev}
                  >
                    戻る
                  </Button>
                )}
                {isLast ? (
                  <Button size="sm" className="flex-1" onClick={complete}>
                    始める
                  </Button>
                ) : (
                  <Button size="sm" className="flex-1" onClick={next}>
                    次へ
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
