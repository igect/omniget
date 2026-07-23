<script lang="ts">
  import { loadProfiles, saveProfile, deleteProfile } from '$lib/api/openmint';
  
  type Profile = {
    url: string;
    username?: string;
    platform: string;
  };

  const platforms = [
    { key: 'instagram', label: 'Instagram' },
    { key: 'tiktok', label: 'TikTok' },
    { key: 'facebook', label: 'Facebook' },
    { key: 'x', label: 'X' }
  ];
  
  let activePlatform = $state('instagram');
  let profiles = $state<Profile[]>([]);
  let newUrl = $state('');
  let loading = $state(false);
  let error = $state('');

  // Monotonic counter to guard against out-of-order async responses. Without
  // this, switching platform tabs (or an add-then-switch) while a previous
  // load/save was still in flight could let a stale response land last and
  // silently overwrite the list with the wrong platform's data - looking
  // like a newly-added profile had vanished, when it was actually saved
  // fine and you were just looking at a stale render of a different tab.
  let requestId = 0;

  async function loadPlatformProfiles() {
    const platform = activePlatform;
    const thisRequest = ++requestId;

    loading = true;
    error = '';
    try {
      const result = await loadProfiles(platform);
      if (thisRequest !== requestId) return; // a newer request already won
      profiles = result;
    } catch (err) {
      if (thisRequest !== requestId) return;
      error = 'Failed to load profiles';
      console.error(err);
    } finally {
      if (thisRequest === requestId) {
        loading = false;
      }
    }
  }

  function errorMessage(err: unknown, fallback: string): string {
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.message;
    return fallback;
  }

  async function addProfile() {
    // Trim once and use the trimmed value everywhere - previously the
    // validation check trimmed but the value actually sent to the backend
    // did not, so pasted whitespace/newlines got stored as-is.
    const trimmedUrl = newUrl.trim();

    if (!trimmedUrl) {
      error = 'Please enter a URL or username';
      return;
    }

    error = '';
    try {
      await saveProfile(activePlatform, trimmedUrl);
      newUrl = '';
      await loadPlatformProfiles();
    } catch (err) {
      // Surface the real reason (e.g. "Profile already exists") instead of
      // a generic message that made every failure look like a mystery.
      error = errorMessage(err, 'Failed to add profile');
      console.error(err);
    }
  }

  let confirmDeleteUrl = $state<string | null>(null);

  function promptDelete(url: string) {
    confirmDeleteUrl = url;
  }

  function cancelDelete() {
    confirmDeleteUrl = null;
  }

  async function confirmDelete() {
    const url = confirmDeleteUrl;
    confirmDeleteUrl = null;
    if (!url) return;

    try {
      await deleteProfile(activePlatform, url);
      await loadPlatformProfiles();
    } catch (err) {
      console.error('Failed to delete profile:', err);
    }
  }

  $effect(() => {
    loadPlatformProfiles();
  });
</script>

<div class="profile-manager">
  <div class="platform-tabs">
    {#each platforms as platform}
      <button
        class:active={activePlatform === platform.key}
        onclick={() => activePlatform = platform.key}
      >
        {platform.label}
      </button>
    {/each}
  </div>

  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  <div class="add-profile">
    <input
      type="text"
      bind:value={newUrl}
      placeholder="Enter profile URL or username"
      onkeydown={(e) => e.key === 'Enter' && addProfile()}
    />
    <button onclick={addProfile} disabled={!newUrl.trim() || loading}>
      Add Profile
    </button>
  </div>

  {#if loading}
    <p class="loading">Loading profiles...</p>
  {:else if profiles.length === 0}
    <p class="empty">No profiles added yet</p>
  {:else}
    <ul class="profiles-list">
      {#each profiles as profile, index}
        <li class="profile-item">
          <div class="profile-info">
            <span class="profile-url">{profile.url}</span>
            {#if profile.username}
              <span class="profile-username">@{profile.username}</span>
            {/if}
          </div>
          <button class="delete-btn" onclick={() => promptDelete(profile.url)}>
            Delete
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

{#if confirmDeleteUrl}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="confirm-overlay" onclick={cancelDelete}>
    <div class="confirm-dialog" onclick={(e) => e.stopPropagation()}>
      <p>Delete this profile?</p>
      <p class="confirm-url">{confirmDeleteUrl}</p>
      <div class="confirm-actions">
        <button class="confirm-no" onclick={cancelDelete}>Cancel</button>
        <button class="confirm-yes" onclick={confirmDelete}>Yes, Delete</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .profile-manager {
    padding: 1rem;
    max-width: 800px;
  }

  .platform-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    border-bottom: 2px solid var(--border);
  }

  .platform-tabs button {
    padding: 0.75rem 1.5rem;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    cursor: pointer;
    color: var(--text-secondary);
    font-weight: 500;
    font-size: 0.9375rem;
    transition: all 0.2s;
  }

  .platform-tabs button.active {
    color: var(--text-primary);
    border-bottom-color: var(--accent);
  }

  .platform-tabs button:hover:not(.active) {
    color: var(--text-primary);
  }

  .error-message {
    padding: 0.75rem;
    margin-bottom: 1rem;
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 6px;
  }

  .add-profile {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .add-profile input {
    flex: 1;
    padding: 0.75rem;
    background: var(--input-bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text-primary);
    font-size: 0.9375rem;
  }

  .add-profile input:focus {
    outline: none;
    border-color: var(--accent);
  }

  .add-profile button {
    padding: 0.75rem 1.5rem;
    background: var(--accent);
    color: var(--accent-fg);
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .add-profile button:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .add-profile button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .profiles-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .profile-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    margin-bottom: 0.75rem;
    background: var(--bg-secondary);
    transition: all 0.2s;
  }

  .profile-item:hover {
    border-color: var(--accent);
    transform: translateX(2px);
  }

  .profile-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
  }

  .profile-url {
    font-weight: 600;
    color: var(--text-primary);
  }

  .profile-username {
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .delete-btn {
    padding: 0.5rem 1rem;
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
  }

  .delete-btn:hover {
    background: rgba(239, 68, 68, 0.25);
  }

  .loading, .empty {
    text-align: center;
    color: var(--text-secondary);
    padding: 3rem;
    font-size: 1rem;
  }

  .confirm-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .confirm-dialog {
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1.5rem;
    max-width: 400px;
    width: 90%;
    text-align: center;
  }

  .confirm-dialog p {
    margin: 0 0 0.5rem;
    color: var(--text-primary);
  }

  .confirm-url {
    font-weight: 600;
    word-break: break-all;
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 1.25rem;
  }

  .confirm-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
  }

  .confirm-actions button {
    padding: 0.625rem 1.25rem;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .confirm-no {
    background: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border);
  }

  .confirm-yes {
    background: #ef4444;
    color: white;
  }

  .confirm-yes:hover {
    opacity: 0.9;
  }
</style>
