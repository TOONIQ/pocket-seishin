"use client";

import { useState, useEffect, useCallback } from "react";
import { getSetting, setSetting } from "@/lib/db";
import { insertDemoData, removeDemoData } from "@/lib/demo-data";

export interface TutorialStepDef {
  icon: string;
  title: string;
  body: string;
  target?: string;
  cardPosition?: "above" | "below";
  navigateTo?: string;
  isPwaInstall?: boolean;
}

export const TUTORIAL_STEPS: TutorialStepDef[] = [
  {
    icon: "🎬",
    title: "ようこそ",
    body: "フリーランスアニメーターのためのカット管理アプリです。\nデモデータを使って実際の画面を見ながら使い方を紹介します。",
  },
  {
    icon: "🔒",
    title: "データは端末の中だけ",
    body: "データは端末にローカル保存。サーバーには送信されません。\nブラウザのデータ削除で消えるのでご注意を。",
  },
  {
    icon: "🏢",
    title: "スタジオ登録",
    body: "取引先スタジオを登録しましょう。スタジオ名とデフォルト単価を設定すると、カット追加時に自動で単価が入ります。",
    target: '[data-tutorial="studio-section"]',
    cardPosition: "below",
    navigateTo: "/settings",
  },
  {
    icon: "📋",
    title: "カットを追加",
    body: "受け取ったカットを登録して進捗管理。受領 → 作業中 → 提出 → 完了のステップで状態を追跡できます。",
    target: '[data-tutorial="cut-add-button"]',
    cardPosition: "below",
    navigateTo: "/cuts",
  },
  {
    icon: "📅",
    title: "スケジュール",
    body: "締切のあるカットが週間タイムラインで表示されます。今週・来週の作業量を一目で把握できます。",
    target: '[data-tutorial="schedule-deadline"]',
    cardPosition: "below",
    navigateTo: "/schedule",
  },
  {
    icon: "⏰",
    title: "締切アラート",
    body: "締切が近いカットはダッシュボードにアラート表示されます。期限内に提出できるよう管理しましょう。",
    target: '[data-tutorial="deadline-alert"]',
    cardPosition: "below",
    navigateTo: "/dashboard",
  },
  {
    icon: "💰",
    title: "収入管理",
    body: "月収目標を設定すると、日ノルマと達成率がリングで表示されます。確定申告用のCSVエクスポートも可能です。",
    target: '[data-tutorial="income-ring"]',
    cardPosition: "above",
    navigateTo: "/dashboard",
  },
  {
    icon: "📲",
    title: "ホーム画面に追加",
    body: "PWAアプリなので、スマホのホーム画面に追加するとネイティブアプリのように使えます。",
    isPwaInstall: true,
  },
  {
    icon: "🚀",
    title: "準備完了！",
    body: "チュートリアルは以上です。\nデモデータを削除して、さっそく始めましょう！",
  },
];

const TOTAL_STEPS = TUTORIAL_STEPS.length;

export function useTutorial() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function check() {
      const completed = await getSetting("tutorial_completed");
      if (!completed) {
        setIsOpen(true);
        await insertDemoData();
      }
      setLoaded(true);
    }
    check();
  }, []);

  const next = useCallback(() => {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }, []);

  const prev = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const skip = useCallback(async () => {
    await removeDemoData();
    await setSetting("tutorial_completed", "true");
    setIsOpen(false);
    setStep(0);
  }, []);

  const complete = useCallback(async () => {
    await removeDemoData();
    await setSetting("tutorial_completed", "true");
    setIsOpen(false);
    setStep(0);
  }, []);

  const restart = useCallback(async () => {
    await insertDemoData();
    setStep(0);
    setIsOpen(true);
  }, []);

  return {
    isOpen,
    step,
    totalSteps: TOTAL_STEPS,
    loaded,
    next,
    prev,
    skip,
    complete,
    restart,
    currentStepDef: TUTORIAL_STEPS[step],
  };
}
