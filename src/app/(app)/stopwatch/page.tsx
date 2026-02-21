"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";

const FPS = 24;
const FRAME_MS = 1000 / FPS;

interface Lap {
  frames: number;
  splitFrames: number;
}

function formatFrameTime(totalFrames: number) {
  const seconds = Math.floor(totalFrames / FPS);
  const frames = totalFrames % FPS;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (minutes > 0) {
    return `${minutes}:${String(secs).padStart(2, "0")}+${String(frames).padStart(2, "0")}`;
  }
  return `${secs}+${String(frames).padStart(2, "0")}`;
}

export default function StopwatchPage() {
  const [totalFrames, setTotalFrames] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<Lap[]>([]);
  const startTimeRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);

  const tick = useCallback(() => {
    const elapsed = performance.now() - startTimeRef.current + accumulatedRef.current;
    setTotalFrames(Math.floor(elapsed / FRAME_MS));
    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = performance.now();
      animFrameRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning, tick]);

  function handleStartStop() {
    if (isRunning) {
      cancelAnimationFrame(animFrameRef.current);
      accumulatedRef.current += performance.now() - startTimeRef.current;
      setIsRunning(false);
    } else {
      setIsRunning(true);
    }
  }

  function handleReset() {
    cancelAnimationFrame(animFrameRef.current);
    setIsRunning(false);
    setTotalFrames(0);
    accumulatedRef.current = 0;
    setLaps([]);
  }

  function handleLap() {
    const prevTotal = laps.length > 0 ? laps[laps.length - 1].frames : 0;
    setLaps([...laps, {
      frames: totalFrames,
      splitFrames: totalFrames - prevTotal,
    }]);
  }

  const seconds = totalFrames / FPS;
  const frames = totalFrames % FPS;
  const on2s = Math.ceil(totalFrames / 2);
  const on3s = Math.ceil(totalFrames / 3);

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-lg font-bold">フレームストップウォッチ</h2>

      {/* Main Display */}
      <div className="text-center space-y-2 pt-4">
        <div className="font-mono">
          <span className="text-7xl font-bold tabular-nums">
            {totalFrames}
          </span>
          <span className="text-3xl text-muted-foreground ml-1">f</span>
        </div>

        <p className="text-xl font-mono text-muted-foreground tabular-nums">
          {formatFrameTime(totalFrames)}
        </p>

        <div className="flex justify-center gap-8 text-sm pt-2">
          <div className="text-center">
            <p className="font-mono font-bold text-lg tabular-nums">{on2s}</p>
            <p className="text-[10px] text-muted-foreground">コマ打ち2</p>
          </div>
          <div className="text-center">
            <p className="font-mono font-bold text-lg tabular-nums">{on3s}</p>
            <p className="text-[10px] text-muted-foreground">コマ打ち3</p>
          </div>
          <div className="text-center">
            <p className="font-mono font-bold text-lg tabular-nums">{seconds.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">秒</p>
          </div>
        </div>
      </div>

      {/* Frame bar */}
      <div>
        <div className="flex gap-px justify-center">
          {Array.from({ length: FPS }, (_, i) => (
            <div
              key={i}
              className={`w-2.5 h-7 rounded-sm transition-colors ${
                i < frames ? "bg-cyan-400" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="text-center text-[10px] text-muted-foreground mt-1">
          24fps — 1秒 = 24フレーム
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-4 justify-center pt-2">
        <Button
          variant="outline"
          className="w-22 h-22 rounded-full text-sm"
          onClick={isRunning ? handleLap : handleReset}
          disabled={!isRunning && totalFrames === 0}
        >
          {isRunning ? "ラップ" : "リセット"}
        </Button>
        <Button
          className={`w-22 h-22 rounded-full text-sm ${
            isRunning
              ? "bg-red-500 hover:bg-red-600"
              : "bg-green-500 hover:bg-green-600"
          }`}
          onClick={handleStartStop}
        >
          {isRunning ? "停止" : "開始"}
        </Button>
      </div>

      {/* Laps */}
      {laps.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-bold text-muted-foreground">ラップ</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {[...laps].reverse().map((lap, idx) => (
              <div
                key={laps.length - 1 - idx}
                className="flex items-center justify-between text-sm font-mono px-2 py-1.5 rounded bg-muted/50"
              >
                <span className="text-muted-foreground text-xs">
                  #{laps.length - idx}
                </span>
                <span className="tabular-nums">
                  {lap.splitFrames}f ({formatFrameTime(lap.splitFrames)})
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatFrameTime(lap.frames)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
