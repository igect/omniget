<script lang="ts">
  import { runGalleryDlDownload, checkPythonDependencies } from '$lib/api/openmint';
  
  let url = $state('');
  let outputDir = $state('');
  let contentType = $state('all');
  let cookiesFile = $state('');
  let downloading = $state(false);
  let progress = $state(0);
  let status = $state('');
  let depsStatus = $state('');

  async function checkDeps() {
    try {
      depsStatus = await checkPythonDependencies();
    } catch (error) {
      depsStatus = `Error: ${error}`;
    }
  }

  async function startDownload() {
    if (!url.trim() || !outputDir.trim()) return;

    downloading = true;
    progress = 0;
    status = 'Starting download...';

    try {
      const result = await runGalleryDlDownload(
        url,
        outputDir,
        cookiesFile || null,
        contentType
      );

      if (result.success) {
        status = `✅ Downloaded ${result.files_count} files successfully!`;
        progress = 100;
      } else {
        status = `❌ ${result.message}`;
      }
    } catch (error) {
      status = `❌ Download failed: ${error}`;
    }

    downloading = false;
  }

  $effect(() => {
    checkDeps();
  });
</script>

<div class="download-manager">
  <div
    class="deps-check"
    class:ok={depsStatus.includes('OK')}
    class:error={depsStatus && !depsStatus.includes('OK')}
  >
    <span>
      {depsStatus || 'Checking dependencies...'}
    </span>
  </div>

  <div class="form-group">
    <label>Profile URL</label>
    <input
      type="text"
      bind:value={url}
      placeholder="https://instagram.com/username"
    />
  </div>

  <div class="form-group">
    <label>Output Directory</label>
    <input
      type="text"
      bind:value={outputDir}
      placeholder="E:\Downloads"
    />
  </div>

  <div class="form-group">
    <label>Content Type</label>
    <select bind:value={contentType}>
      <option value="all">All Content</option>
      <option value="photos">Photos Only</option>
      <option value="videos">Videos Only</option>
      <option value="stories">Stories</option>
      <option value="highlights">Highlights</option>
    </select>
  </div>

  <div class="form-group">
    <label>Cookies File (optional)</label>
    <input
      type="text"
      bind:value={cookiesFile}
      placeholder="E:\Downloads\instagram.com_cookies.txt"
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
    <div class="progress-bar">
      <div class="progress-fill" style="width: {progress}%"></div>
    </div>
  {/if}

  {#if status}
    <div class="status">{status}</div>
  {/if}
</div>

<style>
  .download-manager {
    padding: 1rem;
    max-width: 600px;
  }

  .deps-check {
    padding: 0.5rem;
    margin-bottom: 1rem;
    border-radius: 4px;
    font-size: 0.875rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
  }

  .deps-check.ok {
    background: rgba(34, 197, 94, 0.1);
    color: #22c55e;
    border-color: rgba(34, 197, 94, 0.2);
  }

  .deps-check.error {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.2);
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .form-group input,
  .form-group select {
    width: 100%;
    padding: 0.5rem;
    background: var(--input-bg);
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text-primary);
  }

  .download-btn {
    width: 100%;
    padding: 0.75rem;
    background: var(--accent);
    color: var(--accent-fg);
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
  }

  .download-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    background: var(--bg-secondary);
    border-radius: 4px;
    margin-top: 1rem;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--accent);
    transition: width 0.3s ease;
  }

  .status {
    margin-top: 1rem;
    padding: 0.75rem;
    border-radius: 4px;
    background: var(--bg-secondary);
  }
</style>
