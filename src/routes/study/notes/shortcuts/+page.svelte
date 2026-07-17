<script lang="ts">
  import { onMount } from "svelte";
  import { t } from "$lib/i18n";
  import PageHero from "$lib/study-components/PageHero.svelte";

  let isMac = $state(false);

  onMount(() => {
    if (typeof navigator !== "undefined") {
      isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || "");
    }
  });

  const meta = $derived(isMac ? "Cmd" : "Ctrl");

  type Row = { keys: string[]; desc: string };
  type Section = { title: string; rows: Row[] };

  let SECTIONS = $state<Section[]>([]);
  $effect(() => {
    SECTIONS = [
      {
        title: t("study.notes.shortcuts.section_editing"),
        rows: [
          { keys: ["Tab"], desc: t("study.notes.shortcuts.editing_indent_desc") },
          { keys: ["Shift+Tab"], desc: t("study.notes.shortcuts.editing_outdent_desc") },
          { keys: ["Alt+↑"], desc: t("study.notes.shortcuts.editing_move_up_desc") },
          { keys: ["Alt+↓"], desc: t("study.notes.shortcuts.editing_move_down_desc") },
          { keys: [`${meta}+Shift+K`], desc: t("study.notes.shortcuts.editing_delete_desc") },
          { keys: [`${meta}+/`], desc: t("study.notes.shortcuts.editing_collapse_desc") },
          { keys: [`${meta}+D`], desc: t("study.notes.shortcuts.editing_duplicate_desc") },
        ],
      },
      {
        title: t("study.notes.shortcuts.section_todo"),
        rows: [
          { keys: [`${meta}+Enter`], desc: t("study.notes.shortcuts.todo_cycle_desc") },
        ],
      },
      {
        title: t("study.notes.shortcuts.section_formatting"),
        rows: [
          { keys: [`${meta}+B`], desc: t("study.notes.shortcuts.format_bold_desc") },
          { keys: [`${meta}+I`], desc: t("study.notes.shortcuts.format_italic_desc") },
          { keys: [`${meta}+Shift+S`], desc: t("study.notes.shortcuts.format_strikethrough_desc") },
          { keys: [`${meta}+Shift+C`], desc: t("study.notes.shortcuts.format_code_desc") },
          { keys: [`${meta}+Shift+.`], desc: t("study.notes.shortcuts.format_blockquote_desc") },
        ],
      },
      {
        title: t("study.notes.shortcuts.section_slash"),
        rows: [
          { keys: ["/"], desc: t("study.notes.shortcuts.slash_menu_desc") },
          { keys: ["/todo /doing /done /later /now /waiting /canceled"], desc: t("study.notes.shortcuts.slash_status_desc") },
          { keys: ["/today"], desc: t("study.notes.shortcuts.slash_today_desc") },
          { keys: ["/date"], desc: t("study.notes.shortcuts.slash_date_desc") },
          { keys: ["/page /tag /block"], desc: t("study.notes.shortcuts.slash_link_desc") },
          { keys: ["/code"], desc: t("study.notes.shortcuts.slash_code_desc") },
          { keys: ["/query"], desc: t("study.notes.shortcuts.slash_query_desc") },
          { keys: ["/embed page", "/embed block"], desc: t("study.notes.shortcuts.slash_embed_desc") },
        ],
      },
      {
        title: t("study.notes.shortcuts.section_autocomplete"),
        rows: [
          { keys: ["[["], desc: t("study.notes.shortcuts.auto_page_desc") },
          { keys: ["#"], desc: t("study.notes.shortcuts.auto_tag_desc") },
          { keys: ["(("], desc: t("study.notes.shortcuts.auto_block_desc") },
        ],
      },
      {
        title: t("study.notes.shortcuts.section_history"),
        rows: [
          { keys: [`${meta}+Z`], desc: t("study.notes.shortcuts.history_undo_content_desc") },
          { keys: [`${meta}+Alt+Z`], desc: t("study.notes.shortcuts.history_undo_structural_desc") },
          { keys: [`${meta}+Shift+Z`, `${meta}+Y`], desc: t("study.notes.shortcuts.history_redo_desc") },
        ],
      },
      {
        title: t("study.notes.shortcuts.section_exit"),
        rows: [
          { keys: ["Esc"], desc: t("study.notes.shortcuts.exit_close_desc") },
        ],
      },
      {
        title: t("study.notes.shortcuts.section_markdown"),
        rows: [
          { keys: ["`> [!note]` `[!warn]` `[!info]` `[!success]` `[!tip]`"], desc: t("study.notes.shortcuts.md_callout_desc") },
          { keys: ["` ```lang `\\n`código`\\n` ``` `"], desc: t("study.notes.shortcuts.md_code_desc") },
          { keys: ["`$math$` ou `$$display$$`"], desc: t("study.notes.shortcuts.md_latex_desc") },
          { keys: ["`| col1 | col2 |`\\n`|---|---|`\\n`|...|...|`"], desc: t("study.notes.shortcuts.md_table_desc") },
          { keys: ["`{{query (...)}}` `:sort X :limit N :offset M`"], desc: t("study.notes.shortcuts.md_query_desc") },
        ],
      },
      {
        title: t("study.notes.shortcuts.section_search"),
        rows: [
          { keys: ["`tag:project`"], desc: t("study.notes.shortcuts.search_tag_desc") },
          { keys: ["`page:Daily`"], desc: t("study.notes.shortcuts.search_page_desc") },
          { keys: ["`status:DOING`"], desc: t("study.notes.shortcuts.search_status_desc") },
          { keys: ["`before:2026-05-01`", "`after:2026-04-01`"], desc: t("study.notes.shortcuts.search_date_desc") },
          { keys: ["`tag:\"two words\"`"], desc: t("study.notes.shortcuts.search_quotes_desc") },
        ],
      },
    ];
  });
