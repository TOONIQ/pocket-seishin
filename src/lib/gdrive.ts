const BACKUP_FILENAME = "seishin-backup.json";
const SCOPE = "https://www.googleapis.com/auth/drive.appdata email";

function getClientId(): string {
  const id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!id) throw new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set");
  return id;
}

export function getAuthUrl(): string {
  const redirectUri = `${window.location.origin}/settings`;
  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: redirectUri,
    response_type: "token",
    scope: SCOPE,
    include_granted_scopes: "true",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export function parseAccessTokenFromHash(hash: string): string | null {
  if (!hash || hash.length < 2) return null;
  const params = new URLSearchParams(hash.substring(1));
  return params.get("access_token");
}

export async function getUserEmail(token: string): Promise<string | null> {
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.email ?? null;
  } catch {
    return null;
  }
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
