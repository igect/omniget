import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const locales = ['en', 'pt', 'es', 'fr', 'it', 'ru', 'el', 'ja', 'zh', 'zh-TW'];
const i18nDir = join(root, 'src', 'lib', 'i18n');

const enKeys = {
  telegram: {
    account_panel: {
      title: "Telegram Accounts",
      subtitle: "Save and switch between multiple sessions.",
      active_account: "Active account",
      active_badge: "Active",
      local_session: "Local session",
      save_as_profile: "Save as profile",
      saved_profiles: "Saved profiles",
      no_profiles: "No profiles saved yet.",
      no_profiles_desc: "Save your current session before logging out \u2014 so you can come back to it later without logging in again.",
      rename: "Rename",
      activate: "Activate",
      activate_and_restart: "Activate & restart",
      activating: "Activating...",
      remove: "Remove",
      removing: "Removing...",
      remove_profile: "Remove profile",
      backups: "Backups",
      create_backup: "Create backup now",
      no_backups: "No backups. Create one before making important changes to your session.",
      save_dialog_title: "Save current account as profile",
      save_dialog_desc: "Create a name to recognize this account later (e.g. \"Personal\", \"Work\").",
      profile_name_placeholder: "Profile name",
      saving: "Saving...",
      save_profile: "Save profile",
      activate_dialog_title: 'Activate profile "{name}"?',
      activate_dialog_desc: "Your current session will be preserved as an automatic backup. The app needs to restart to complete the switch.",
      cancel: "Cancel",
      remove_dialog_title: 'Remove profile "{name}"?',
      remove_dialog_warning: "This profile\u2019s session will be permanently deleted. You\u2019ll need to log in again to access this account.",
      account_saved: "Account '{name}' saved",
      session_activated: "Session activated. Restart the app to enter this account.",
      profile_removed: "Profile removed",
      created_prefix: "created ",
      manage_aria: "Manage accounts",
      close_aria: "Close",
      remove_aria: "Remove",
      ok: "OK",
      create_backup_aria: "Create backup",
      switching: "Switching...",
      saved_count: "{{count}} saved",
    },
    channel_drawer: {
      title: "Channel info",
      left_channel: "You left the channel",
      left_chat: "You left the chat",
      history_deleted_all: "History deleted for everyone",
      history_cleared: "History cleared",
      report_sent: "Report sent",
      you: "You",
      user: "User {{id}}",
      unmute: "Unmute notifications",
      mute: "Mute",
      mark_read: "Mark as read",
      actions: "Actions",
      clear_history: "Clear history",
      leave_channel: "Leave channel",
      leave_chat: "Leave chat",
      delete_channel: "Delete channel",
      report: "Report",
      leave_confirm_body: "You will no longer receive messages from <strong>{{title}}</strong>.",
      delete_confirm_warning: "\u26a0\ufe0f Irreversible. All members lose access to the content.",
      clear_confirm_body: 'How do you want to clear <strong>{{title}}</strong>?',
      clear_for_me: "Clear for me",
      clear_for_all: "Clear for everyone",
      report_review_note: "Telegram will review the report.",
      sending: "Sending...",
      send_report: "Send report",
      confirm_aria: "Confirm action",
    },
    clone_wizard: {
      title: "Clone channels",
      subtitle: "Clone messages from a source channel into a new one.",
      completed: "Completed",
      sessions: 'Sessions ({{count}})',
      auto_create_desc: "Creates automatically. You become the owner.",
      advanced_options: "Advanced options",
      max_messages: "Maximum messages",
      max_messages_desc: "Limit how many messages to clone. Leave empty for all.",
      no_sessions: "No clone sessions yet.",
      start_clone: "Start clone",
      cloning: "Cloning...",
      clone_done: "Clone completed",
      status_waiting: "Waiting",
      status_running: "Running",
      status_done: "Done",
      status_error: "Error",
      source_channel: "Source channel",
      target_channel: "Target channel",
      session_aria: "Clone session",
      cancel: "Cancel",
      close: "Close",
    },
    perf_panel: {
      title: "Performance",
      max_threads: "Max threads",
      max_threads_desc: "Telegram charges 1 MiB per chunk. More threads = faster downloads on large files, but may trigger FLOOD_WAIT on slow connections. Default: 8.",
      daily_quota: "Daily quota",
      daily_quota_desc: "Maximum bytes to download per day across all Telegram downloads.",
      auto_sync: "Auto-sync",
      auto_sync_desc: "Every N minutes the plugin refreshes the channel cache in background \u2014 avoids CHANNEL_INVALID errors when you open old chats.",
      sync_interval: "Sync interval (min)",
      last_sync: 'Last: {{time}}',
      not_synced_yet: "Not synced yet.",
      check_now: "Check now",
      checking: "Checking...",
      limit_unlimited: "Unlimited",
      miB: "MiB",
      thread_count: "{{n}} threads",
      reset_defaults: "Reset to defaults",
      saving: "Saving...",
      saved: "Saved",
      max_threads_hint: "More threads = faster on big files, but higher risk of FLOOD_WAIT.",
    },
    sync_indicator: {
      ago_min: "{{n}} min ago",
      ago_hours: "{{n}}h ago",
      ago_days: "{{n}}d ago",
      auto_sync_hint: "Auto-sync every {{n}} min \u2014 click to force now",
      sync_disabled_hint: "Sync disabled \u2014 click to force now",
      status_aria: "Sync status",
      synced_just_now: "Synced just now",
      sync_now: "Sync now",
      syncing: "Syncing...",
      last_sync: "Last sync: {{time}}",
      never_synced: "Never synced",
    },
    transfer_panel: {
      title: "Transfers",
      subtitle: "{{active}} active \u00b7 {{history}} in history",
      history: "History",
      empty: "No recent transfers.",
      done: "Completed",
      error: "Error",
      cancelling: "Cancelling...",
      cancel: "Cancel",
      retry: "Retry",
      open_file: "Open file",
      open_folder: "Open folder",
      status_downloading: "Downloading",
      status_queued: "Queued",
      status_paused: "Paused",
      progress: "{{percent}}% \u00b7 {{downloaded}} / {{total}} \u00b7 {{speed}}",
      paused: "Paused",
      view_panel: "View transfers",
    },
  }
};

