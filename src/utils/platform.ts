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
 * Asks the user for one or more EPUBs and returns their bytes.
 * Returns null when the user cancels.
 */
export async function pickEpubFile(multiple = false): Promise<OpenedEpub[] | null> {
  console.log('[pickEpubFile] called, isDesktop:', isDesktop(), 'multiple:', multiple);
  const dialog = await getDialog();
  const selected = await dialog.open({
    multiple,
    directory: false,
    title: multiple ? 'EPUBs auswählen' : 'EPUB auswählen',
    filters: [{ name: 'EPUB-Bücher', extensions: ['epub'] }]
  });

  console.log('[pickEpubFile] dialog result:', selected);
  if (!selected) return null;
  const paths = Array.isArray(selected) ? selected : [selected];
  if (!paths.length) return null;

  const tauri = await getCore();
  const results: OpenedEpub[] = [];
  for (const path of paths) {
    console.log('[pickEpubFile] invoking read_epub with path:', path);
    try {
      const result = await tauri.invoke<OpenedEpub>('read_epub', { path });
      console.log('[pickEpubFile] read_epub result:', result);
      results.push(result);
    } catch (err) {
      console.error('[pickEpubFile] read_epub error for', path, ':', err);
      throw err;
    }
  }
  return results;
}

/**
 * Asks the user for a folder and returns all EPUB files found recursively.
 * Returns null when the user cancels.
 */
export async function pickEpubFolder(): Promise<OpenedEpub[] | null> {
  console.log('[pickEpubFolder] called, isDesktop:', isDesktop());
  if (!isDesktop()) return null;
  
  const dialog = await getDialog();
  const selected = await dialog.open({
    multiple: false,
    directory: true,
    title: 'Ordner mit EPUBs auswählen'
  });

  console.log('[pickEpubFolder] dialog result:', selected);
  if (!selected) return null;
  const folderPath = Array.isArray(selected) ? selected[0] : selected;
  if (!folderPath) return null;

  console.log('[pickEpubFolder] invoking scan_epub_folder with path:', folderPath);
  const tauri = await getCore();
  try {
    const results = await tauri.invoke<OpenedEpub[]>('scan_epub_folder', { folderPath });
    console.log('[pickEpubFolder] scan_epub_folder result:', results);
    return results;
  } catch (err) {
    console.error('[pickEpubFolder] scan_epub_folder error:', err);
    throw err;
  }
}

/**
 * Reads an EPUB from a path that is already known (native drag & drop).
 * Returns the raw bytes.
 */
export async function pickEpubBytes(path: string): Promise<Uint8Array | null> {
  console.log('[pickEpubBytes] called with path:', path);
  const tauri = await getCore();
  try {
    const payload = await tauri.invoke<OpenedEpub>('read_epub', { path });
    console.log('[pickEpubBytes] read_epub result:', payload);
    return payload?.bytes ?? null;
  } catch (err) {
    console.error('[pickEpubBytes] read_epub error:', err);
    throw err;
  }
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

/** Toggle fullscreen on the main window. */
export async function toggleFullscreen(): Promise<void> {
  if (!isDesktop()) return;
  const tauri = await getCore();
  try {
    await tauri.invoke('toggle_fullscreen');
  } catch (err) {
    console.error('[toggleFullscreen] error:', err);
  }
}
