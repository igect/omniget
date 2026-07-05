import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

export interface Profile {
  url: string;
  username?: string;
  platform: string;
  added_at: number;
}

export interface DownloadResult {
  success: boolean;
  message: string;
  files_count?: number;
}

export interface DownloadProgress {
  progress: number;
  message: string;
  files_downloaded: number;
}

export interface DownloadStats {
  total_downloads: number;
  total_files: number;
  success_rate: number;
}

export interface QueuedDownload {
  id: string;
  url: string;
  platform: string;
  content_type: string;
  output_dir: string;
  cookies_file?: string;
  status: string;
  progress: number;
  files_downloaded: number;
  created_at: number;
}

export async function checkPythonDependencies(): Promise<string> {
  return await invoke<string>('check_python_dependencies');
}

export async function validateProfileUrl(url: string, platform: string): Promise<string> {
  return await invoke<string>('validate_profile_url', { url, platform });
}

export async function runGalleryDlDownload(
  url: string,
  outputDir: string,
  cookiesFile: string | null,
  contentType: string,
  downloadId: string
): Promise<DownloadResult> {
  return await invoke<DownloadResult>('run_gallery_dl_download', {
    url,
    outputDir,
    cookiesFile,
    contentType,
    downloadId
  });
}

export async function listenToDownloadProgress(
  downloadId: string,
  callback: (progress: DownloadProgress) => void
): Promise<UnlistenFn> {
  return await listen<DownloadProgress>(`download_${downloadId}`, (event) => {
    callback(event.payload);
  });
}

export async function loadProfiles(platform: string): Promise<Profile[]> {
  return await invoke<Profile[]>('load_profiles', { platform });
}

export async function saveProfile(platform: string, url: string): Promise<string> {
  return await invoke<string>('save_profile', { platform, url });
}

export async function deleteProfile(platform: string, index: number): Promise<string> {
  return await invoke<string>('delete_profile', { platform, index });
}

export async function setupOpenMintFolders(baseDir: string, cookiesDir: string): Promise<string> {
  return await invoke<string>('setup_openmint_folders', { baseDir, cookiesDir });
}

export async function getDownloadStats(): Promise<DownloadStats> {
  return await invoke<DownloadStats>('get_download_stats');
}

export async function saveDownloadStats(stats: DownloadStats): Promise<string> {
  return await invoke<string>('save_download_stats', { stats });
}

export function generateDownloadId(): string {
  return `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