const ptKeys = JSON.parse(JSON.stringify(enKeys));
ptKeys.telegram.account_panel.title = "Contas Telegram";
ptKeys.telegram.account_panel.subtitle = "Salve e alterne entre m\u00faltiplas sess\u00f5es.";
ptKeys.telegram.account_panel.active_account = "Conta ativa";
ptKeys.telegram.account_panel.active_badge = "Ativa";
ptKeys.telegram.account_panel.local_session = "Sess\u00e3o local";
ptKeys.telegram.account_panel.save_as_profile = "Salvar como perfil";
ptKeys.telegram.account_panel.saved_profiles = "Perfis salvos";
ptKeys.telegram.account_panel.no_profiles = "Nenhum perfil salvo ainda.";
ptKeys.telegram.account_panel.no_profiles_desc = "Salve sua sess\u00e3o atual antes de fazer logout \u2014 assim voc\u00ea consegue voltar pra ela depois sem refazer login.";
ptKeys.telegram.account_panel.rename = "Renomear";
ptKeys.telegram.account_panel.activate = "Ativar";
ptKeys.telegram.account_panel.activate_and_restart = "Ativar e reiniciar";
ptKeys.telegram.account_panel.activating = "Ativando...";
ptKeys.telegram.account_panel.remove = "Remover";
ptKeys.telegram.account_panel.removing = "Removendo...";
ptKeys.telegram.account_panel.remove_profile = "Remover perfil";
ptKeys.telegram.account_panel.backups = "Backups";
ptKeys.telegram.account_panel.create_backup = "Criar backup agora";
ptKeys.telegram.account_panel.no_backups = "Nenhum backup. Fa\u00e7a um antes de mudan\u00e7as importantes na sess\u00e3o.";
ptKeys.telegram.account_panel.save_dialog_title = "Salvar conta atual como perfil";
ptKeys.telegram.account_panel.save_dialog_desc = "Crie um nome pra reconhecer essa conta depois (ex: \"Pessoal\", \"Trabalho\").";
ptKeys.telegram.account_panel.profile_name_placeholder = "Nome do perfil";
ptKeys.telegram.account_panel.saving = "Salvando...";
ptKeys.telegram.account_panel.save_profile = "Salvar perfil";
ptKeys.telegram.account_panel.activate_dialog_title = 'Ativar perfil "{name}"?';
ptKeys.telegram.account_panel.activate_dialog_desc = "Sua sess\u00e3o atual ser\u00e1 preservada como backup autom\u00e1tico. O app precisa ser reiniciado para concluir a troca.";
ptKeys.telegram.account_panel.cancel = "Cancelar";
ptKeys.telegram.account_panel.remove_dialog_title = 'Remover perfil "{name}"?';
ptKeys.telegram.account_panel.remove_dialog_warning = "A sess\u00e3o deste perfil ser\u00e1 apagada permanentemente. Voc\u00ea precisar\u00e1 refazer login pra acessar essa conta novamente.";
ptKeys.telegram.account_panel.account_saved = "Conta '{name}' salva";
ptKeys.telegram.account_panel.session_activated = "Sess\u00e3o ativada. Reinicie o app pra entrar nesta conta.";
ptKeys.telegram.account_panel.profile_removed = "Perfil removido";
ptKeys.telegram.account_panel.created_prefix = "criado ";
ptKeys.telegram.account_panel.manage_aria = "Gerenciar contas";
ptKeys.telegram.account_panel.close_aria = "Fechar";
ptKeys.telegram.account_panel.remove_aria = "Remover";
ptKeys.telegram.account_panel.ok = "OK";
ptKeys.telegram.account_panel.create_backup_aria = "Criar backup";
ptKeys.telegram.account_panel.switching = "Alternando...";
ptKeys.telegram.account_panel.saved_count = "{{count}} salvo(s)";

