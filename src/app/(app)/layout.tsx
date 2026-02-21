"use client";

import { BottomNav } from "@/components/bottom-nav";
import { SyncIndicator } from "@/components/sync-indicator";
import { TutorialOverlay } from "@/components/tutorial-overlay";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
