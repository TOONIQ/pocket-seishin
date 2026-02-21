"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTutorial, TUTORIAL_STEPS } from "@/lib/hooks/use-tutorial";
import { AnimatePresence, motion } from "framer-motion";

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

function useTargetRect(selector: string | undefined, isOpen: boolean, step: number) {
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
    if (!isOpen || !selector) {
      setRect(null);
      return;
    }

    // Poll for the target element (it may not exist yet after navigation)
    let attempts = 0;
    const maxAttempts = 20; // 20 * 50ms = 1 second
    const pollInterval = setInterval(() => {
      const el = document.querySelector(selector);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ x: r.x, y: r.y, width: r.width, height: r.height });
        clearInterval(pollInterval);
      } else if (++attempts >= maxAttempts) {
        clearInterval(pollInterval);
      }
    }, 50);

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure, isOpen, selector, step]);

  return rect;
}

/** Padding around the spotlight circle */
const SPOT_PAD = 12;

export function TutorialOverlay() {
  const router = useRouter();
  const { isOpen, step, totalSteps, loaded, next, prev, skip, complete, currentStepDef } =
    useTutorial();
  const prevStepRef = useRef(step);

  const current = TUTORIAL_STEPS[step];
  const targetRect = useTargetRect(current?.target, isOpen, step);

  // Navigate when step changes
  useEffect(() => {
    if (!isOpen || !current?.navigateTo) return;
    if (prevStepRef.current !== step) {
      router.push(current.navigateTo);
    }
    prevStepRef.current = step;
  }, [step, isOpen, current?.navigateTo, router]);

  // Also navigate on initial open if step 0 has navigateTo
  useEffect(() => {
    if (isOpen && step === 0 && current?.navigateTo) {
      router.push(current.navigateTo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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
            : hasSpotlight && current.cardPosition === "below"
              ? "top-auto"
              : "top-1/2 -translate-y-1/2"
        }`}
        style={
          hasSpotlight && current.cardPosition === "above"
            ? { top: Math.max(16, spotCy - spotRadius - 16) + "px", transform: "translateY(-100%)" }
            : hasSpotlight && current.cardPosition === "below"
              ? { top: spotCy + spotRadius + 16 + "px" }
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
                  <div className="flex flex-col gap-2 flex-1">
                    <Button size="sm" className="w-full" onClick={() => complete(false)}>
                      デモデータを削除して始める
                    </Button>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => complete(true)}>
                      デモデータを残して始める
                    </Button>
                  </div>
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