ptKeys.telegram.channel_drawer.title = "Informa\u00e7\u00f5es do canal";
ptKeys.telegram.channel_drawer.left_channel = "Voc\u00ea saiu do canal";
ptKeys.telegram.channel_drawer.left_chat = "Voc\u00ea saiu do chat";
ptKeys.telegram.channel_drawer.history_deleted_all = "Hist\u00f3rico apagado pra todos";
ptKeys.telegram.channel_drawer.history_cleared = "Hist\u00f3rico limpo";
ptKeys.telegram.channel_drawer.report_sent = "Den\u00fancia enviada";
ptKeys.telegram.channel_drawer.you = "Voc\u00ea";
ptKeys.telegram.channel_drawer.user = "Usu\u00e1rio {{id}}";
ptKeys.telegram.channel_drawer.unmute = "Reativar notifica\u00e7\u00f5es";
ptKeys.telegram.channel_drawer.mute = "Silenciar";
ptKeys.telegram.channel_drawer.mark_read = "Marcar como lido";
ptKeys.telegram.channel_drawer.actions = "A\u00e7\u00f5es";
ptKeys.telegram.channel_drawer.clear_history = "Limpar hist\u00f3rico";
ptKeys.telegram.channel_drawer.leave_channel = "Sair do canal";
ptKeys.telegram.channel_drawer.leave_chat = "Sair do chat";
ptKeys.telegram.channel_drawer.delete_channel = "Deletar canal";
ptKeys.telegram.channel_drawer.report = "Denunciar";
ptKeys.telegram.channel_drawer.leave_confirm_body = "Voc\u00ea n\u00e3o receber\u00e1 mais mensagens de <strong>{{title}}</strong>.";
ptKeys.telegram.channel_drawer.delete_confirm_warning = "\u26a0\ufe0f Irrevers\u00edvel. Todos os membros perdem acesso ao conte\u00fado.";
ptKeys.telegram.channel_drawer.clear_confirm_body = 'Como voc\u00ea quer limpar <strong>{{title}}</strong>?';
ptKeys.telegram.channel_drawer.clear_for_me = "Limpar pra mim";
ptKeys.telegram.channel_drawer.clear_for_all = "Limpar pra todos";
ptKeys.telegram.channel_drawer.report_review_note = "Telegram revisar\u00e1 a den\u00fancia.";
ptKeys.telegram.channel_drawer.sending = "Enviando...";
ptKeys.telegram.channel_drawer.send_report = "Enviar den\u00fancia";
ptKeys.telegram.channel_drawer.confirm_aria = "Confirmar a\u00e7\u00e3o";

