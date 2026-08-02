<script lang="ts">
  import { open } from '@tauri-apps/plugin-dialog';
  import {
    checkPythonDependencies,
    saveAppSettings,
    loadAppSettings,
    loadProfiles,
  } from '$lib/api/openmint';
  import {
    isActive,
    getFilesDownloaded,
    getLiveOutput,
    getStatus,
    getStatusType,
    getLastFilesCount,
    clearStatus as clearStoreStatus,
    startDownload as startStoreDownload,
    stopDownload as stopStoreDownload,
    reattachIfActive,
  } from '$lib/stores/openmint-download-store.svelte';
  import { createEventDispatcher, onMount } from 'svelte';

  const dispatch = createEventDispatcher();

  let url = $state('');
  let outputDir = $state('');
  let contentType = $state('all');
  let cookiesFile = $state('');
  let depsStatus = $state('');

  function detectPlatform(url: string): string {
    const low = url.toLowerCase();
    if (low.includes('instagram.com')) return 'Instagram';
    if (low.includes('tiktok.com')) return 'TikTok';
    if (low.includes('facebook.com')) return 'Facebook';
    if (low.includes('x.com') || low.includes('twitter.com')) return 'X';
    return 'Other';
  }

  let savedProfiles = $state<Array<{ url: string; username?: string; _platformLabel?: string }>>([]);
  let selectedProfileIndex = $state(-1);

  let downloading = $derived(isActive());
  let filesDownloaded = $derived(getFilesDownloaded());
  let liveOutput = $derived(getLiveOutput());
  let status = $derived(getStatus());
  let statusType = $derived(getStatusType());

  let needsCookiesWarning = $derived(
    (contentType === 'stories' || contentType === 'highlights') && !cookiesFile.trim()
  );

  let currentPlatform = $derived(detectPlatform(getDownloadUrl() ?? ''));
  let isInstagram = $derived(currentPlatform === 'Instagram');

  let platformMismatch = $derived(
    (contentType === 'stories' || contentType === 'highlights') && !isInstagram
  );

  onMount(async () => {
    reattachIfActive();

    try {
      const settings = await loadAppSettings();
      if (settings.output_directory) {
        outputDir = settings.output_directory;
      }
      if (settings.cookies_file) {
        cookiesFile = settings.cookies_file;
      }

      await loadSavedProfiles();
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  });

  async function loadSavedProfiles() {
    try {
      const platformLabels: Record<string, string> = {
        instagram: 'Instagram',
        tiktok: 'TikTok',
        facebook: 'Facebook',
        x: 'X',
      };
      const results = await Promise.all(
        Object.keys(platformLabels).map(async (platform) => {
          const profiles = await loadProfiles(platform);
          return profiles.map((p) => ({ ...p, _platformLabel: platformLabels[platform] }));
        })
      );
      savedProfiles = results.flat();

      if (savedProfiles.length > 0 && selectedProfileIndex === -1 && !url.trim()) {
        selectedProfileIndex = 0;
      }
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }
  }

  async function checkDeps() {
    try {
      depsStatus = await checkPythonDependencies();
      if (depsStatus.includes('OK')) {
        setTimeout(() => {
          if (depsStatus.includes('OK')) {
            depsStatus = '';
          }
        }, 3000);
      }
    } catch (error) {
      depsStatus = `Error: ${error}`;
    }
  }

  function getDownloadUrl(): string | null {
    if (url.trim()) {
      return url.trim();
    }
    if (selectedProfileIndex >= 0 && savedProfiles[selectedProfileIndex]) {
      return savedProfiles[selectedProfileIndex].url;
    }
    return null;
  }

  async function startDownload() {
    const downloadUrl = getDownloadUrl();

    if (!downloadUrl || !outputDir.trim()) {
      clearStoreStatus();
      return;
    }

    const startedContentType = contentType;

    try {
      await startStoreDownload(downloadUrl, outputDir, cookiesFile, contentType);
    } catch (error) {
      console.error('Failed to start download:', error);
      return;
    }

    if (getStatusType() === 'success') {
      dispatch('downloadComplete', {
        url: downloadUrl,
        platform: startedContentType,
        filesCount: getLastFilesCount()
      });
    }
  }

  async function handleStop() {
    await stopStoreDownload();
  }

  async function saveSettings() {
    try {
      await saveAppSettings(
        outputDir || null,
        cookiesFile || null
      );
      clearStoreStatus();
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  function clearStatus() {
    clearStoreStatus();
  }

  function selectProfile(index: number) {
    selectedProfileIndex = index;
    if (index >= 0) {
      url = '';
    }
  }

  function clearSelectedProfile() {
    selectedProfileIndex = -1;
  }

  $effect(() => {
    checkDeps();
  });

  $effect(() => {
    if (url.trim()) {
      selectedProfileIndex = -1;
    }
  });

  $effect(() => {
    if ((contentType === 'stories' || contentType === 'highlights') && !isInstagram) {
      contentType = 'photos';
    }
  });

  async function browseOutputDir() {
    const selected = await open({ directory: true, multiple: false, title: 'Select Output Directory' });
    if (selected) outputDir = selected;
  }

  async function browseCookiesFile() {
    const selected = await open({ directory: false, multiple: false, title: 'Select Cookies File' });
    if (selected) cookiesFile = selected;
  }
</script>

<div class="download-manager">
  {#if depsStatus}
    <div class="deps-check" class:ok={depsStatus.includes('OK')} class:error={!depsStatus.includes('OK')}>
      <span>{depsStatus}</span>
    </div>
  {/if}

  {#if status}
    <div class="status-alert" class:success={statusType === 'success'} class:error={statusType === 'error'}>
      <span>{status}</span>
      <button class="close-alert" onclick={clearStatus}>×</button>
    </div>
  {/if}

  <div class="form-group">
    <label for="profile-url">Profile URL</label>
    <input
      id="profile-url"
      type="text"
      bind:value={url}
      placeholder="https://instagram.com/username"
      disabled={downloading}
      oninput={clearSelectedProfile}
    />
    {#if !url.trim() && savedProfiles.length > 0}
      <p class="profile-label">Or select a saved profile</p>
      <div class="profile-list">
        {#each savedProfiles as profile, index}
          <button
            class:profile-button={true}
            class:selected={selectedProfileIndex === index}
            onclick={() => selectProfile(index)}
            disabled={downloading}
          >
            <span class="profile-name">{profile.username || profile.url}</span>
            {#if profile._platformLabel}
              <span class="profile-platform">{profile._platformLabel}</span>
            {/if}
            {#if selectedProfileIndex === index}
              <span class="checkmark">✓</span>
            {/if}
          </button>
        {/each}
      </div>
    {:else if !url.trim() && savedProfiles.length === 0}
      <p class="no-profiles">No saved profiles — <button class="inline-link" onclick={() => dispatch('switchToProfiles')}>add one</button></p>
    {/if}
  </div>

  <div class="form-group">
    <label for="output-dir">Output Directory</label>
      <div class="input-with-button">
        <input
          id="output-dir"
          type="text"
          bind:value={outputDir}
          disabled={downloading}
        />
        <button class="browse-btn" onclick={browseOutputDir} disabled={downloading}>Browse</button>
      </div>
  </div>

  <div class="form-group">
    <span class="form-group-label">Content Type</span>
    <div class="segmented">
      <button type="button" class:active={contentType === 'all'} onclick={() => contentType = 'all'} disabled={downloading}>All</button>
      <button type="button" class:active={contentType === 'photos'} onclick={() => contentType = 'photos'} disabled={downloading}>Photos</button>
      <button type="button" class:active={contentType === 'videos'} onclick={() => contentType = 'videos'} disabled={downloading}>Videos</button>
      <button type="button" class:active={contentType === 'stories'} onclick={() => contentType = 'stories'} disabled={downloading || !isInstagram} title={isInstagram ? '' : 'Instagram only'}>Stories</button>
      <button type="button" class:active={contentType === 'highlights'} onclick={() => contentType = 'highlights'} disabled={downloading || !isInstagram} title={isInstagram ? '' : 'Instagram only'}>Highlights</button>
    </div>
  </div>

  <div class="form-group">
    <label for="cookies-file">Cookies File {(contentType === 'stories' || contentType === 'highlights') ? '(required)' : '(optional)'}</label>
      <div class="input-with-button">
        <input
          id="cookies-file"
          type="text"
          bind:value={cookiesFile}
          disabled={downloading}
        />
        <button class="browse-btn" onclick={browseCookiesFile} disabled={downloading}>Browse</button>
      </div>
    {#if needsCookiesWarning}
      <p class="field-warning">Stories and Highlights require a cookies file - Instagram blocks anonymous access.</p>
    {/if}
    {#if platformMismatch}
      <p class="field-warning">Stories and Highlights are only supported for Instagram.</p>
    {/if}
  </div>

  <div class="button-group">
    <button
      class="save-settings-btn"
      onclick={saveSettings}
      disabled={downloading}
    >
      Save Settings
    </button>
    {#if downloading}
      <button
        class="download-btn stop-btn"
        onclick={handleStop}
      >
        Stop Download
      </button>
    {:else}
      <button
        class="download-btn"
        onclick={startDownload}
        disabled={!getDownloadUrl() || !outputDir.trim() || needsCookiesWarning || platformMismatch}
      >
        Start Download
      </button>
    {/if}
  </div>

  {#if downloading || filesDownloaded > 0}
    <div class="progress-container">
      {#if downloading}
        <div class="progress-indeterminate">
          <div class="spinner"></div>
          <span class="progress-text">
            Downloading... {filesDownloaded} {filesDownloaded === 1 ? 'file' : 'files'} downloaded
          </span>
        </div>
      {:else}
        <div class="progress-complete">
          <span class="progress-text">
            ✅ Completed: {filesDownloaded} {filesDownloaded === 1 ? 'file' : 'files'} downloaded
          </span>
        </div>
      {/if}
    </div>
  {/if}

  {#if downloading && liveOutput.length > 0}
    <div class="live-output">
      <p class="output-label">Live Output:</p>
      <div class="output-text">
        {#each liveOutput as line, i}
          <div class="output-line">{line}</div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .download-manager {
    padding: 1rem;
    max-width: 800px;
  }

  .deps-check {
    padding: 0.75rem;
    margin-bottom: 1rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .deps-check.ok {
    background: rgba(120,113,108,0.15);
    color: #78716c;
    border: 1px solid rgba(120,113,108,0.3);
  }

  .deps-check.error {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .status-alert {
    padding: 1rem;
    margin-bottom: 1rem;
    border-radius: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    animation: slideIn 0.3s ease;
  }

  .status-alert.success {
    background: rgba(120,113,108,0.15);
    color: #78716c;
    border: 1px solid rgba(120,113,108,0.3);
  }

  .status-alert.error {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .close-alert {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    opacity: 0.7;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-alert:hover {
    opacity: 1;
  }

  .form-group {
    margin-bottom: 1.25rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: var(--text-primary);
    font-size: 0.875rem;
  }

  .form-group-label {
    display: block;
    font-size: 0.8125rem;
    font-weight: 500;
    margin-bottom: 0.375rem;
    color: var(--text-secondary);
  }

  .form-group input {
    width: 100%;
    padding: 0.625rem;
    background: var(--input-bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text-primary);
    font-size: 0.875rem;
    transition: border-color 0.2s;
  }

  .form-group input:focus {
    outline: none;
    border-color: var(--accent);
  }

  .input-with-button {
    display: flex;
    gap: 0.5rem;
  }

  .input-with-button input {
    flex: 1;
  }

  .browse-btn {
    padding: 0.625rem 1rem;
    background: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border);
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    white-space: nowrap;
    transition: all 0.2s;
  }

  .browse-btn:hover:not(:disabled) {
    background: var(--bg-tertiary);
  }

  .browse-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .form-group input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .field-warning {
    font-size: 0.75rem;
    color: #ef4444;
    margin-top: 0.375rem;
  }

  .profile-label {
    font-size: 0.8125rem;
    color: var(--text-secondary);
    margin: 0.75rem 0 0.5rem;
  }

  .profile-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .profile-button {
    padding: 0.5rem 0.75rem;
    background: var(--bg-tertiary);
    border: 1px solid var(--border);
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8125rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
  }

  .profile-button:hover:not(:disabled) {
    background: var(--bg-hover);
    border-color: var(--accent);
  }

  .profile-button.selected {
    background: rgba(120,113,108,0.15);
    border-color: #78716c;
    color: #78716c;
  }

  .profile-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .profile-name {
    font-weight: 500;
  }

  .profile-platform {
    font-size: 0.75rem;
    background: var(--bg-tertiary);
    padding: 2px 6px;
    border-radius: 3px;
    color: var(--text-secondary);
  }

  .checkmark {
    font-weight: bold;
  }

  .no-profiles {
    font-size: 0.8125rem;
    color: var(--text-secondary);
    font-style: italic;
  }

  .inline-link { background: none; border: none; padding: 0; color: var(--accent); font-size: 0.8125rem; cursor: pointer; text-decoration: underline; }
  .inline-link:hover { opacity: 0.8; }

  .segmented { display: inline-flex; border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
  .segmented button { border: none; border-radius: 0; background: transparent; color: var(--text-secondary); font-size: 0.8125rem; padding: 0.5rem 0.875rem; cursor: pointer; transition: all 0.2s; }
  .segmented button + button { border-left: 1px solid var(--border); }
  .segmented button.active { background: var(--bg-tertiary); color: var(--text-primary); font-weight: 600; }
  .segmented button:disabled { opacity: 0.4; cursor: not-allowed; }
  .segmented button:hover:not(:disabled):not(.active) { background: var(--bg-hover); }

  .button-group {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .save-settings-btn,
  .download-btn {
    flex: 1;
    padding: 0.875rem;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.9375rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .save-settings-btn {
    background: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border);
  }

  .save-settings-btn:hover:not(:disabled) {
    background: var(--bg-tertiary);
  }

  .download-btn {
    background: var(--accent);
    color: var(--accent-fg);
  }

  .download-btn:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .stop-btn {
    background: #ef4444;
    color: white;
  }

  .stop-btn:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .download-btn:disabled,
  .save-settings-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .progress-container {
    margin-top: 1.5rem;
  }

  .progress-indeterminate {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--bg-secondary);
    border-radius: 6px;
    border: 1px solid var(--border);
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 3px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .progress-complete {
    padding: 1rem;
    background: rgba(120,113,108,0.15);
    border-radius: 6px;
    border: 1px solid rgba(120,113,108,0.3);
  }

  .progress-text {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .live-output {
    margin-top: 1.5rem;
    padding: 1rem;
    background: var(--bg-secondary);
    border-radius: 6px;
    border: 1px solid var(--border);
  }

  .output-label {
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .output-text {
    font-family: 'Cascadia Mono', 'Courier New', monospace;
    font-size: 0.8125rem;
    color: var(--text-primary);
    max-height: 300px;
    overflow-y: auto;
    line-height: 1.5;
  }

  .output-line {
    padding: 2px 0;
    border-bottom: 1px solid var(--border);
    word-break: break-all;
  }

  .output-line:last-child {
    border-bottom: none;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
