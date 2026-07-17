<script lang="ts">
  import { onMount } from "svelte";
  import { pluginInvoke } from "$lib/plugin-invoke";
  import PageHero from "$lib/study-components/PageHero.svelte";
  import { t } from "$lib/i18n";

  type DeckConfigSummary = {
    id: number;
    name: string;
    mtime_secs: number;
    use_count: number;
  };

  type DeckConfigData = {
    learn_steps: number[];
    relearn_steps: number[];
    fsrs_params_5: number[];
    new_per_day: number;
    reviews_per_day: number;
    initial_ease: number;
    easy_multiplier: number;
    hard_multiplier: number;
    lapse_multiplier: number;
    interval_multiplier: number;
    maximum_review_interval: number;
    minimum_lapse_interval: number;
    graduating_interval_good: number;
    graduating_interval_easy: number;
    leech_threshold: number;
    cap_answer_time_to_secs: number;
    show_timer: boolean;
    stop_timer_on_answer: boolean;
    bury_new: boolean;
    bury_reviews: boolean;
    bury_interday_learning: boolean;
    disable_autoplay: boolean;
    desired_retention: number;
    historical_retention: number;
    ignore_revlogs_before_date: string;
    new_card_insert_order: string;
    new_card_gather_priority: string;
    new_card_sort_order: string;
    new_mix: string;
    review_order: string;
    interday_learning_mix: string;
    leech_action: string;
  };

  type DeckConfig = {
    id: number;
    name: string;
    mtime_secs: number;
    usn: number;
    config: DeckConfigData;
  };

  type GlobalConf = Record<string, unknown>;

  type BackupEntry = {
    filename: string;
    path: string;
    bytes: number;
    modified_secs: number;
  };

  type VerifyReport = {
    ok: boolean;
    message: string;
    schema_version: number | null;
    bytes: number;
  };

  let loading = $state(true);
  let saving = $state<string | null>(null);
  let error = $state("");
  let toast = $state<{ kind: "ok" | "err"; msg: string } | null>(null);

  let globalConf = $state<GlobalConf>({});
  let deckConfigs = $state<DeckConfigSummary[]>([]);
  let defaultDeckCfg = $state<DeckConfig | null>(null);

  let backups = $state<BackupEntry[]>([]);
  let backupsLoading = $state(false);
  let verifyCache = $state<Record<string, VerifyReport>>({});
  let verifyingPath = $state<string | null>(null);
  let restoreTargetPath = $state<string | null>(null);
  let restoring = $state(false);
  let cleanupKeep = $state(5);
  let cleanupBusy = $state(false);

  let rawKey = $state("");
  let rawValue = $state<string | null>(null);
  let rawBusy = $state(false);
  let confirmDeleteKeyOpen = $state(false);

  let schedulerVer = $state("v3");
  let nextNewCardPos = $state(1);
  let lastUnburied = $state(0);
  let collapseTime = $state(1200);
  let answerTimeLimit = $state(0);
  let showRemainingDueCounts = $state(true);
  let showIntervalsOnButtons = $state(true);
  let learnAheadSecs = $state(1200);

  let dailyNewLimit = $state(20);
  let dailyReviewLimit = $state(200);
  let desiredRetention = $state(0.9);

  let learnStepsRaw = $state("1 10");
  let relearnStepsRaw = $state("10");
  let leechThreshold = $state(8);
  let leechAction = $state("tag_only");

  let buryNew = $state(false);
  let buryReviews = $state(false);
  let buryInterday = $state(false);
  let disableAutoplay = $state(false);
  let showTimer = $state(false);
  let stopTimerOnAnswer = $state(false);

  let openSection = $state<string>("scheduler");

  function showToast(kind: "ok" | "err", msg: string) {
    toast = { kind, msg };
    setTimeout(() => {
      toast = null;
    }, 2400);
  }

  function parseSteps(raw: string): number[] {
    return raw
      .trim()
      .split(/\s+/)
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n) && n > 0);
  }

  function formatSteps(steps: number[]): string {
    return steps.join(" ");
  }

  function num(v: unknown, fallback: number): number {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
    return fallback;
  }

  function bool(v: unknown, fallback: boolean): boolean {
    if (typeof v === "boolean") return v;
    if (typeof v === "string") return v === "true" || v === "1";
    return fallback;
  }

  function str(v: unknown, fallback: string): string {
    if (typeof v === "string" && v.length > 0) return v;
    return fallback;
  }

  async function load() {
    loading = true;
    error = "";
    try {
      await pluginInvoke("study", "study:anki:storage:open");
      const [conf, list, def] = await Promise.all([
        pluginInvoke<GlobalConf>("study", "study:anki:config:list_global"),
        pluginInvoke<DeckConfigSummary[]>(
          "study",
          "study:anki:deckconfig:list",
        ),
        pluginInvoke<DeckConfig>("study", "study:anki:config:get_deck", {
          deckId: 1,
        }),
      ]);

      globalConf = conf || {};
      deckConfigs = list || [];
      defaultDeckCfg = def;

      schedulerVer = str(globalConf["schedVer"], "v3");
      nextNewCardPos = num(globalConf["nextPos"], 1);
      lastUnburied = num(globalConf["lastUnburied"], 0);
      collapseTime = num(globalConf["collapseTime"], 1200);
      answerTimeLimit = num(globalConf["timeLim"], 0);
      showRemainingDueCounts = bool(globalConf["dueCounts"], true);
      showIntervalsOnButtons = bool(globalConf["estTimes"], true);
      learnAheadSecs = num(globalConf["lrnLearnAhead"], 1200);

      if (def) {
        const c = def.config;
        dailyNewLimit = c.new_per_day;
        dailyReviewLimit = c.reviews_per_day;
        desiredRetention = c.desired_retention;
        learnStepsRaw = formatSteps(c.learn_steps);
        relearnStepsRaw = formatSteps(c.relearn_steps);
        leechThreshold = c.leech_threshold;
        leechAction = c.leech_action;
        buryNew = c.bury_new;
        buryReviews = c.bury_reviews;
        buryInterday = c.bury_interday_learning;
        disableAutoplay = c.disable_autoplay;
        showTimer = c.show_timer;
        stopTimerOnAnswer = c.stop_timer_on_answer;
      }
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
    }
  }

  async function setGlobal(key: string, value: unknown) {
    await pluginInvoke("study", "study:anki:config:set_global", {
      key,
      value,
    });
  }

  async function saveScheduler() {
    saving = "scheduler";
    try {
      await Promise.all([
        setGlobal("schedVer", schedulerVer),
        setGlobal("collapseTime", collapseTime),
        setGlobal("timeLim", answerTimeLimit),
        setGlobal("dueCounts", showRemainingDueCounts),
        setGlobal("estTimes", showIntervalsOnButtons),
        setGlobal("lrnLearnAhead", learnAheadSecs),
      ]);
      showToast("ok", t("study.anki.settings.toast_study_saved"));
    } catch (e) {
      showToast("err", e instanceof Error ? e.message : String(e));
    } finally {
      saving = null;
    }
  }

  async function saveDeckDefaults() {
    if (!defaultDeckCfg) return;
    saving = "deck";
    try {
      const updated: DeckConfig = {
        ...defaultDeckCfg,
        config: {
          ...defaultDeckCfg.config,
          new_per_day: Math.max(0, Math.floor(dailyNewLimit)),
          reviews_per_day: Math.max(0, Math.floor(dailyReviewLimit)),
          desired_retention: Math.min(0.99, Math.max(0.7, desiredRetention)),
          learn_steps: parseSteps(learnStepsRaw),
          relearn_steps: parseSteps(relearnStepsRaw),
          leech_threshold: Math.max(1, Math.floor(leechThreshold)),
          leech_action: leechAction,
          bury_new: buryNew,
          bury_reviews: buryReviews,
          bury_interday_learning: buryInterday,
          disable_autoplay: disableAutoplay,
          show_timer: showTimer,
          stop_timer_on_answer: stopTimerOnAnswer,
        },
      };
      await pluginInvoke("study", "study:anki:config:set_deck", {
        config: updated,
      });
      defaultDeckCfg = updated;
      showToast("ok", t("study.anki.settings.toast_deck_saved"));
    } catch (e) {
      showToast("err", e instanceof Error ? e.message : String(e));
    } finally {
      saving = null;
    }
  }

  async function loadBackups() {
    backupsLoading = true;
    try {
      const list = await pluginInvoke<BackupEntry[]>(
        "study",
        "study:anki:backup:list",
      );
      backups = list ?? [];
    } catch (e) {
      showToast("err", e instanceof Error ? e.message : String(e));
    } finally {
      backupsLoading = false;
    }
  }

  async function runBackup() {
    saving = "backup";
    try {
      const r = await pluginInvoke<{ path: string; bytes: number }>(
        "study",
        "study:anki:backup:create",
      );
      showToast("ok", t("study.anki.settings.toast_backup_created", { size: formatBytes(r.bytes) }));
      await loadBackups();
    } catch (e) {
      showToast("err", e instanceof Error ? e.message : String(e));
    } finally {
      saving = null;
    }
  }

  async function verifyBackup(path: string) {
    verifyingPath = path;
    try {
      const report = await pluginInvoke<VerifyReport>(
        "study",
        "study:anki:backup:verify",
        { sourcePath: path },
      );
      verifyCache = { ...verifyCache, [path]: report };
      showToast(report.ok ? "ok" : "err", report.ok ? t("study.anki.settings.toast_backup_valid") : t("study.anki.settings.toast_backup_corrupt"));
    } catch (e) {
      showToast("err", e instanceof Error ? e.message : String(e));
    } finally {
      verifyingPath = null;
    }
  }

  function askRestore(path: string) {
    restoreTargetPath = path;
  }

  async function confirmRestore() {
    if (!restoreTargetPath) return;
    restoring = true;
    try {
      await pluginInvoke<{ source: string; target: string; backup_before: string | null }>(
        "study",
        "study:anki:backup:restore",
        { sourcePath: restoreTargetPath },
      );
      showToast("ok", t("study.anki.settings.toast_backup_restored"));
      restoreTargetPath = null;
      await loadBackups();
    } catch (e) {
      showToast("err", e instanceof Error ? e.message : String(e));
    } finally {
      restoring = false;
    }
  }

  async function runCleanup() {
    const keep = Math.max(0, Math.floor(cleanupKeep));
    cleanupBusy = true;
    try {
      const r = await pluginInvoke<{ removed: number }>(
        "study",
        "study:anki:backup:cleanup",
        { keep },
      );
      if (r.removed === 0) {
        showToast("ok", t("study.anki.settings.toast_backup_cleanup_none"));
      } else {
        showToast(
          "ok",
          r.removed === 1
            ? t("study.anki.settings.toast_backup_cleanup_one")
            : t("study.anki.settings.toast_backup_cleanup_other", { count: r.removed }),
        );
        await loadBackups();
      }
    } catch (e) {
      showToast("err", e instanceof Error ? e.message : String(e));
    } finally {
      cleanupBusy = false;
    }
  }

  function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return "—";
    const units = ["B", "KB", "MB", "GB"];
    let n = bytes;
    let i = 0;
    while (n >= 1024 && i < units.length - 1) {
      n /= 1024;
      i++;
    }
    return `${n < 10 ? n.toFixed(1) : Math.round(n)} ${units[i]}`;
  }

  function formatDate(secs: number): string {
    if (!secs || secs <= 0) return "—";
    return new Date(secs * 1000).toLocaleString();
  }

  async function getRawKey() {
    const key = rawKey.trim();
    if (!key) return;
    rawBusy = true;
    try {
      const v = await pluginInvoke<unknown>(
        "study",
        "study:anki:config:get_global",
        { key },
      );
      rawValue = v == null ? t("study.anki.settings.value_not_found") : JSON.stringify(v, null, 2);
    } catch (e) {
      showToast("err", e instanceof Error ? e.message : String(e));
      rawValue = null;
    } finally {
      rawBusy = false;
    }
  }

  async function deleteRawKey() {
    const key = rawKey.trim();
    if (!key) return;
    confirmDeleteKeyOpen = false;
    rawBusy = true;
    try {
      await pluginInvoke("study", "study:anki:config:delete_global", { key });
      showToast("ok", t("study.anki.settings.toast_key_deleted", { key }));
      rawValue = null;
      await load();
    } catch (e) {
      showToast("err", e instanceof Error ? e.message : String(e));
    } finally {
      rawBusy = false;
    }
  }

  function toggleSection(key: string) {
    openSection = openSection === key ? "" : key;
    if (openSection === "backup" && backups.length === 0 && !backupsLoading) {
      void loadBackups();
    }
  }

  onMount(load);
