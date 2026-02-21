"use client";

import { useState, useEffect, useCallback } from "react";
import { encrypt, decrypt } from "@/lib/crypto";
import { exportAllData, importAllData, type BackupData } from "@/lib/backup";
import {
  getAuthUrl,
  parseAccessTokenFromHash,
  uploadBackup,
  downloadBackup,
  getBackupInfo,
} from "@/lib/gdrive";
import { getSetting, setSetting } from "@/lib/db";

interface UseBackupReturn {
  isSignedIn: boolean;
  lastBackup: string | null;
  isLoading: boolean;
  error: string | null;
  passphrase: string;
  setPassphrase: (v: string) => void;
  signIn: () => void;
  backup: () => Promise<void>;
  restore: () => Promise<BackupData>;
  confirmRestore: (data: BackupData) => Promise<void>;
}

const PASSPHRASE_KEY = "backup_passphrase";

export function useBackup(): UseBackupReturn {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passphrase, setPassphrase] = useState("");
  const [token, setToken] = useState<string | null>(null);

  // Load saved passphrase on mount
  useEffect(() => {
    getSetting(PASSPHRASE_KEY).then((saved) => {
      if (saved) setPassphrase(saved);
    });
  }, []);

  // Save passphrase when changed
  useEffect(() => {
    if (passphrase) {
      setSetting(PASSPHRASE_KEY, passphrase);
    }
  }, [passphrase]);

  // Check for OAuth redirect token on mount
  useEffect(() => {
    const accessToken = parseAccessTokenFromHash(window.location.hash);
    if (accessToken) {
      setToken(accessToken);
      setIsSignedIn(true);
      // Clean up hash from URL
      window.history.replaceState(null, "", window.location.pathname);
      // Fetch backup info
      getBackupInfo(accessToken)
        .then((info) => {
          if (info) setLastBackup(info.modifiedTime);
        })
        .catch(() => {});
    }
  }, []);

  const signIn = useCallback(() => {
    setError(null);
    try {
      window.location.href = getAuthUrl();
    } catch (e) {
      setError(e instanceof Error ? e.message : "接続に失敗しました");
    }
  }, []);

  const backup = useCallback(async () => {
    if (!token) throw new Error("Not signed in");
    if (!passphrase) throw new Error("パスフレーズを入力してください");

    setIsLoading(true);
    setError(null);
    try {
      const data = await exportAllData();
      const json = JSON.stringify(data);
      const encrypted = await encrypt(json, passphrase);
      const encryptedJson = JSON.stringify(encrypted);
      const result = await uploadBackup(token, encryptedJson);
      setLastBackup(result.createdAt);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "バックアップに失敗しました";
      setError(msg);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [token, passphrase]);

  const restore = useCallback(async (): Promise<BackupData> => {
    if (!token) throw new Error("Not signed in");
    if (!passphrase) throw new Error("パスフレーズを入力してください");

    setIsLoading(true);
    setError(null);
    try {
      const encryptedJson = await downloadBackup(token);
      if (!encryptedJson) throw new Error("バックアップが見つかりません");

      const encrypted = JSON.parse(encryptedJson);
      let decryptedJson: string;
      try {
        decryptedJson = await decrypt(encrypted, passphrase);
      } catch {
        throw new Error("パスフレーズが正しくありません");
      }

      return JSON.parse(decryptedJson) as BackupData;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "復元に失敗しました";
      setError(msg);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [token, passphrase]);

  const confirmRestore = useCallback(
    async (data: BackupData) => {
      setIsLoading(true);
      setError(null);
      try {
        await importAllData(data);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "復元に失敗しました";
        setError(msg);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isSignedIn,
    lastBackup,
    isLoading,
    error,
    passphrase,
    setPassphrase,
    signIn,
    backup,
    restore,
    confirmRestore,
  };
}
