<script lang="ts">
  import { t } from "$lib/i18n";
  import { tabsStore } from "$lib/study-notes/tabs-store.svelte";
  import { type Snippet } from "svelte";

  type Props = {
    wndId: number;
    activeContent?: Snippet<[]>;
  };

  let { wndId, activeContent }: Props = $props();

  const isActiveWnd = $derived(tabsStore.activeWndId === wndId);
  const tabs = $derived(tabsStore.sortedTabsForWnd(wndId));
  const activeTabId = $derived(tabsStore.activeTabIdByWnd[wndId] ?? null);
  const activeTab = $derived(tabs.find((t) => t.id === activeTabId) ?? null);

  function focusThisWnd() {
    tabsStore.setActiveWnd(wndId);
  }
</script>

<div class="nb-workspace" class:active={isActiveWnd}>
  {#if isActiveWnd && activeContent}
    {@render activeContent()}
  {:else if activeTab}
    <div class="placeholder">
      <div class="ph-title">{activeTab.page_title || activeTab.page_name || activeTab.view_kind}</div>
      <div class="ph-hint">
        {#if activeTab.view_kind === "editor"}
          {t("study.notes.shell.workspace_editor_hint")}
        {:else}
          {t("study.notes.shell.workspace_view_hint")}
        {/if}
      </div>
      <button class="focus-btn" type="button" onclick={focusThisWnd}>
        {t("study.notes.shell.workspace_focus_split")}
      </button>
    </div>
  {:else}
    <div class="placeholder">
      <div class="ph-title">{t("study.notes.shell.no_tabs")}</div>
      <div class="ph-hint">{t("study.notes.shell.no_tabs_hint")}</div>
    </div>
  {/if}
</div>

<style>
  .nb-workspace {
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .placeholder {
    margin: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 32px;
    text-align: center;
  }
  .ph-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text);
  }
  .ph-hint {
    font-size: 12px;
    color: var(--tertiary, var(--muted-fg));
    max-width: 320px;
    line-height: 1.5;
  }
  .focus-btn {
    padding: 6px 14px;
    background: color-mix(in oklab, var(--accent) 15%, transparent);
    border: 1px solid color-mix(in oklab, var(--accent) 40%, transparent);
    border-radius: 4px;
    color: var(--accent);
    font-size: 12px;
    cursor: pointer;
    transition: background 120ms ease;
  }
  .focus-btn:hover {
    background: color-mix(in oklab, var(--accent) 25%, transparent);
  }
</style>