</script>

<section class="shortcuts-page">
  <PageHero
    title={$t("study.notes.shortcuts.page_title")}
    subtitle={$t("study.notes.shortcuts.subtitle", { os: isMac ? "Mac" : "Windows/Linux", meta })}
  />

  <p class="muted small">
    {$t("study.notes.shortcuts.page_hint", { path: "/study/notes" })}
  </p>

  {#each SECTIONS as section (section.title)}
    <section class="sec">
      <h2>{section.title}</h2>
      <table class="sc-table">
        <tbody>
          {#each section.rows as row (row.desc)}
            <tr>
              <td class="keys-cell">
                {#each row.keys as k, i (i)}
                  {#if i > 0} {$t("study.notes.shortcuts.or")} {/if}
                  {#each k.split("+") as part, j (j)}
                    {#if j > 0}<span class="plus">+</span>{/if}
                    <kbd>{part}</kbd>
                  {/each}
                {/each}
              </td>
              <td class="desc-cell">{row.desc}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>
  {/each}
</section>

<style>
  .shortcuts-page {
    display: flex;
    flex-direction: column;
    gap: calc(var(--padding) * 1.25);
    width: 100%;
    max-width: 880px;
    margin-inline: auto;
  }
  .muted {
    color: var(--tertiary);
  }
  .small {
    font-size: 12px;
  }
  .sec {
    background: var(--surface);
    border: 1px solid color-mix(in oklab, var(--input-border) 60%, transparent);
    border-radius: var(--border-radius);
    padding: calc(var(--padding) * 0.9);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .sec h2 {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--accent);
  }
  .sc-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  .sc-table td {
    padding: 6px 8px;
    border-bottom: 1px solid color-mix(in oklab, var(--input-border) 40%, transparent);
    vertical-align: top;
  }
  .sc-table tr:last-child td {
    border-bottom: 0;
  }
  .keys-cell {
    width: 35%;
    white-space: nowrap;
  }
  .desc-cell {
    color: var(--secondary);
  }
  kbd {
    display: inline-block;
    padding: 2px 6px;
    background: var(--bg);
    border: 1px solid var(--input-border);
    border-bottom-width: 2px;
    border-radius: 4px;
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 11px;
    color: var(--text);
    line-height: 1;
  }
  .plus {
    margin: 0 2px;
    color: var(--tertiary);
    font-size: 11px;
  }
  code {
    padding: 1px 4px;
    background: color-mix(in oklab, var(--accent) 8%, transparent);
    border-radius: 3px;
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 11px;
  }
</style>
