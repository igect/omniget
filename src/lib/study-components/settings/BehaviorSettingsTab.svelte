<script lang="ts">
  import { t } from "$lib/i18n";
  import SettingsField from "./SettingsField.svelte";
  import SettingsSlider from "./SettingsSlider.svelte";
  import SettingsToggle from "./SettingsToggle.svelte";
  import type { StudySettings } from "$lib/study-bridge";

  type Props = {
    settings: StudySettings;
    onPatch: (patch: StudySettings) => void;
  };

  let { settings, onPatch }: Props = $props();
  const player = $derived(settings.player ?? {});

  function setPlayer<K extends keyof NonNullable<StudySettings["player"]>>(
    key: K,
    value: NonNullable<StudySettings["player"]>[K],
  ) {
    onPatch({ player: { ...(settings.player ?? {}), [key]: value } });
  }
</script>

<section class="tab">
  <SettingsField
    label={$t("study.settings.behavior.binge_watching_label")}
    description={$t("study.settings.behavior.binge_watching_desc")}
  >
    <SettingsToggle
      value={player.binge_watching ?? true}
      onChange={(v) => setPlayer("binge_watching", v)}
      ariaLabel={$t("study.settings.behavior.binge_watching_aria")}
    />
  </SettingsField>

  <SettingsField
    label={$t("study.settings.behavior.countdown_label")}
    description={$t("study.settings.behavior.countdown_desc")}
    valueDisplay={`${(player.next_video_notification_ms ?? 5000) / 1000}s`}
  >
    <SettingsSlider
      value={player.next_video_notification_ms ?? 5000}
      min={1000}
      max={15000}
      step={500}
      onChange={(v) => setPlayer("next_video_notification_ms", v)}
    />
  </SettingsField>

  <SettingsField
    label={$t("study.settings.behavior.seek_history_label")}
    description={$t("study.settings.behavior.seek_history_desc")}
  >
    <SettingsToggle
      value={player.collect_seek_logs ?? true}
      onChange={(v) => setPlayer("collect_seek_logs", v)}
      ariaLabel={$t("study.settings.behavior.seek_history_aria")}
    />
  </SettingsField>
</section>

<style>
  .tab {
    display: flex;
    flex-direction: column;
  }
</style>
