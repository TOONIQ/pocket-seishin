declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
            error_callback?: (error: { type: string; message?: string }) => void;
          }): { requestAccessToken(): void };
        };
      };
    };
  }
}

const BACKUP_FILENAME = "seishin-backup.json";
const SCOPE = "https://www.googleapis.com/auth/drive.appdata";

function getClientId(): string {
  const id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!id) throw new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set");
  return id;
}

let gisLoaded = false;

export async function loadGisScript(): Promise<void> {
  if (gisLoaded && window.google?.accounts?.oauth2) return;

  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src*="gsi/client"]')) {
      gisLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      gisLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
}

export async function requestAccessToken(): Promise<string> {
  await loadGisScript();

  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: getClientId(),
      scope: SCOPE,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else if (response.access_token) {
          resolve(response.access_token);
        } else {
          reject(new Error("No access token received"));
        }
      },
      error_callback: (error) => {
        reject(new Error(error.message || "ポップアップが閉じられました"));
      },
    });
    client.requestAccessToken();
  });
}

async function findBackupFileId(token: string): Promise<string | null> {
  const params = new URLSearchParams({
    spaces: "appDataFolder",
    q: `name='${BACKUP_FILENAME}'`,
    fields: "files(id)",
    pageSize: "1",
  });

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) throw new Error(`Drive API error: ${res.status}`);
  const data = await res.json();
  return data.files?.[0]?.id ?? null;
}

export async function uploadBackup(
  token: string,
  jsonString: string
): Promise<{ id: string; createdAt: string }> {
  const existingId = await findBackupFileId(token);

  const metadata = {
    name: BACKUP_FILENAME,
    ...(existingId ? {} : { parents: ["appDataFolder"] }),
  };

  const boundary = "seishin_backup_boundary";
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${jsonString}\r\n` +
    `--${boundary}--`;

  const url = existingId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=multipart&fields=id,createdTime`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,createdTime`;

  const method = existingId ? "PATCH" : "POST";

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  const data = await res.json();
  return { id: data.id, createdAt: data.createdTime };
}

export async function downloadBackup(
  token: string
): Promise<string | null> {
  const fileId = await findBackupFileId(token);
  if (!fileId) return null;

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  return res.text();
}

export async function getBackupInfo(
  token: string
): Promise<{ modifiedTime: string; size: string } | null> {
  const params = new URLSearchParams({
    spaces: "appDataFolder",
    q: `name='${BACKUP_FILENAME}'`,
    fields: "files(id,modifiedTime,size)",
    pageSize: "1",
  });

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) throw new Error(`Drive API error: ${res.status}`);
  const data = await res.json();
  const file = data.files?.[0];
  if (!file) return null;

  return { modifiedTime: file.modifiedTime, size: file.size };
}
