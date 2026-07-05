import { invoke } from '@tauri-apps/api/core';

export interface Profile {
  url: string;
  username?: string;
  platform: string;
}

export interface DownloadResult {
  success: boolean;
  message: string;
  files_count?: number;
}

export async function checkPythonDependencies(): Promise<string> {
  return await invoke<string>('check_python_dependencies');
}

export async function runGalleryDlDownload(
  url: string,
  outputDir: string,
  cookiesFile: string | null,
  contentType: string
): Promise<DownloadResult> {
  return await invoke<DownloadResult>('run_gallery_dl_download', {
    url,
    outputDir,
    cookiesFile,
    contentType
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
