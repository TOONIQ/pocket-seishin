"use client";

import { useEffect } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { SyncIndicator } from "@/components/sync-indicator";
import { TutorialOverlay } from "@/components/tutorial-overlay";
import { useNotifications } from "@/lib/hooks/use-notifications";
import { getSetting, setSetting } from "@/lib/db";

export function AppShell({ children }: { children: React.ReactNode }) {
  // Initialize notification scheduler (runs check every 30min when enabled)
  useNotifications();

  // Record first access timestamp
  useEffect(() => {
    getSetting("registered_at").then((v) => {
      if (!v) setSetting("registered_at", new Date().toISOString());
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg safe-area-top">
        <div className="flex items-center justify-between h-12 px-4 max-w-lg mx-auto">
          <h1 className="text-sm font-bold tracking-tight">ポケット制作進行</h1>
          <SyncIndicator />
        </div>
      </header>
      <main className="pb-20 max-w-lg mx-auto">
        {children}
      </main>
      <BottomNav />
      <TutorialOverlay />
    </div>
  );
}
