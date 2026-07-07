<script lang="ts">
  import {
    checkPythonDependencies,
    saveAppSettings,
    loadAppSettings,
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
    reattachIfActive,
  } from '$lib/stores/openmint-download-store.svelte';
  import { createEventDispatcher, onMount } from 'svelte';

  const dispatch = createEventDispatcher();

  let url = $state('');
  let outputDir = $state('');
  let contentType = $state('all');
  let cookiesFile = $state('');
  let depsStatus = $state('');

  let downloading = $derived(isActive());
  let filesDownloaded = $derived(getFilesDownloaded());
  let liveOutput = $derived(getLiveOutput());
  let status = $derived(getStatus());
  let statusType = $derived(getStatusType());

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
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  });

  async function checkDeps() {
    try {
      depsStatus = await checkPythonDependencies();
    } catch (error) {
      depsStatus = `Error: ${error}`;
    }
  }

  async function startDownload() {
    if (!url.trim() || !outputDir.trim()) {
      return;
    }

    const startedUrl = url;
    const startedContentType = contentType;

    try {
      await startStoreDownload(url, outputDir, cookiesFile, contentType);
    } catch (error) {
      console.error('Failed to start download:', error);
      return;
    }

    if (getStatusType() === 'success') {
      dispatch('downloadComplete', {
        url: startedUrl,
        platform: startedContentType,
        filesCount: getLastFilesCount()
      });
    }
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

  $effect(() => {
    checkDeps();
  });
</script>

<div class="download-manager">
  <div class="deps-check">
    <span class:ok={depsStatus.includes('OK')} class:error={!depsStatus.includes('OK')}>
      {depsStatus || 'Checking dependencies...'}
    </span>
  </div>

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
    />
  </div>

  <div class="form-group">
    <label for="output-dir">Output Directory</label>
    <div class="input-with-button">
      <input
        id="output-dir"
        type="text"
        bind:value={outputDir}
        placeholder="E:\Downloads"
        disabled={downloading}
      />
    </div>
  </div>

  <div class="form-group">
    <label for="content-type">Content Type</label>
    <select id="content-type" bind:value={contentType} disabled={downloading}>
      <option value="all">All Content</option>
      <option value="photos">Photos Only</option>
      <option value="videos">Videos Only</option>
      <option value="stories">Stories</option>
      <option value="highlights">Highlights</option>
    </select>
  </div>

  <div class="form-group">
    <label for="cookies-file">Cookies File (optional)</label>
    <div class="input-with-button">
      <input
        id="cookies-file"
        type="text"
        bind:value={cookiesFile}
        placeholder="E:\Downloads\instagram.com_cookies.txt"
        disabled={downloading}
      />
    </div>
  </div>

  <div class="button-group">
    <button
      class="save-settings-btn"
      onclick={saveSettings}
      disabled={downloading}
    >
      Save Settings
    </button>
    <button
      class="download-btn"
      onclick={startDownload}
      disabled={downloading || !url.trim() || !outputDir.trim()}
    >
      {downloading ? 'Downloading...' : 'Start Download'}
    </button>
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
    max-width: 600px;
  }

  .deps-check {
    padding: 0.75rem;
    margin-bottom: 1rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .deps-check.ok {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
    border: 1px solid rgba(34, 197, 94, 0.3);
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
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
    border: 1px solid rgba(34, 197, 94, 0.3);
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

  .form-group input,
  .form-group select {
    width: 100%;
    padding: 0.625rem;
    background: var(--input-bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text-primary);
    font-size: 0.875rem;
    transition: border-color 0.2s;
  }

  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: var(--accent);
  }

  .form-group input:disabled,
  .form-group select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

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
    background: rgba(34, 197, 94, 0.15);
    border-radius: 6px;
    border: 1px solid rgba(34, 197, 94, 0.3);
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
    font-family: 'Courier New', monospace;
    font-size: 0.8125rem;
    color: var(--text-primary);
    max-height: 200px;
    overflow-y: auto;
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
