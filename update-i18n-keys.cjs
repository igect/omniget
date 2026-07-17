const fs = require('fs');
const path = require('path');

const LOCALE_DIR = 'src/lib/i18n';

// All new keys organized by file source
const NEW_KEYS = {
  en: {
    // player-store.svelte.ts
    player_error_load_audio: "Error loading audio",
    player_error_code_aborted: "aborted",
    player_error_code_network: "network failed",
    player_error_code_decode: "decoding failed",
    player_error_code_format: "unsupported format",
    player_fallback_title: "Music",
    player_discord_local_library: "Local library",
    player_history_fallback_title: "Music",
    player_error_soundcloud_resolver: "SoundCloud resolver not configured",
    player_error_youtube_no_video_id: "video id missing — track removed",
    player_error_spotify_uri_missing: "track removed: spotify URI missing",

    // soundcloud-store.svelte.ts
    sc_login_webview_title: "Sign in with SoundCloud",
    sc_error_no_login: "Could not capture your login. Try again.",
    sc_error_no_id: "Track missing soundcloud_id",
    sc_error_no_url: "SoundCloud did not return a URL",

    // spotify-sdk.svelte.ts
    spotify_error_no_widevine: "Widevine DRM is not available on this system. Native Spotify playback won't work — use Phase 1 (transfer to another device).",
    spotify_error_sdk_not_exposed: "Spotify SDK loaded but Spotify global was not exposed",
    spotify_error_premium_required: "Spotify Premium is required ({{message}})",
    spotify_error_sdk_load_failed: "Failed to load Spotify SDK (offline?)",

    // spotify-store.svelte.ts
    spotify_error_no_metadata: "Track missing metadata to resolve on YouTube",
    spotify_error_no_youtube_url: "YouTube did not return a URL",

    // DownloadsDock.svelte
    dock_status_failed: "Failed",
    dock_status_waiting: "Waiting…",
    dock_status_preparing: "Preparing…",
    dock_status_downloading: "Downloading {{current}}/{{total}}",
    dock_status_saving: "Saving track…",
    dock_status_skipped: "Already have it",
    dock_ok_count: "{{count}} ok",
    dock_fail_count: "{{count}} failed",
    dock_status_done: "Done",
    dock_retry_choose_folder: "Choose the folder again in the download button.",
    dock_aria_open_downloads: "Open downloads",
    dock_aria_close_downloads: "Close downloads",
    dock_title: "Downloads",
    dock_clear_finished: "Clear finished",
    dock_failed_one: "failed",
    dock_failed_many: "failed",
    dock_retry_all_title: "Retry all failed",
    dock_retry_all: "Retry all",
    dock_retry: "Retry",
    dock_retry_single: "Retry",
    dock_open_in_soundcloud: "Open in SoundCloud",
    dock_remove: "Remove",
    dock_downloads_count: "Downloads ({{count}})",

    // SoundCloudDownloadButton.svelte
    dl_btn_downloading: "Downloading — {{pct}}%",
    dl_btn_downloaded: "Downloaded",
    dl_btn_download: "Download",
    dl_btn_advanced_hint: "Download (Shift = advanced)",

    // SoundCloudDownloadDialog.svelte
    dl_dialog_choose_folder_first: "Choose a folder first",
    dl_dialog_saved_in_folder: "Done — saved in {{folder}} folder",
    dl_dialog_close: "Close",
    dl_dialog_how_to_save: "How to save?",
    dl_dialog_recommended: "Recommended · works everywhere",
    dl_dialog_lossless: "Lossless · large file",
    dl_dialog_advanced: "⚙ Advanced…",
    dl_dialog_other_codecs: "Other codecs",
    dl_dialog_source_label: "Source",
    dl_dialog_progressive_default: "Progressive MP3 128 (default)",
    dl_dialog_hq_aac: "HQ AAC ~256 (Go+)",
    dl_dialog_original_uploader: "Original from uploader (if allowed)",
    dl_dialog_where_to_save: "Where to save?",
    dl_dialog_choose_folder_placeholder: "Choose a folder…",
    dl_dialog_browse: "Browse…",
    dl_dialog_remember_settings: "Remember folder and format for next time",
    dl_dialog_cancel: "Cancel",
    dl_dialog_starting: "Starting…",
    dl_dialog_download: "Download",
  },

  pt: {
    player_error_load_audio: "Erro ao carregar áudio",
    player_error_code_aborted: "abortado",
    player_error_code_network: "rede falhou",
    player_error_code_decode: "decodificação falhou",
    player_error_code_format: "formato não suportado",
    player_fallback_title: "Música",
    player_discord_local_library: "Biblioteca local",
    player_history_fallback_title: "Música",
    player_error_soundcloud_resolver: "soundcloud resolver não configurado",
    player_error_youtube_no_video_id: "video id ausente — track removed",
    player_error_spotify_uri_missing: "track removed: spotify uri ausente",

    sc_login_webview_title: "Entrar com SoundCloud",
    sc_error_no_login: "Não capturei seu login. Tenta de novo.",
    sc_error_no_id: "Track sem soundcloud_id",
    sc_error_no_url: "SoundCloud nao retornou URL",

    spotify_error_no_widevine: "Widevine DRM não está disponível neste sistema. Spotify playback nativo não vai funcionar — use a Fase 1 (transfer pra outro device).",
    spotify_error_sdk_not_exposed: "SDK do Spotify carregou mas Spotify global não foi exposto",
    spotify_error_premium_required: "Spotify Premium é obrigatório ({{message}})",
    spotify_error_sdk_load_failed: "Falha ao carregar SDK do Spotify (offline?)",

    spotify_error_no_metadata: "Track sem metadata pra resolver no YouTube",
    spotify_error_no_youtube_url: "YouTube não retornou URL",

    dock_status_failed: "Falhou",
    dock_status_waiting: "Aguardando…",
    dock_status_preparing: "Preparando…",
    dock_status_downloading: "Baixando {{current}}/{{total}}",
    dock_status_saving: "Salvando faixa…",
    dock_status_skipped: "Já tinha",
    dock_ok_count: "{{count}} ok",
    dock_fail_count: "{{count}} falhou",
    dock_status_done: "Pronto",
    dock_retry_choose_folder: "Escolhe a pasta de novo no botão de baixar.",
    dock_aria_open_downloads: "Abrir downloads",
    dock_aria_close_downloads: "Fechar downloads",
    dock_title: "Downloads",
    dock_clear_finished: "Limpar concluídos",
    dock_failed_one: "falhou",
    dock_failed_many: "falharam",
    dock_retry_all_title: "Tentar todas falhadas",
    dock_retry_all: "Tentar todas",
    dock_retry: "Tentar",
    dock_retry_single: "Tentar de novo",
    dock_open_in_soundcloud: "Abrir no SoundCloud",
    dock_remove: "Remover",
    dock_downloads_count: "Downloads ({{count}})",

    dl_btn_downloading: "Baixando — {{pct}}%",
    dl_btn_downloaded: "Baixado",
    dl_btn_download: "Baixar",
    dl_btn_advanced_hint: "Baixar (Shift = avançado)",

    dl_dialog_choose_folder_first: "Escolhe uma pasta primeiro",
    dl_dialog_saved_in_folder: "Pronto — salvo na pasta {{folder}}",
    dl_dialog_close: "Fechar",
    dl_dialog_how_to_save: "Como salvar?",
    dl_dialog_recommended: "Recomendado · funciona em tudo",
    dl_dialog_lossless: "Sem perda · arquivo grande",
    dl_dialog_advanced: "⚙ Avançado…",
    dl_dialog_other_codecs: "Outros codecs",
    dl_dialog_source_label: "Fonte",
    dl_dialog_progressive_default: "Progressivo MP3 128 (padrão)",
    dl_dialog_hq_aac: "HQ AAC ~256 (Go+)",
    dl_dialog_original_uploader: "Original do uploader (se permitido)",
    dl_dialog_where_to_save: "Onde salvar?",
    dl_dialog_choose_folder_placeholder: "Escolhe uma pasta…",
    dl_dialog_browse: "Procurar…",
    dl_dialog_remember_settings: "Lembrar pasta e formato pra próxima",
    dl_dialog_cancel: "Cancelar",
    dl_dialog_starting: "Iniciando…",
    dl_dialog_download: "Baixar",
  },
};

