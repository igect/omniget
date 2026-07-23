<script lang="ts">
  import ProfileManager from '$lib/components/openmint/ProfileManager.svelte';
  import DownloadManager from '$lib/components/openmint/DownloadManager.svelte';
  
  let activeTab = $state('download');
</script>

<svelte:head>
  <title>OpenMint - Social Media Downloader</title>
</svelte:head>

<div class="openmint-page">
  <header class="page-header">
    <h1>OpenMint</h1>
    <p class="subtitle">Social Media Downloader</p>
  </header>

  <div class="tabs">
    <button
      class:active={activeTab === 'download'}
      onclick={() => activeTab = 'download'}
    >
      Download
    </button>
    <button
      class:active={activeTab === 'profiles'}
      onclick={() => activeTab = 'profiles'}
    >
      Profiles
    </button>
  </div>

  <div class="content">
    {#if activeTab === 'download'}
      <DownloadManager on:switchToProfiles={() => activeTab = 'profiles'} />
    {:else}
      <ProfileManager />
    {/if}
  </div>
</div>

<style>
  .openmint-page {
    padding: 2rem;
    max-width: 900px;
    margin: 0 auto;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .page-header h1 {
    font-size: 2rem;
    margin: 0;
  }

  .subtitle {
    color: var(--text-secondary);
    margin: 0.5rem 0 0;
  }

  .tabs {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    border-bottom: 1px solid var(--border);
  }

  .tabs button {
    padding: 0.75rem 1.5rem;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .tabs button.active {
    color: var(--text-primary);
    border-bottom-color: var(--accent);
  }

  .content {
    background: var(--bg-secondary);
    border-radius: 8px;
    padding: 1.5rem;
  }
</style>
