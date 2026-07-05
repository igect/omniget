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

  async function loadPlatformProfiles() {
    loading = true;
    error = '';
    try {
      profiles = await loadProfiles(activePlatform);
    } catch (err) {
      error = 'Failed to load profiles';
      console.error(err);
    }
    loading = false;
  }

  async function addProfile() {
    if (!newUrl.trim()) {
      error = 'Please enter a URL or username';
      return;
    }
    
    error = '';
    try {
      await saveProfile(activePlatform, newUrl);
      newUrl = '';
      await loadPlatformProfiles();
    } catch (err) {
      error = 'Failed to add profile';
      console.error(err);
    }
  }

  async function removeProfile(index: number) {
    if (!confirm('Delete this profile?')) return;
    
    try {
      await deleteProfile(activePlatform, index);
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
          <button class="delete-btn" onclick={() => removeProfile(index)}>
            Delete
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

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
</style>
