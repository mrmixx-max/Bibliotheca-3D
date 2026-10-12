/**
 * Desktop bridge.
 *
 * The reader runs both in a browser (npm run dev) and inside the Tauri shell.
 * Everything platform-specific funnels through here so components never branch
 * on the environment themselves.
 *
 * In the browser the file input and the download anchor are used; in the
 * desktop build the native dialog and a real file write are used instead.
 */

type TauriCore = {
  invoke: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
};

type TauriDialog = {
  open: (options?: Record<string, unknown>) => Promise<string | string[] | null>;
  save: (options?: Record<string, unknown>) => Promise<string | null>;
};

/** True when running inside the Tauri desktop shell. */
export function isDesktop(): boolean {
  const g = globalThis as unknown as { __TAURI_INTERNALS__?: unknown };
  return typeof g.__TAURI_INTERNALS__ !== 'undefined';
}

async function getCore(): Promise<TauriCore> {
  const mod = await import('@tauri-apps/api/core');
  return mod as unknown as TauriCore;
}

async function getDialog(): Promise<TauriDialog> {
  const mod = await import('@tauri-apps/plugin-dialog');
  return mod as unknown as TauriDialog;
}

export type OpenedEpub = { name: string; path: string; bytes: Uint8Array };

/**
 * Asks the user for an EPUB and returns its bytes.
 * Returns null when the user cancels.
 */
export async function pickEpubFile(): Promise<OpenedEpub | null> {
  const dialog = await getDialog();
  const selected = await dialog.open({
    multiple: false,
    directory: false,
    title: 'EPUB auswählen',
    filters: [{ name: 'EPUB-Bücher', extensions: ['epub'] }]
  });

  if (!selected) return null;
  const path = Array.isArray(selected) ? selected[0] : selected;
  if (!path) return null;

  const tauri = await getCore();
  return tauri.invoke<OpenedEpub>('read_epub', { path });
}

/**
 * Reads an EPUB from a path that is already known (native drag & drop).
 * Returns the raw bytes.
 */
export async function pickEpubBytes(path: string): Promise<Uint8Array | null> {
  const tauri = await getCore();
  const payload = await tauri.invoke<OpenedEpub>('read_epub', { path });
  return payload?.bytes ?? null;
}

/**
 * Asks where to save a generated file and writes it.
 * Returns the written path, or null when the user cancels.
 */
export async function saveTextFile(
  suggestedName: string,
  contents: string
): Promise<string | null> {
  const dialog = await getDialog();
  const path = await dialog.save({
    title: 'Speichern unter',
    defaultPath: suggestedName,
    filters: [{ name: 'HTML-Datei', extensions: ['html'] }]
  });

  if (!path) return null;
  const tauri = await getCore();
  return tauri.invoke<string>('save_file', { path, contents });
}

/** App version from the Rust side; empty string in the browser. */
export async function desktopVersion(): Promise<string> {
  if (!isDesktop()) return '';
  try {
    const tauri = await getCore();
    return await tauri.invoke<string>('app_version');
  } catch {
    return '';
  }
}
