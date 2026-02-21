"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getSetting, setSetting } from "@/lib/db";
import { checkAndNotify } from "@/lib/notifications";

const CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes

interface NotificationSettings {
  enabled: boolean;
  deadline: boolean;
  followup: boolean;
  followupDays: number;
  permission: NotificationPermission | "unsupported";
}

export function useNotifications() {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    deadline: true,
    followup: true,
    followupDays: 7,
    permission: "unsupported",
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load settings from IndexedDB
  useEffect(() => {
    async function load() {
      const permission =
        typeof Notification !== "undefined" ? Notification.permission : "unsupported";

      const [enabled, deadline, followup, followupDays] = await Promise.all([
        getSetting("notifications_enabled"),
        getSetting("notifications_deadline"),
        getSetting("notifications_followup"),
        getSetting("notifications_followup_days"),
      ]);

      setSettings({
        enabled: enabled === "true",
        deadline: deadline !== "false",
        followup: followup !== "false",
        followupDays: parseInt(followupDays || "7") || 7,
        permission: permission as NotificationPermission | "unsupported",
      });
    }
    load();
  }, []);

  // Schedule periodic checks when enabled
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (settings.enabled && settings.permission === "granted") {
      // Check immediately on mount/enable
      checkAndNotify();
      intervalRef.current = setInterval(checkAndNotify, CHECK_INTERVAL);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [settings.enabled, settings.permission]);

  const setEnabled = useCallback(async (value: boolean) => {
    if (value && typeof Notification !== "undefined") {
      const perm = await Notification.requestPermission();
      setSettings((prev) => ({ ...prev, permission: perm }));
      if (perm !== "granted") {
        await setSetting("notifications_enabled", "false");
        setSettings((prev) => ({ ...prev, enabled: false }));
        return;
      }
    }
    await setSetting("notifications_enabled", value ? "true" : "false");
    setSettings((prev) => ({ ...prev, enabled: value }));
  }, []);

  const setDeadline = useCallback(async (value: boolean) => {
    await setSetting("notifications_deadline", value ? "true" : "false");
    setSettings((prev) => ({ ...prev, deadline: value }));
  }, []);

  const setFollowup = useCallback(async (value: boolean) => {
    await setSetting("notifications_followup", value ? "true" : "false");
    setSettings((prev) => ({ ...prev, followup: value }));
  }, []);

  const setFollowupDays = useCallback(async (days: number) => {
    await setSetting("notifications_followup_days", String(days));
    setSettings((prev) => ({ ...prev, followupDays: days }));
  }, []);

  return {
    ...settings,
    supported: typeof Notification !== "undefined",
    setEnabled,
    setDeadline,
    setFollowup,
    setFollowupDays,
  };
}
