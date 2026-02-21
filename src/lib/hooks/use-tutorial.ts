"use client";

import { useState, useEffect, useCallback } from "react";
import { getSetting, setSetting } from "@/lib/db";

const TOTAL_STEPS = 6;

export function useTutorial() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function check() {
      const completed = await getSetting("tutorial_completed");
      if (!completed) {
        setIsOpen(true);
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

  const markDone = useCallback(async () => {
    await setSetting("tutorial_completed", "true");
    setIsOpen(false);
    setStep(0);
  }, []);

  return {
    isOpen,
    step,
    totalSteps: TOTAL_STEPS,
    loaded,
    next,
    prev,
    skip: markDone,
    complete: markDone,
  };
}
