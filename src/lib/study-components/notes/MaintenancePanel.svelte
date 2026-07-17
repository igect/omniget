<script lang="ts">
  import { t } from "$lib/i18n";
  import {
    notesSearchRebuild,
    notesRefsRebuildAll,
    notesQueryInvalidateCache,
    notesExportGraphJson,
    notesMarkdownImport,
  } from "$lib/notes-bridge";
  import OpLogViewer from "./OpLogViewer.svelte";

  type Props = {
    onToast: (kind: "ok" | "err", msg: string) => void;
  };

  let { onToast }: Props = $props();

  let busy = $state<string | null>(null);
  let importPreview = $state<{ name: string; markdown: string; lines: number } | null>(null);
  let importing = $state(false);
  let fileInput = $state<HTMLInputElement | null>(null);

  async function rebuildSearch() {
    busy = "search";
    try {
      const r = await notesSearchRebuild();
      onToast("ok", t("study.notes.maintenance_search_done", { indexed: r.indexed }));
    } catch (e) {
      onToast("err", e instanceof Error ? e.message : String(e));
    } finally {
      busy = null;
    }
  }

  async function rebuildRefs() {
    busy = "refs";
    try {
      const r = await notesRefsRebuildAll();
      onToast("ok", t("study.notes.maintenance_refs_done", { refs: r.total_refs }));
    } catch (e) {
      onToast("err", e instanceof Error ? e.message : String(e));
    } finally {
      busy = null;
    }
  }

  async function clearQueryCache() {
    busy = "qcache";
    try {
      const r = await notesQueryInvalidateCache();
      onToast("ok", t("study.notes.maintenance_cache_done", { size: r.size_after }));
    } catch (e) {
      onToast("err", e instanceof Error ? e.message : String(e));
    } finally {
      busy = null;
    }
  }

  async function exportGraph() {
    busy = "graph";
    try {
      const r = await notesExportGraphJson();
      const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const blob = new Blob([r.json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `notes-graph-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      onToast("ok", t("study.notes.maintenance_graph_exported"));
    } catch (e) {
      onToast("err", e instanceof Error ? e.message : String(e));
    } finally {
      busy = null;
    }
  }

  function pickImport() {
    fileInput?.click();
  }

  async function onFileChosen(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const baseName = file.name.replace(/\.(md|markdown|txt)$/i, "");
      importPreview = {
        name: baseName,
        markdown: text,
        lines: text.split("\n").length,
      };
    } catch (err) {
      onToast("err", err instanceof Error ? err.message : String(err));
    } finally {
      target.value = "";
    }
  }

  function cancelImport() {
    importPreview = null;
  }

  async function confirmImport() {
    if (!importPreview) return;
    importing = true;
    try {
      const r = await notesMarkdownImport({
        name: importPreview.name,
        markdown: importPreview.markdown,
      });
      onToast("ok", t("study.notes.maintenance_import_done", { blocks: r.blocks_created, name: importPreview.name }));
      importPreview = null;
    } catch (e) {
      onToast("err", e instanceof Error ? e.message : String(e));
    } finally {
      importing = false;
    }
  }
</script>

<article class="card">
  <h3>{t("study.notes.maintenance_title")}</h3>
  <p class="hint">{t("study.notes.maintenance_hint")}</p>

  <div class="actions-grid">
    <button
      type="button"
      class="btn"
      onclick={rebuildSearch}
      disabled={busy !== null}
      title={t("study.notes.maintenance_search_title")}
    >
      {busy === "search" ? t("study.notes.maintenance_reindexing") : t("study.notes.maintenance_rebuild_search")}
    </button>
    <button
      type="button"
      class="btn"
      onclick={rebuildRefs}
      disabled={busy !== null}
      title={t("study.notes.maintenance_refs_title")}
    >
      {busy === "refs" ? t("study.notes.maintenance_calculating") : t("study.notes.maintenance_rebuild_refs")}
    </button>
    <button
      type="button"
      class="btn"
      onclick={clearQueryCache}
      disabled={busy !== null}
      title={t("study.notes.maintenance_cache_title")}
    >
      {busy === "qcache" ? t("study.notes.maintenance_cleaning") : t("study.notes.maintenance_clear_cache")}
    </button>
    <button
      type="button"
      class="btn"
      onclick={exportGraph}
      disabled={busy !== null}
      title={t("study.notes.maintenance_graph_title")}
    >
      {busy === "graph" ? t("study.notes.maintenance_exporting") : t("study.notes.maintenance_export_graph")}
    </button>
    <button
      type="button"
      class="btn"
      onclick={pickImport}
      disabled={busy !== null || importing}
      title={t("study.notes.maintenance_import_btn_title")}
    >
      {t("study.notes.maintenance_import_md")}
    </button>
    <input
      type="file"
      accept=".md,.markdown,.txt,text/markdown,text/plain"
      bind:this={fileInput}
      onchange={onFileChosen}
      style:display="none"
    />
  </div>

  <OpLogViewer {onToast} />
</article>

{#if importPreview}
  <div
    class="modal-bg"
    role="presentation"
    onclick={(e) => {
      if (e.target === e.currentTarget) cancelImport();
    }}
  >
    <div class="modal" role="dialog" aria-label={t("study.notes.maintenance_import_dialog_aria")} aria-modal="true">
      <h3>{t("study.notes.maintenance_import_title")}</h3>
      <p class="meta">
        <strong>{importPreview.name}</strong>
        <span class="muted">· {importPreview.lines} linhas</span>
      </p>
      <p class="hint">{t("study.notes.maintenance_import_hint", { name: importPreview.name })}</p>

      <p class="warn-soft">{t("study.notes.maintenance_import_warn")}</p>

      <footer class="foot">
        <span class="spacer"></span>
        <button
          type="button"
          class="btn ghost"
          onclick={cancelImport}
          disabled={importing}
        >
          {t("study.notes.cancel")}
        </button>
        <button
          type="button"
          class="btn primary"
          onclick={confirmImport}
          disabled={importing}
        >
          {importing ? t("study.notes.maintenance_import_importing") : t("study.notes.maintenance_import_confirm")}
        </button>
      </footer>
    </div>
  </div>
{/if}

<style>
  .card {
    padding: 14px 16px;
    background: var(--surface);
    border: 1px solid color-mix(in oklab, var(--input-border) 60%, transparent);
    border-radius: var(--border-radius);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .card h3 {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--secondary);
  }
  .hint {
    margin: 0;
    color: var(--tertiary);
    font-size: 12px;
    line-height: 1.5;
  }
  .actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 8px;
  }
  .btn {
    padding: 8px 12px;
    border-radius: var(--border-radius);
    border: 1px solid var(--input-border);
    background: var(--bg);
    color: var(--text);
    font: inherit;
    font-size: 12px;
    cursor: pointer;
    text-align: left;
    transition: background 120ms ease, border-color 120ms ease;
  }
  .btn:hover:not(:disabled) {
    background: color-mix(in oklab, var(--accent) 8%, transparent);
    border-color: color-mix(in oklab, var(--accent) 40%, var(--input-border));
  }
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .btn.primary {
    background: var(--accent);
    color: var(--on-accent, var(--on-cta, white));
    border-color: var(--accent);
  }
  .btn.ghost {
    background: transparent;
  }
  .modal-bg {
    position: fixed;
    inset: 0;
    z-index: 95;
    background: color-mix(in oklab, black 50%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .modal {
    width: min(480px, calc(100vw - 48px));
    background: var(--surface);
    border: 1px solid var(--input-border);
    border-radius: var(--border-radius);
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .modal h3 {
    margin: 0;
    font-size: 15px;
  }
  .meta {
    margin: 0;
    font-size: 13px;
  }
  .muted {
    color: var(--tertiary);
    font-size: 11px;
    margin-left: 4px;
  }
  .warn-soft {
    margin: 0;
    padding: 8px 10px;
    background: color-mix(in oklab, var(--warning, #f59e0b) 12%, transparent);
    border-radius: var(--border-radius);
    color: var(--warning, #f59e0b);
    font-size: 12px;
  }
  code {
    padding: 1px 5px;
    background: var(--bg);
    border-radius: 3px;
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 11px;
  }
  .foot {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
  }
  .spacer {
    flex: 1 1 auto;
  }
</style>
