<script lang="ts">
  import { 
    runGalleryDlDownload, 
    checkPythonDependencies, 
    listenToDownloadProgress,
    generateDownloadId,
    type DownloadProgress 
  } from '$lib/api/openmint';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  let url = $state('');
  let outputDir = $state('');
  let contentType = $state('all');
  let cookiesFile = $state('');
  let downloading = $state(false);
  let progress = $state(0);
  let status = $state('');
  let statusType = $state<'success' | 'error' | 'info'>('info');
  let depsStatus = $state('');
  let currentDownloadId = $state<string | null>(null);
  let unlistenProgress: (() => void) | null = null;

  async function checkDeps() {
    try {
      depsStatus = await checkPythonDependencies();
    } catch (error) {
      depsStatus = `Error: ${error}`;
    }
  }

  async function startDownload() {
    if (!url.trim() || !outputDir.trim()) {
      status = 'Please fill in all required fields';
      statusType = 'error';
      return;
    }

    downloading = true;
    progress = 0;
    status = 'Starting download...';
    statusType = 'info';
    
    const downloadId = generateDownloadId();
    currentDownloadId = downloadId;

    try {
      // Listen for progress updates
      unlistenProgress = await listenToDownloadProgress(downloadId, (progressData: DownloadProgress) => {
        status = progressData.message;
        if (progressData.files_downloaded > 0) {
          progress = Math.min((progressData.files_downloaded / 100) * 100, 100);
        }
      });

      const result = await runGalleryDlDownload(
        url,
        outputDir,
        cookiesFile || null,
        contentType,
        downloadId
      );

      if (result.success) {
        status = `✅ Downloaded ${result.files_count || 0} files successfully!`;
        statusType = 'success';
        progress = 100;
        
        // Notify parent component
        dispatch('downloadComplete', {
          url,
          platform: contentType,
          filesCount: result.files_count || 0
        });
      } else {
        status = `❌ ${result.message}`;
        statusType = 'error';
      }
    } catch (error) {
      status = `❌ Download failed: ${error}`;
      statusType = 'error';
    } finally {
      downloading = false;
      if (unlistenProgress) {
        unlistenProgress();
        unlistenProgress = null;
      }
      currentDownloadId = null;
    }
  }

  function clearStatus() {
    status = '';
    statusType = 'info';
  }

  $effect(() => {
    checkDeps();
  });
</script>

<div class="download-manager">
  <div class="deps-check" class:ok={depsStatus.includes('OK')} class:error={depsStatus && !depsStatus.includes('OK')}>
    <span>{depsStatus || 'Checking dependencies...'}</span>
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
    <input
      id="output-dir"
      type="text"
      bind:value={outputDir}
      placeholder="E:\Downloads"
      disabled={downloading}
    />
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
    <input
      id="cookies-file"
      type="text"
      bind:value={cookiesFile}
      placeholder="E:\Downloads\instagram.com_cookies.txt"
      disabled={downloading}
    />
  </div>

  <button
    class="download-btn"
    onclick={startDownload}
    disabled={downloading || !url.trim() || !outputDir.trim()}
  >
    {downloading ? 'Downloading...' : 'Start Download'}
  </button>

  {#if downloading || progress > 0}
    <div class="progress-container">
      <div class="progress-bar">
        <div class="progress-fill" style="width: {progress}%"></div>
      </div>
      <div class="progress-text">{Math.round(progress)}%</div>
    </div>
  {/if}

  {#if downloading}
    <div class="live-output">
      <p class="output-label">Live Output:</p>
      <div class="output-text">{status}</div>
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
    background: var(--bg-secondary);
    border: 1px solid var(--border);
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

  .download-btn {
    width: 100%;
    padding: 0.875rem;
    background: var(--accent);
    color: var(--accent-fg);
    border: none;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.9375rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .download-btn:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .download-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .progress-container {
    margin-top: 1.5rem;
  }

  .progress-bar {
    width: 100%;
    height: 10px;
    background: var(--bg-secondary);
    border-radius: 5px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent), var(--accent-light));
    transition: width 0.3s ease;
  }

  .progress-text {
    text-align: center;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-secondary);
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
    word-break: break-all;
    max-height: 150px;
    overflow-y: auto;
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
</style>
