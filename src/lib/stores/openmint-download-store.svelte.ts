import {
  runGalleryDlDownload,
  cancelDownload,
  listenToDownloadProgress,
  generateDownloadId,
  type DownloadProgress,
} from "$lib/api/openmint";

export type StatusType = "success" | "error" | "info";

let active = $state(false);
let downloadId = $state<string | null>(null);
let filesDownloaded = $state(0);
let liveOutput = $state<string[]>([]);
let status = $state("");
let statusType = $state<StatusType>("info");
let lastFilesCount = $state(0);
let unlisten: (() => void) | null = null;

export function isActive(): boolean {
  return active;
}

export function getDownloadId(): string | null {
  return downloadId;
}

export function getFilesDownloaded(): number {
  return filesDownloaded;
}

export function getLiveOutput(): string[] {
  return liveOutput;
}

export function getStatus(): string {
  return status;
}

export function getStatusType(): StatusType {
  return statusType;
}

export function getLastFilesCount(): number {
  return lastFilesCount;
}

export function clearStatus() {
  status = "";
  statusType = "info";
}

function cleanPathLike(value: string): string {
  const trimmed = value.trim();
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
     (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export async function startDownload(
  url: string,
  outputDir: string,
  cookiesFile: string,
  contentType: string,
) {
  if (active) {
    throw new Error("A download is already in progress");
  }

  const cleanUrl = url.trim();
  const cleanOutputDir = cleanPathLike(outputDir);
  const cleanCookiesFile = cookiesFile.trim() ? cleanPathLike(cookiesFile) : "";

  if (!cleanUrl || !cleanOutputDir) {
    status = "Please fill in all required fields";
    statusType = "error";
    return;
  }

  // Stories/Highlights need cookies - Instagram blocks anonymous access.
  // Catching this here means the invoke round-trip (and its generic
  // catch-all error) never even happens for the common mistake.
  if ((contentType === "stories" || contentType === "highlights") && !cleanCookiesFile) {
    status = "Stories and Highlights require a cookies file - Instagram blocks anonymous access to this content.";
    statusType = "error";
    return;
  }

  active = true;
  filesDownloaded = 0;
  liveOutput = [];
  status = "Starting download...";
  statusType = "info";

  const id = generateDownloadId();
  downloadId = id;

  try {
    unlisten = await listenToDownloadProgress(id, (progressData: DownloadProgress) => {
      liveOutput = [...liveOutput, progressData.message];
      if (progressData.files_downloaded > 0) {
        filesDownloaded = progressData.files_downloaded;
      }
    });

    const result = await runGalleryDlDownload(
      cleanUrl,
      cleanOutputDir,
      cleanCookiesFile || null,
      contentType,
      id,
    );

    if (result.success) {
      status = `✅ Downloaded ${result.files_count} files successfully!`;
      statusType = "success";
      filesDownloaded = result.files_count;
      lastFilesCount = result.files_count;
    } else {
      status = `❌ ${result.message}`;
      statusType = "error";
    }
  } catch (error) {
    status = `❌ Download failed: ${error}`;
    statusType = "error";
  } finally {
    active = false;
    if (unlisten) {
      unlisten();
      unlisten = null;
    }
    downloadId = null;
  }
}

export async function stopDownload() {
  if (!active || !downloadId) return;

  try {
    await cancelDownload(downloadId);
    status = "Download cancelled";
    statusType = "info";
  } catch (error) {
    console.error('Failed to cancel download:', error);
    status = `Failed to cancel: ${error}`;
    statusType = "error";
  } finally {
    active = false;
    if (unlisten) {
      unlisten();
      unlisten = null;
    }
    downloadId = null;
  }
}

export async function reattachIfActive() {
  if (!active || !downloadId || unlisten) return;

  unlisten = await listenToDownloadProgress(downloadId, (progressData: DownloadProgress) => {
    liveOutput = [...liveOutput, progressData.message];
    if (progressData.files_downloaded > 0) {
      filesDownloaded = progressData.files_downloaded;
    }
  });
}