ptKeys.telegram.clone_wizard.title = "Clonar canais";
ptKeys.telegram.clone_wizard.subtitle = "Clone mensagens de um canal de origem para um novo.";
ptKeys.telegram.clone_wizard.completed = "Conclu\u00eddo";
ptKeys.telegram.clone_wizard.sessions = 'Sess\u00f5es ({{count}})';
ptKeys.telegram.clone_wizard.auto_create_desc = "Cria automaticamente. Voc\u00ea fica como dono.";
ptKeys.telegram.clone_wizard.advanced_options = "Op\u00e7\u00f5es avan\u00e7adas";
ptKeys.telegram.clone_wizard.max_messages = "M\u00e1ximo de mensagens";
ptKeys.telegram.clone_wizard.max_messages_desc = "Limite quantas mensagens clonar. Deixe vazio para todas.";
ptKeys.telegram.clone_wizard.no_sessions = "Nenhuma sess\u00e3o de clone ainda.";
ptKeys.telegram.clone_wizard.start_clone = "Iniciar clone";
ptKeys.telegram.clone_wizard.cloning = "Clonando...";
ptKeys.telegram.clone_wizard.clone_done = "Clone conclu\u00eddo";
ptKeys.telegram.clone_wizard.status_waiting = "Aguardando";
ptKeys.telegram.clone_wizard.status_running = "Executando";
ptKeys.telegram.clone_wizard.status_done = "Conclu\u00eddo";
ptKeys.telegram.clone_wizard.status_error = "Erro";
ptKeys.telegram.clone_wizard.source_channel = "Canal de origem";
ptKeys.telegram.clone_wizard.target_channel = "Canal de destino";
ptKeys.telegram.clone_wizard.session_aria = "Sess\u00e3o de clone";
ptKeys.telegram.clone_wizard.cancel = "Cancelar";
ptKeys.telegram.clone_wizard.close = "Fechar";

ptKeys.telegram.perf_panel.title = "Desempenho";
ptKeys.telegram.perf_panel.max_threads = "M\u00e1ximo de threads";
ptKeys.telegram.perf_panel.max_threads_desc = "Telegram cobra 1 MiB por chunk. Mais threads = downloads mais r\u00e1pidos em arquivos grandes, mas pode disparar FLOOD_WAIT em conex\u00f5es lentas. Padr\u00e3o: 8.";
ptKeys.telegram.perf_panel.daily_quota = "Quota di\u00e1ria";
ptKeys.telegram.perf_panel.daily_quota_desc = "M\u00e1ximo de bytes para baixar por dia em todos os downloads do Telegram.";
ptKeys.telegram.perf_panel.auto_sync = "Sincroniza\u00e7\u00e3o autom\u00e1tica";
ptKeys.telegram.perf_panel.auto_sync_desc = "A cada N minutos o plugin atualiza o cache de canais em background \u2014 evita erros CHANNEL_INVALID quando voc\u00ea abre chats antigos.";
ptKeys.telegram.perf_panel.sync_interval = "Intervalo de sincroniza\u00e7\u00e3o (min)";
ptKeys.telegram.perf_panel.last_sync = "\u00daltima: {{time}}";
ptKeys.telegram.perf_panel.not_synced_yet = "Ainda n\u00e3o sincronizou.";
ptKeys.telegram.perf_panel.check_now = "Verificar agora";
ptKeys.telegram.perf_panel.checking = "Verificando...";
ptKeys.telegram.perf_panel.limit_unlimited = "Ilimitado";
ptKeys.telegram.perf_panel.miB = "MiB";
ptKeys.telegram.perf_panel.thread_count = "{{n}} threads";
ptKeys.telegram.perf_panel.reset_defaults = "Restaurar padr\u00f5es";
ptKeys.telegram.perf_panel.saving = "Salvando...";
ptKeys.telegram.perf_panel.saved = "Salvo";
ptKeys.telegram.perf_panel.max_threads_hint = "Mais threads = mais r\u00e1pido em arquivos grandes, mas maior risco de FLOOD_WAIT.";