// For non-en/pt locales, use English placeholders
const OTHER_LOCALES = ['es', 'fr', 'it', 'ru', 'el', 'ja', 'zh', 'zh-TW'];

function addOrUpdateKeys(existing, newKeys) {
  let changed = false;
  for (const [k, v] of Object.entries(newKeys)) {
    if (!(k in existing)) {
      existing[k] = v;
      changed = true;
    }
  }
  return changed;
}

// Process each locale
for (const locale of ['en', 'pt', ...OTHER_LOCALES]) {
  const filePath = path.join(LOCALE_DIR, `${locale}.json`);
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);

  if (!data.study) { console.log(`  ${locale}: no study section, skipping`); continue; }
  if (!data.study.music) { console.log(`  ${locale}: no study.music section, skipping`); continue; }

  const oldCount = Object.keys(data.study.music).length;

  if (locale === 'en') {
    addOrUpdateKeys(data.study.music, NEW_KEYS.en);
  } else if (locale === 'pt') {
    addOrUpdateKeys(data.study.music, NEW_KEYS.pt);
  } else {
    // Use English values as placeholders for all other locales
    addOrUpdateKeys(data.study.music, NEW_KEYS.en);
  }

  const newCount = Object.keys(data.study.music).length;
  console.log(`${locale}: ${oldCount} → ${newCount} keys (${newCount - oldCount} added)`);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

console.log('\nDone!');
