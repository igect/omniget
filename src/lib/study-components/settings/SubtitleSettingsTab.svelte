<script lang="ts">
  import { t } from "$lib/i18n";
  import SettingsField from "./SettingsField.svelte";
  import SettingsSlider from "./SettingsSlider.svelte";
  import SettingsToggle from "./SettingsToggle.svelte";
  import SettingsSelect from "./SettingsSelect.svelte";
  import SettingsColorPicker from "./SettingsColorPicker.svelte";
  import SubtitlePreview from "./SubtitlePreview.svelte";
  import type { StudySettings } from "$lib/study-bridge";

  type Props = {
    settings: StudySettings;
    onPatch: (patch: StudySettings) => void;
  };

  let { settings, onPatch }: Props = $props();

  function setPlayer<K extends keyof NonNullable<StudySettings["player"]>>(
    key: K,
    value: NonNullable<StudySettings["player"]>[K],
  ) {
    onPatch({ player: { ...(settings.player ?? {}), [key]: value } });
  }

  const player = $derived(settings.player ?? {});
  const langOptions = [
    { value: "pt-BR", label: t("study.settings.language.pt_br") },
    { value: "pt", label: t("study.settings.language.pt") },
    { value: "en", label: t("study.settings.language.en") },
    { value: "es", label: t("study.settings.language.es") },
    { value: "default", label: t("study.settings.subtitles.lang_default") },
  ];
  const fontOptions = [
    { value: "system", label: t("study.settings.subtitles.font_system") },
    { value: "serif", label: t("study.settings.subtitles.font_serif") },
    { value: "sans", label: t("study.settings.subtitles.font_sans") },
  ];
</script>

<section class="tab">
  <div class="preview-block">
    <SubtitlePreview
      size={player.subtitles_size ?? 100}
      textColor={player.subtitles_text_color ?? "#ffffff"}
      backgroundColor={player.subtitles_background_color ?? "#000000"}
      outlineColor={player.subtitles_outline_color ?? "#000000"}
      opacity={player.subtitles_opacity ?? 100}
      font={player.subtitles_font ?? "system"}
      bold={player.subtitles_bold ?? false}
    />
  </div>

  <SettingsField label={$t("study.settings.subtitles.default_lang_label")} description={$t("study.settings.subtitles.default_lang_desc")}>
    <SettingsSelect
      value={player.subtitles_default_lang ?? "pt-BR"}
      options={langOptions}
      onChange={(v) => setPlayer("subtitles_default_lang", v)}
    />
  </SettingsField>

  <SettingsField label={$t("study.settings.subtitles.secondary_lang_label")} description={$t("study.settings.subtitles.secondary_lang_desc")}>
    <SettingsSelect
      value={player.subtitles_secondary_lang ?? "en"}
      options={langOptions}
      onChange={(v) => setPlayer("subtitles_secondary_lang", v)}
    />
  </SettingsField>

  <SettingsField label={$t("study.settings.subtitles.size_label")} valueDisplay={`${player.subtitles_size ?? 100}%`}>
    <SettingsSlider
      value={player.subtitles_size ?? 100}
      min={50}
      max={200}
      step={5}
      onChange={(v) => setPlayer("subtitles_size", v)}
    />
  </SettingsField>

  <SettingsField label={$t("study.settings.subtitles.offset_label")} description={$t("study.settings.subtitles.offset_desc")} valueDisplay={`${(player.subtitles_offset_ms ?? 0) / 1000}s`}>
    <SettingsSlider
      value={player.subtitles_offset_ms ?? 0}
      min={-5000}
      max={5000}
      step={100}
      onChange={(v) => setPlayer("subtitles_offset_ms", v)}
    />
  </SettingsField>

  <SettingsField label={$t("study.settings.subtitles.text_color_label")}>
    <SettingsColorPicker
      value={player.subtitles_text_color ?? "#ffffff"}
      onChange={(v) => setPlayer("subtitles_text_color", v)}
    />
  </SettingsField>

  <SettingsField label={$t("study.settings.subtitles.bg_color_label")}>
    <SettingsColorPicker
      value={player.subtitles_background_color ?? "#000000"}
      onChange={(v) => setPlayer("subtitles_background_color", v)}
    />
  </SettingsField>

  <SettingsField label={$t("study.settings.subtitles.outline_color_label")}>
    <SettingsColorPicker
      value={player.subtitles_outline_color ?? "#000000"}
      onChange={(v) => setPlayer("subtitles_outline_color", v)}
    />
  </SettingsField>

  <SettingsField label={$t("study.settings.subtitles.opacity_label")} valueDisplay={`${player.subtitles_opacity ?? 100}%`}>
    <SettingsSlider
      value={player.subtitles_opacity ?? 100}
      min={0}
      max={100}
      step={5}
      onChange={(v) => setPlayer("subtitles_opacity", v)}
    />
  </SettingsField>

  <SettingsField label={$t("study.settings.subtitles.font_label")}>
    <SettingsSelect
      value={player.subtitles_font ?? "system"}
      options={fontOptions}
      onChange={(v) => setPlayer("subtitles_font", v)}
    />
  </SettingsField>

  <SettingsField label={$t("study.settings.subtitles.bold_label")}>
    <SettingsToggle
      value={player.subtitles_bold ?? false}
      onChange={(v) => setPlayer("subtitles_bold", v)}
      ariaLabel={$t("study.settings.subtitles.bold_aria")}
    />
  </SettingsField>

  <SettingsField
    label={$t("study.settings.subtitles.ass_style_label")}
    description={$t("study.settings.subtitles.ass_style_desc")}
  >
    <SettingsToggle
      value={player.ass_subtitles_styling ?? true}
      onChange={(v) => setPlayer("ass_subtitles_styling", v)}
      ariaLabel={$t("study.settings.subtitles.ass_style_aria")}
    />
  </SettingsField>
</section>

<style>
  .tab {
    display: flex;
    flex-direction: column;
  }

  .preview-block {
    margin-bottom: 16px;
  }
</style>
