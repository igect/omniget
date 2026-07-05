<script lang="ts">
  import { loadProfiles, saveProfile, deleteProfile } from '$lib/api/openmint';
  
  type Profile = {
    url: string;
    username?: string;
    platform: string;
  };

  let platforms = ['instagram', 'tiktok', 'facebook', 'x'];
  let activePlatform = $state('instagram');
  let profiles = $state<Profile[]>([]);
  let newUrl = $state('');
  let loading = $state(false);

  async function loadPlatformProfiles() {
    loading = true;
    try {
      profiles = await loadProfiles(activePlatform);
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }
    loading = false;
  }

  async function addProfile() {
    if (!newUrl.trim()) return;
    
    try {
      await saveProfile(activePlatform, newUrl);
      newUrl = '';
      await loadPlatformProfiles();
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to add profile');
    }
  }

  async function removeProfile(index: number) {
    if (!confirm('Delete this profile?')) return;
    
    try {
      await deleteProfile(activePlatform, index);
      await loadPlatformProfiles();
    } catch (error) {
      console.error('Failed to delete profile:', error);
    }
  }

  $effect(() => {
    loadPlatformProfiles();
  });
</script>

<div class="profile-manager">
  <div class="tabs">
    {#each platforms as platform}
      <button
        class:active={activePlatform === platform}
        onclick={() => activePlatform = platform}
      >
        {platform}
      </button>
    {/each}
  </div>

  <div class="add-profile">
    <input
      type="text"
      bind:value={newUrl}
      placeholder="Enter profile URL or username"
      onkeydown={(e) => e.key === 'Enter' && addProfile()}
    />
    <button onclick={addProfile} disabled={!newUrl.trim()}>
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
  }

  .tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid var(--border);
  }

  .tabs button {
    padding: 0.5rem 1rem;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    color: var(--text-secondary);
  }

  .tabs button.active {
    color: var(--text-primary);
    border-bottom-color: var(--accent);
  }

  .add-profile {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .add-profile input {
    flex: 1;
    padding: 0.5rem;
    background: var(--input-bg);
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text-primary);
  }

  .add-profile button {
    padding: 0.5rem 1rem;
    background: var(--accent);
    color: var(--accent-fg);
    border: none;
    border-radius: 4px;
    cursor: pointer;
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
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 4px;
    margin-bottom: 0.5rem;
  }

  .profile-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .profile-url {
    font-weight: 500;
  }

  .profile-username {
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .delete-btn {
    padding: 0.25rem 0.75rem;
    background: var(--danger);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .loading, .empty {
    text-align: center;
    color: var(--text-secondary);
    padding: 2rem;
  }
</style>
