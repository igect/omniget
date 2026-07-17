## Project: OmniGet — i18n Conversion

### Anki (`src/routes/study/anki/`)
Hardcoded PT → `$t()`/`t()` with `study.anki.*` keys.

| File | Status |
|------|--------|
| `en.json` (study.anki block) | ✅ Inserted |
| `+layout.svelte` | ✅ Already uses $t() |
| `_StubPage.svelte` | ✅ Converted |
| `+page.svelte` (dashboard) | ✅ Converted |
| `_ReviewSession.svelte` | ✅ Converted |
| `browse/+page.svelte` | ✅ Converted |
| `decks/+page.svelte` | ✅ Converted |
| `decks/filtered/+page.svelte` | ✅ Converted |
| `tags/+page.svelte` | ✅ Converted |
| `decks/presets/+page.svelte` | ✅ Converted |
| `import/+page.svelte` | ✅ Converted |
| `media/+page.svelte` | ✅ Converted |
| `notetypes/+page.svelte` | ✅ Converted |
| `settings/+page.svelte` | ✅ Converted |
| `stats/+page.svelte` | ✅ Converted |
| `stats/revlog/+page.svelte` | ✅ Converted |
| `sync/+page.svelte` | ✅ Converted |

### Notes (`src/lib/study-components/notes/`)
Hardcoded PT → `t()` with `study.notes.*` keys.

**Root files (25):** AbcView, ActivityHeatmap, AnnotateOverlay, Breadcrumb, CalendarStrip, CoverManager, CreatePageDialog, DatabaseView, DiffView, Editor, EmbedView, FlowchartView, HistoryModal, InlineToolbar, MaintenancePanel, MentionPopover, MermaidView, MindmapView, NotesSettingsTab, OpLogViewer, PageHero, PagePopover, PlantumlView, RenamePageDialog, SlashMenu — all ✅ Converted

**Shell files (22):** NbActiveNotebookBadge, NbDockBacklink, NbDockBookmark, NbDockFiles, NbDockGraph, NbDockInbox, NbDockLeft, NbDockOutline, NbDockRight, NbDockSidebar, NbDockTag, NbNewSplitMenu, NbNotebookCoverDialog, NbNotebookCreateDialog, NbResizeHandle, NbShell, NbSplitHandle, NbStatusBar, NbTabContextMenu, NbTabStrip, NbWndTree, NbWorkspace — all ✅ Converted

### Rules
- `$t("study.notes.CATEGORY.key")` in markup, `t(...)` in `<script>`
- Add `import { t } from "$lib/i18n"` to each file
- Verify `en.json` is valid JSON after each batch of edits
- Svelte 5 runes syntax, no comments
- CRLF line endings in en.json