</script>

<section class="study-page">
  <PageHero
    title={$t("study.anki.settings.title")}
    subtitle={$t("study.anki.settings.subtitle")}
  />

  {#if toast}
    <div class="toast" class:err={toast.kind === "err"} role="status">
      {toast.msg}
    </div>
  {/if}

  {#if loading}
    <div class="state">{$t("study.anki.settings.loading")}</div>
  {:else if error}
    <div class="state err">{error}</div>
    <button class="btn ghost" onclick={load}>{$t("study.anki.settings.retry")}</button>
  {:else}
    <div class="sections">
      <section class="card" class:open={openSection === "scheduler"}>
        <button
          type="button"
          class="card-head"
          onclick={() => toggleSection("scheduler")}
          aria-expanded={openSection === "scheduler"}
        >
          <div class="head-left">
            <h3>{$t("study.anki.settings.section_study")}</h3>
            <span class="head-sub">
              {$t("study.anki.settings.section_study_sub")}
            </span>
          </div>
          <span class="chev" aria-hidden="true">›</span>
        </button>

        {#if openSection === "scheduler"}
          <div class="card-body">
            <div class="field">
              <label for="schedver">
                {$t("study.anki.settings.label_sched_ver")}
                <span class="hint">{$t("study.anki.settings.hint_sched_ver")}</span>
              </label>
              <select id="schedver" bind:value={schedulerVer}>
                <option value="v1">{$t("study.anki.settings.opt_sched_v1")}</option>
                <option value="v2">{$t("study.anki.settings.opt_sched_v2")}</option>
                <option value="v3">{$t("study.anki.settings.opt_sched_v3")}</option>
              </select>
            </div>

            <div class="row">
              <div class="field">
                <label for="learnahead">
                  {$t("study.anki.settings.label_learn_ahead")} <span class="hint">{$t("study.anki.settings.hint_sec")}</span>
                </label>
                <input
                  id="learnahead"
                  type="number"
                  min="0"
                  bind:value={learnAheadSecs}
                />
                <span class="default">{$t("study.anki.settings.default_1200")}</span>
              </div>

              <div class="field">
                <label for="collapse">
                  {$t("study.anki.settings.label_collapse")} <span class="hint">{$t("study.anki.settings.hint_sec")}</span>
                </label>
                <input
                  id="collapse"
                  type="number"
                  min="0"
                  bind:value={collapseTime}
                />
                <span class="default">{$t("study.anki.settings.default_1200")}</span>
              </div>
            </div>

            <div class="field">
              <label for="timelim">
                {$t("study.anki.settings.label_time_limit")} <span class="hint">{$t("study.anki.settings.hint_time_limit")}</span>
              </label>
              <input
                id="timelim"
                type="number"
                min="0"
                bind:value={answerTimeLimit}
              />
            </div>

            <label class="check">
              <input type="checkbox" bind:checked={showRemainingDueCounts} />
              <span>{$t("study.anki.settings.label_show_counts")}</span>
            </label>
            <label class="check">
              <input type="checkbox" bind:checked={showIntervalsOnButtons} />
              <span>{$t("study.anki.settings.label_show_intervals")}</span>
            </label>

            <div class="actions">
              <button
                class="btn primary"
                onclick={saveScheduler}
                disabled={saving === "scheduler"}
              >
                {saving === "scheduler" ? $t("study.anki.settings.btn_saving") : $t("study.anki.settings.btn_save_study")}
              </button>
            </div>
          </div>
        {/if}
      </section>

      <section class="card" class:open={openSection === "deck"}>
        <button
          type="button"
          class="card-head"
          onclick={() => toggleSection("deck")}
          aria-expanded={openSection === "deck"}
        >
          <div class="head-left">
            <h3>{$t("study.anki.settings.section_deck")}</h3>
            <span class="head-sub">
              {$t("study.anki.settings.section_deck_sub")}
            </span>
          </div>
          <span class="chev" aria-hidden="true">›</span>
        </button>

        {#if openSection === "deck" && defaultDeckCfg}
          <div class="card-body">
            <p class="lede">
              {$t("study.anki.settings.lede_deck")}
              {#if deckConfigs.length > 1}
                {$t("study.anki.settings.lede_deck_more")}
                <a href="/study/anki/decks" class="inline-link">{$t("study.anki.settings.lede_deck_link")}</a>.
              {/if}
            </p>

            <div class="row">
              <div class="field">
                <label for="newperday">
                  {$t("study.anki.settings.label_new_per_day")}
                </label>
                <input
                  id="newperday"
                  type="number"
                  min="0"
                  bind:value={dailyNewLimit}
                />
                <span class="default">{$t("study.anki.settings.default_20")}</span>
              </div>

              <div class="field">
                <label for="revperday">
                  {$t("study.anki.settings.label_reviews_per_day")}
                </label>
                <input
                  id="revperday"
                  type="number"
                  min="0"
                  bind:value={dailyReviewLimit}
                />
                <span class="default">{$t("study.anki.settings.default_200")}</span>
              </div>
            </div>

            <div class="field">
              <label for="retention">
                {$t("study.anki.settings.label_desired_retention")} <span class="hint">{$t("study.anki.settings.hint_retention_range")}</span>
              </label>
              <input
                id="retention"
                type="number"
                step="0.01"
                min="0.7"
                max="0.99"
                bind:value={desiredRetention}
              />
              <span class="default">
                {$t("study.anki.settings.default_retention")}
              </span>
            </div>

            <div class="row">
              <div class="field">
                <label for="learn">
                  {$t("study.anki.settings.label_learning_steps")} <span class="hint">{$t("study.anki.settings.hint_minutes")}</span>
                </label>
                <input id="learn" type="text" bind:value={learnStepsRaw} />
                <span class="default">{$t("study.anki.settings.default_1_10")}</span>
              </div>

              <div class="field">
                <label for="relearn">
                  {$t("study.anki.settings.label_relearning_steps")} <span class="hint">{$t("study.anki.settings.hint_minutes")}</span>
                </label>
                <input id="relearn" type="text" bind:value={relearnStepsRaw} />
                <span class="default">{$t("study.anki.settings.default_10")}</span>
              </div>
            </div>

            <div class="row">
              <div class="field">
                <label for="leech">
                  {$t("study.anki.settings.label_leech_limit")} <span class="hint">{$t("study.anki.settings.hint_leech")}</span>
                </label>
                <input
                  id="leech"
                  type="number"
                  min="1"
                  bind:value={leechThreshold}
                />
                <span class="default">{$t("study.anki.settings.default_8")}</span>
              </div>

              <div class="field">
                <label for="leechact">{$t("study.anki.settings.label_leech_action")}</label>
                <select id="leechact" bind:value={leechAction}>
                  <option value="tag_only">{$t("study.anki.settings.opt_leech_tag")}</option>
                  <option value="suspend">{$t("study.anki.settings.opt_leech_suspend")}</option>
                </select>
              </div>
            </div>

            <h4 class="subhead">{$t("study.anki.settings.h4_behavior")}</h4>
            <label class="check">
              <input type="checkbox" bind:checked={buryNew} />
              <span>{$t("study.anki.settings.check_bury_new")}</span>
            </label>
            <label class="check">
              <input type="checkbox" bind:checked={buryReviews} />
              <span>{$t("study.anki.settings.check_bury_reviews")}</span>
            </label>
            <label class="check">
              <input type="checkbox" bind:checked={buryInterday} />
              <span>{$t("study.anki.settings.check_bury_interday")}</span>
            </label>
            <label class="check">
              <input type="checkbox" bind:checked={disableAutoplay} />
              <span>{$t("study.anki.settings.check_disable_autoplay")}</span>
            </label>
            <label class="check">
              <input type="checkbox" bind:checked={showTimer} />
              <span>{$t("study.anki.settings.check_show_timer")}</span>
            </label>
            <label class="check">
              <input type="checkbox" bind:checked={stopTimerOnAnswer} />
              <span>{$t("study.anki.settings.check_stop_timer_on_answer")}</span>
            </label>

            <div class="actions">
              <button
                class="btn primary"
                onclick={saveDeckDefaults}
                disabled={saving === "deck"}
              >
                {saving === "deck" ? $t("study.anki.settings.btn_saving") : $t("study.anki.settings.btn_save_deck")}
              </button>
            </div>
          </div>
        {/if}
      </section>

      <section class="card" class:open={openSection === "backup"}>
        <button
          type="button"
          class="card-head"
          onclick={() => toggleSection("backup")}
          aria-expanded={openSection === "backup"}
        >
          <div class="head-left">
            <h3>{$t("study.anki.settings.section_backup")}</h3>
            <span class="head-sub">
              {backups.length === 0
                ? $t("study.anki.settings.section_backup_sub_empty")
                : backups.length === 1
                  ? $t("study.anki.settings.section_backup_sub_one")
                  : $t("study.anki.settings.section_backup_sub_other", { count: backups.length })}
            </span>
          </div>
          <span class="chev" aria-hidden="true">›</span>
        </button>

        {#if openSection === "backup"}
          <div class="card-body">
            <div class="backup-head">
              <p class="lede">
                {@html $t("study.anki.settings.lede_backup")}
              </p>
              <button
                class="btn primary"
                onclick={runBackup}
                disabled={saving === "backup"}
              >
                {saving === "backup" ? $t("study.anki.settings.btn_creating") : $t("study.anki.settings.btn_create_backup")}
              </button>
            </div>

            {#if backupsLoading}
              <p class="muted small">{$t("study.anki.settings.loading")}</p>
            {:else if backups.length === 0}
              <div class="empty-backup">
                <p>{$t("study.anki.settings.empty_backup")}</p>
                <p class="hint">
                  {$t("study.anki.settings.empty_backup_hint")}
                </p>
              </div>
            {:else}
              <ul class="backup-list">
                {#each backups as b (b.path)}
                  {@const v = verifyCache[b.path]}
                  <li class="backup-row">
                    <div class="backup-info">
                      <div class="backup-name">
                        <span class="backup-filename">{b.filename}</span>
                        {#if v}
                          <span
                            class="verify-badge"
                            class:ok={v.ok}
                            class:err={!v.ok}
                            title={v.message}
                          >
                            {v.ok ? $t("study.anki.settings.badge_ok") : $t("study.anki.settings.badge_err")}
                          </span>
                        {/if}
                      </div>
                      <div class="backup-meta">
                        {formatDate(b.modified_secs)} · {formatBytes(b.bytes)}
                      </div>
                    </div>
                    <div class="backup-actions">
                      <button
                        type="button"
                        class="btn ghost sm"
                        onclick={() => verifyBackup(b.path)}
                        disabled={verifyingPath === b.path}
                      >
                        {verifyingPath === b.path ? $t("study.anki.settings.btn_verifying") : $t("study.anki.settings.btn_verify")}
                      </button>
                      <button
                        type="button"
                        class="btn ghost sm"
                        onclick={() => askRestore(b.path)}
                      >
                        {$t("study.anki.settings.btn_restore")}
                      </button>
                    </div>
                  </li>
                {/each}
              </ul>

              <div class="cleanup-row">
                <label class="cleanup-label">
                  {$t("study.anki.settings.cleanup_keep_before")}
                  <input
                    type="number"
                    min="0"
                    max="999"
                    class="cleanup-keep"
                    bind:value={cleanupKeep}
                  />
                  {$t("study.anki.settings.cleanup_keep_after")}
                </label>
                <button
                  class="btn ghost sm"
                  onclick={runCleanup}
                  disabled={cleanupBusy || backups.length <= cleanupKeep}
                >
                  {cleanupBusy ? $t("study.anki.settings.btn_cleaning") : $t("study.anki.settings.btn_cleanup")}
                </button>
              </div>
            {/if}
          </div>
        {/if}
      </section>

      <section class="card" class:open={openSection === "advanced"}>
        <button
          type="button"
          class="card-head"
          onclick={() => toggleSection("advanced")}
          aria-expanded={openSection === "advanced"}
        >
          <div class="head-left">
            <h3>{$t("study.anki.settings.section_advanced")}</h3>
            <span class="head-sub">{$t("study.anki.settings.section_advanced_sub")}</span>
          </div>
          <span class="chev" aria-hidden="true">›</span>
        </button>

        {#if openSection === "advanced"}
          <div class="card-body">
            <dl class="kv">
              <dt>{$t("study.anki.settings.label_next_pos")}</dt>
              <dd>{nextNewCardPos}</dd>
              <dt>{$t("study.anki.settings.label_last_unbury")}</dt>
              <dd>
                {lastUnburied > 0
                  ? new Date(lastUnburied * 1000).toLocaleString()
                  : "—"}
              </dd>
              <dt>{$t("study.anki.settings.label_presets")}</dt>
              <dd>
                {$t("study.anki.settings.presets_count", { count: deckConfigs.length, decks: deckConfigs.reduce((s, c) => s + c.use_count, 0) })}
              </dd>
            </dl>

            <details class="raw">
              <summary>{$t("study.anki.settings.summary_raw_conf")}</summary>
              <pre>{JSON.stringify(globalConf, null, 2)}</pre>
            </details>

            <h4 class="subhead">{$t("study.anki.settings.h4_inspect_key")}</h4>
            <p class="lede">
              {@html $t("study.anki.settings.lede_inspect")}
            </p>
            <div class="raw-row">
              <input
                type="text"
                class="raw-input"
                placeholder={$t("study.anki.settings.placeholder_key")}
                bind:value={rawKey}
                onkeydown={(e) => { if (e.key === "Enter") getRawKey(); }}
              />
              <button
                type="button"
                class="btn ghost sm"
                onclick={getRawKey}
                disabled={rawBusy || !rawKey.trim()}
              >
                {$t("study.anki.settings.btn_read")}
              </button>
              <button
                type="button"
                class="btn ghost sm danger"
                onclick={() => (confirmDeleteKeyOpen = true)}
                disabled={rawBusy || !rawKey.trim()}
              >
                {$t("study.anki.settings.btn_delete")}
              </button>
            </div>
            {#if rawValue !== null}
              <pre class="raw-output">{rawValue}</pre>
            {/if}
          </div>
        {/if}
      </section>
    </div>
  {/if}
</section>

{#if confirmDeleteKeyOpen}
  <div
    class="modal-backdrop"
    role="presentation"
    onclick={() => (confirmDeleteKeyOpen = false)}
    onkeydown={(e) => { if (e.key === "Escape") confirmDeleteKeyOpen = false; }}
  >
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => { if (e.key === "Escape") { e.stopPropagation(); confirmDeleteKeyOpen = false; } }}
    >
      <h3>{$t("study.anki.settings.confirm_delete_key_title")}</h3>
      <p class="modal-body">
        {@html $t("study.anki.settings.confirm_delete_key_body", { key: rawKey })}
      </p>
      <footer class="modal-foot">
        <button
          type="button"
          class="btn ghost"
          onclick={() => (confirmDeleteKeyOpen = false)}
        >
          {$t("study.anki.settings.confirm_delete_key_btn_cancel")}
        </button>
        <button
          type="button"
          class="btn primary danger"
          onclick={deleteRawKey}
        >
          {$t("study.anki.settings.confirm_delete_key_btn_delete")}
        </button>
      </footer>
    </div>
  </div>
{/if}

{#if restoreTargetPath}
  <div
    class="modal-backdrop"
    role="presentation"
    onclick={() => (restoreTargetPath = null)}
    onkeydown={(e) => { if (e.key === "Escape") restoreTargetPath = null; }}
  >
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="restore-title"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => { if (e.key === "Escape") { e.stopPropagation(); restoreTargetPath = null; } }}
    >
      <h3 id="restore-title">{$t("study.anki.settings.confirm_restore_title")}</h3>
      <p class="modal-body">
        {@html $t("study.anki.settings.confirm_restore_body", { filename: restoreTargetPath?.split(/[\\/]/).pop() })}
      </p>
      <footer class="modal-foot">
        <button
          type="button"
          class="btn ghost"
          onclick={() => (restoreTargetPath = null)}
          disabled={restoring}
        >
          {$t("study.anki.settings.confirm_restore_btn_cancel")}
        </button>
        <button
          type="button"
          class="btn primary"
          onclick={confirmRestore}
          disabled={restoring}
        >
          {restoring ? $t("study.anki.settings.confirm_restore_btn_restoring") : $t("study.anki.settings.confirm_restore_btn_restore")}
        </button>
      </footer>
    </div>
  </div>
{/if}

<style>
  .study-page {
    display: flex;
    flex-direction: column;
    gap: calc(var(--padding) * 1.25);
    width: 100%;
    max-width: 820px;
    margin-inline: auto;
  }

  .state {
    padding: calc(var(--padding) * 2);
    text-align: center;
    color: var(--secondary);
    font-size: 14px;
  }
  .state.err {
    color: var(--error, var(--accent));
  }

  .toast {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 10px 16px;
    border-radius: var(--border-radius);
    background: color-mix(in oklab, var(--accent) 16%, var(--surface));
    color: var(--text);
    font-size: 13px;
    box-shadow: 0 8px 24px color-mix(in oklab, black 20%, transparent);
    z-index: 100;
    animation: slide-up 180ms ease;
  }
  .toast.err {
    background: color-mix(
      in oklab,
      var(--error, var(--accent)) 18%,
      var(--surface)
    );
  }
  @keyframes slide-up {
    from {
      transform: translateY(8px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .sections {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .card {
    border: 1px solid color-mix(in oklab, var(--input-border) 70%, transparent);
    border-radius: var(--border-radius);
    background: var(--surface);
    overflow: hidden;
    transition: border-color 150ms ease;
  }
  .card.open {
    border-color: color-mix(in oklab, var(--accent) 40%, var(--input-border));
  }

  .card-head {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 18px;
    border: 0;
    background: transparent;
    color: var(--text);
    cursor: pointer;
    text-align: left;
    font: inherit;
    transition: background 120ms ease;
  }
  .card-head:hover {
    background: color-mix(in oklab, var(--accent) 5%, transparent);
  }
  .card-head:focus-visible {
    outline: 2px solid var(--focus-ring, var(--accent));
    outline-offset: -2px;
  }
  .head-left {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .head-left h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
  }
  .head-sub {
    color: var(--text);
    font-size: var(--text-sm);
  }
  .chev {
    font-size: 18px;
    color: var(--tertiary);
    transition: transform 180ms ease;
  }
  .card.open .chev {
    transform: rotate(90deg);
  }

  .card-body {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 4px 18px 18px;
    border-top: 1px solid
      color-mix(in oklab, var(--input-border) 50%, transparent);
  }

  .lede {
    margin: 4px 0 0;
    color: var(--secondary);
    font-size: 13px;
    line-height: 1.55;
  }

  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  @media (max-width: 600px) {
    .row {
      grid-template-columns: 1fr;
    }
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .field label {
    display: flex;
    align-items: baseline;
    gap: 8px;
    font-size: 13px;
    color: var(--text);
    font-weight: 500;
  }
  .hint {
    color: var(--tertiary);
    font-size: 11px;
    font-weight: 400;
  }
  .default {
    color: var(--tertiary);
    font-size: 11px;
  }
  .field input,
  .field select {
    padding: 8px 10px;
    border: 1px solid var(--input-border);
    border-radius: var(--border-radius);
    background: var(--bg);
    color: var(--text);
    font: inherit;
    font-size: 13px;
  }
  .field input[type="number"] {
    font-family: var(--font-mono, ui-monospace, monospace);
  }
  .field input:focus,
  .field select:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 18%, transparent);
  }

  .check {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: var(--secondary);
    cursor: pointer;
  }
  .check input {
    width: 16px;
    height: 16px;
    accent-color: var(--accent);
  }

  .subhead {
    margin: 8px 0 -4px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--tertiary);
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    padding-top: 6px;
    border-top: 1px solid
      color-mix(in oklab, var(--input-border) 40%, transparent);
  }

  .btn {
    padding: 8px 16px;
    border-radius: var(--border-radius);
    border: 1px solid transparent;
    font: inherit;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 150ms ease, border-color 150ms ease;
  }
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .btn.primary {
    background: var(--accent);
    color: var(--on-accent, var(--on-cta, white));
  }
  .btn.primary:hover:not(:disabled) {
    background: var(--accent-hover, var(--accent));
  }
  .btn.ghost {
    background: transparent;
    border-color: var(--input-border);
    color: var(--text);
  }
  .btn.ghost:hover {
    background: color-mix(in oklab, var(--accent) 8%, transparent);
  }

  .inline-link {
    color: var(--accent);
    text-decoration: none;
  }
  .inline-link:hover {
    text-decoration: underline;
  }

  .kv {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 6px 16px;
    margin: 0;
    font-size: 13px;
  }
  .kv dt {
    color: var(--tertiary);
  }
  .kv dd {
    margin: 0;
    color: var(--text);
    font-family: var(--font-mono, ui-monospace, monospace);
  }

  .raw {
    margin-top: 8px;
  }
  .raw summary {
    cursor: pointer;
    color: var(--secondary);
    font-size: 12px;
    padding: 6px 0;
  }
  .raw pre {
    margin: 8px 0 0;
    padding: 12px;
    background: var(--bg);
    border: 1px solid color-mix(in oklab, var(--input-border) 60%, transparent);
    border-radius: var(--border-radius);
    font-size: 11px;
    line-height: 1.5;
    color: var(--secondary);
    overflow-x: auto;
    max-height: 320px;
    overflow-y: auto;
  }

  code {
    padding: 1px 6px;
    background: color-mix(in oklab, var(--accent) 8%, transparent);
    border-radius: 4px;
    font-size: 12px;
    color: var(--text);
  }

  .backup-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }
  .backup-head .lede {
    flex: 1;
    margin: 0;
  }
  .backup-head .btn {
    flex-shrink: 0;
  }

  .empty-backup {
    text-align: center;
    padding: 24px 16px;
    color: var(--secondary);
    font-size: 13px;
  }
  .empty-backup .hint {
    margin: 4px 0 0;
    color: var(--tertiary);
    font-size: 12px;
  }

  .backup-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .backup-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border: 1px solid color-mix(in oklab, var(--input-border) 50%, transparent);
    border-radius: var(--border-radius);
    background: color-mix(in oklab, var(--surface) 60%, transparent);
  }
  .backup-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .backup-name {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .backup-filename {
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 12px;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .verify-badge {
    flex-shrink: 0;
    padding: 1px 8px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 500;
  }
  .verify-badge.ok {
    background: color-mix(in oklab, var(--success, var(--accent)) 14%, transparent);
    color: var(--success, var(--accent));
  }
  .verify-badge.err {
    background: color-mix(in oklab, var(--error, var(--accent)) 14%, transparent);
    color: var(--error, var(--accent));
  }
  .backup-meta {
    color: var(--tertiary);
    font-size: 11px;
  }
  .backup-actions {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }

  .btn.sm {
    padding: 5px 10px;
    font-size: 12px;
  }

  .cleanup-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-top: 8px;
    border-top: 1px solid color-mix(in oklab, var(--input-border) 40%, transparent);
  }
  .cleanup-label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--secondary);
    font-size: 13px;
  }
  .cleanup-keep {
    width: 56px;
    padding: 4px 8px;
    border: 1px solid var(--input-border);
    border-radius: var(--border-radius);
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 13px;
    text-align: center;
  }
  .cleanup-keep:focus {
    outline: none;
    border-color: var(--accent);
  }

  .muted {
    color: var(--tertiary);
  }
  .small {
    font-size: 12px;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: var(--dialog-backdrop, rgba(0, 0, 0, 0.55));
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    padding: 16px;
  }
  .modal {
    background: var(--popup-bg, var(--surface));
    border: 1px solid color-mix(in oklab, var(--input-border) 60%, transparent);
    border-radius: var(--border-radius);
    padding: 20px;
    max-width: 460px;
    width: 100%;
    box-shadow: 0 20px 50px color-mix(in oklab, black 30%, transparent);
  }
  .modal h3 {
    margin: 0 0 12px;
    font-size: 15px;
    font-weight: 600;
  }
  .modal-body {
    margin: 0 0 16px;
    color: var(--secondary);
    font-size: 13px;
    line-height: 1.55;
  }
  .modal-body code {
    word-break: break-all;
  }
  .modal-foot {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    border-top: 1px solid color-mix(in oklab, var(--input-border) 40%, transparent);
    padding-top: 12px;
  }

  .raw-row {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .raw-input {
    flex: 1;
    padding: 7px 10px;
    border: 1px solid var(--input-border);
    border-radius: var(--border-radius);
    background: var(--bg);
    color: var(--text);
    font: inherit;
    font-size: 12px;
    font-family: var(--font-mono, ui-monospace, monospace);
  }
  .raw-input:focus {
    outline: none;
    border-color: var(--accent);
  }
  .raw-output {
    margin: 8px 0 0;
    padding: 10px 12px;
    background: var(--bg);
    border: 1px solid color-mix(in oklab, var(--input-border) 50%, transparent);
    border-radius: var(--border-radius);
    font-size: 11px;
    color: var(--secondary);
    overflow-x: auto;
    max-height: 200px;
    overflow-y: auto;
  }
  .btn.ghost.danger {
    color: var(--error, var(--accent));
    border-color: color-mix(in oklab, var(--error, var(--accent)) 35%, var(--input-border));
  }
  .btn.ghost.danger:hover:not(:disabled) {
    background: color-mix(in oklab, var(--error, var(--accent)) 10%, transparent);
  }
  .btn.primary.danger {
    background: var(--error, var(--accent));
    color: var(--on-error, var(--on-cta, white));
  }

  @media (prefers-reduced-motion: reduce) {
    .card,
    .card-head,
    .chev,
    .btn,
    .toast {
      transition: none;
      animation: none;
    }
  }
</style>