ptKeys.telegram.sync_indicator.ago_min = "h\u00e1 {{n}} min";
ptKeys.telegram.sync_indicator.ago_hours = "h\u00e1 {{n}}h";
ptKeys.telegram.sync_indicator.ago_days = "h\u00e1 {{n}}d";
ptKeys.telegram.sync_indicator.auto_sync_hint = "Sincroniza\u00e7\u00e3o autom\u00e1tica a cada {{n}} min \u2014 clique para for\u00e7ar agora";
ptKeys.telegram.sync_indicator.sync_disabled_hint = "Sincroniza\u00e7\u00e3o desativada \u2014 clique para for\u00e7ar agora";
ptKeys.telegram.sync_indicator.status_aria = "Status de sincroniza\u00e7\u00e3o";
ptKeys.telegram.sync_indicator.synced_just_now = "Sincronizado agora";
ptKeys.telegram.sync_indicator.sync_now = "Sincronizar agora";
ptKeys.telegram.sync_indicator.syncing = "Sincronizando...";
ptKeys.telegram.sync_indicator.last_sync = "\u00daltima sincroniza\u00e7\u00e3o: {{time}}";
ptKeys.telegram.sync_indicator.never_synced = "Nunca sincronizou";

ptKeys.telegram.transfer_panel.title = "Transfer\u00eancias";
ptKeys.telegram.transfer_panel.subtitle = "{{active}} ativa(s) \u00b7 {{history}} no hist\u00f3rico";
ptKeys.telegram.transfer_panel.history = "Hist\u00f3rico";
ptKeys.telegram.transfer_panel.empty = "Sem transfer\u00eancias recentes.";
ptKeys.telegram.transfer_panel.done = "Conclu\u00eddo";
ptKeys.telegram.transfer_panel.error = "Erro";
ptKeys.telegram.transfer_panel.cancelling = "Cancelando...";
ptKeys.telegram.transfer_panel.cancel = "Cancelar";
ptKeys.telegram.transfer_panel.retry = "Tentar novamente";
ptKeys.telegram.transfer_panel.open_file = "Abrir arquivo";
ptKeys.telegram.transfer_panel.open_folder = "Abrir pasta";
ptKeys.telegram.transfer_panel.status_downloading = "Baixando";
ptKeys.telegram.transfer_panel.status_queued = "Na fila";
ptKeys.telegram.transfer_panel.status_paused = "Pausado";
ptKeys.telegram.transfer_panel.progress = "{{percent}}% \u00b7 {{downloaded}} / {{total}} \u00b7 {{speed}}";
ptKeys.telegram.transfer_panel.paused = "Pausado";
ptKeys.telegram.transfer_panel.view_panel = "Ver transfer\u00eancias";

function mergeDeep(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeDeep(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

for (const locale of locales) {
  const filePath = join(i18nDir, `${locale}.json`);
  let raw = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);

  if (!data.study) {
    console.error(`No "study" key in ${locale}.json`);
    continue;
  }

  // Decide which key set to use
  let keys;
  if (locale === 'pt') {
    keys = ptKeys;
  } else {
    keys = enKeys;
  }

  data.study.telegram = keys.telegram;

  const output = JSON.stringify(data, null, 2) + '\n';
  writeFileSync(filePath, output, 'utf-8');
  console.log(`Updated ${locale}.json`);
}

console.log('\nDone. All 10 locale files updated.');
