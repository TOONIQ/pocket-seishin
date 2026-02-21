import { db, getSetting, setSetting } from "@/lib/db";
import { isToday, isTomorrow, isPast, differenceInDays, parseISO } from "date-fns";
import type { Cut } from "@/types/cut";

// Cooldown durations in milliseconds
const COOLDOWN = {
  overdue: 2 * 60 * 60 * 1000,    // 2 hours
  today: 4 * 60 * 60 * 1000,       // 4 hours
  tomorrow: 24 * 60 * 60 * 1000,   // 24 hours
  followup: 24 * 60 * 60 * 1000,   // 24 hours
} as const;

type NotifType = "overdue" | "today" | "tomorrow" | "followup";

interface PendingNotification {
  type: NotifType;
  cutId: number;
  title: string;
  body: string;
  url: string;
}

function cooldownKey(type: NotifType, cutId: number): string {
  return `notif_${type}_${cutId}`;
}

async function isCoolingDown(type: NotifType, cutId: number): Promise<boolean> {
  const key = cooldownKey(type, cutId);
  const lastSent = await getSetting(key);
  if (!lastSent) return false;
  const elapsed = Date.now() - new Date(lastSent).getTime();
  return elapsed < COOLDOWN[type];
}

async function markSent(type: NotifType, cutId: number): Promise<void> {
  const key = cooldownKey(type, cutId);
  await setSetting(key, new Date().toISOString());
}

function cutLabel(cut: Cut): string {
  return `${cut.projectName} #${cut.cutNumber}`;
}

async function collectDeadlineNotifications(): Promise<PendingNotification[]> {
  const pending: PendingNotification[] = [];
  const cuts = await db.cuts
    .filter((c) => c.step !== "done" && !!c.deadline)
    .toArray();

  for (const cut of cuts) {
    if (!cut.deadline || !cut.id) continue;
    const deadline = parseISO(cut.deadline);
    const label = cutLabel(cut);

    if (isPast(deadline) && !isToday(deadline)) {
      const days = differenceInDays(new Date(), deadline);
      if (!(await isCoolingDown("overdue", cut.id))) {
        pending.push({
          type: "overdue",
          cutId: cut.id,
          title: "期限超過",
          body: `期限超過: ${label} (${days}日超過)`,
          url: `/cuts/${cut.id}`,
        });
      }
    } else if (isToday(deadline)) {
      if (!(await isCoolingDown("today", cut.id))) {
        pending.push({
          type: "today",
          cutId: cut.id,
          title: "今日が締切",
          body: `今日が締切: ${label}`,
          url: `/cuts/${cut.id}`,
        });
      }
    } else if (isTomorrow(deadline)) {
      if (!(await isCoolingDown("tomorrow", cut.id))) {
        pending.push({
          type: "tomorrow",
          cutId: cut.id,
          title: "明日が締切",
          body: `明日が締切: ${label}`,
          url: `/cuts/${cut.id}`,
        });
      }
    }
  }

  return pending;
}

async function collectFollowupNotifications(thresholdDays: number): Promise<PendingNotification[]> {
  const pending: PendingNotification[] = [];
  const cuts = await db.cuts
    .filter((c) => c.step === "submitted")
    .toArray();

  for (const cut of cuts) {
    if (!cut.id) continue;
    // Use updatedAt as the submission timestamp
    const submittedAt = parseISO(cut.updatedAt);
    const daysSince = differenceInDays(new Date(), submittedAt);

    if (daysSince >= thresholdDays) {
      if (!(await isCoolingDown("followup", cut.id))) {
        const label = cutLabel(cut);
        const body = daysSince >= 14
          ? `提出から${daysSince}日: ${label} そろそろ連絡を`
          : `提出から${daysSince}日: ${label}`;
        pending.push({
          type: "followup",
          cutId: cut.id,
          title: "提出フォローアップ",
          body,
          url: `/cuts/${cut.id}`,
        });
      }
    }
  }

  return pending;
}

export async function checkAndNotify(): Promise<void> {
  // Check master toggle
  const enabled = await getSetting("notifications_enabled");
  if (enabled !== "true") return;

  // Check browser permission
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

  const deadlineEnabled = await getSetting("notifications_deadline");
  const followupEnabled = await getSetting("notifications_followup");
  const followupDaysStr = await getSetting("notifications_followup_days");
  const followupDays = parseInt(followupDaysStr || "7") || 7;

  const notifications: PendingNotification[] = [];

  if (deadlineEnabled !== "false") {
    notifications.push(...(await collectDeadlineNotifications()));
  }

  if (followupEnabled !== "false") {
    notifications.push(...(await collectFollowupNotifications(followupDays)));
  }

  // Fire via Service Worker
  const reg = await navigator.serviceWorker?.ready;
  for (const notif of notifications) {
    if (reg) {
      await reg.showNotification(notif.title, {
        body: notif.body,
        icon: "/icon-192x192.png",
        tag: `${notif.type}-${notif.cutId}`,
        data: { url: notif.url },
      });
    }
    await markSent(notif.type, notif.cutId);
  }
}
