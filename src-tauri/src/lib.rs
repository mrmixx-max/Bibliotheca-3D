// Bibliotheca 3D — native desktop shell.
//
// The reader itself is the same React app; this layer adds what a browser
// cannot do: a native file picker, direct file reads for drag-and-drop, saving
// exports to a chosen path, and a real menu bar with accelerators.

mod menu;

use std::fs;
use std::path::PathBuf;

use serde::Serialize;

/// Result of reading an EPUB from disk. The bytes travel to the webview as a
/// regular Vec<u8>, which Tauri maps onto a JS Uint8Array.
#[derive(Serialize)]
pub struct EpubPayload {
    pub name: String,
    pub path: String,
    pub bytes: Vec<u8>,
}

/// Reads an EPUB the user picked or dropped. Returns a clear error instead of
/// panicking so the UI can show something useful.
#[tauri::command]
fn read_epub(path: String) -> Result<EpubPayload, String> {
    let p = PathBuf::from(&path);

    let meta = fs::metadata(&p).map_err(|e| format!("Datei nicht lesbar: {e}"))?;
    if !meta.is_file() {
        return Err("Der Pfad ist keine Datei.".into());
    }
    // Guard against handing a multi-gigabyte file to the webview.
    const MAX_EPUB: u64 = 512 * 1024 * 1024;
    if meta.len() > MAX_EPUB {
        return Err(format!(
            "Datei zu groß ({:.1} MB). EPUBs über 512 MB werden nicht unterstützt.",
            meta.len() as f64 / 1_048_576.0
        ));
    }

    let bytes = fs::read(&p).map_err(|e| format!("Lesefehler: {e}"))?;
    let name = p
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "Unbenannt.epub".into());

    Ok(EpubPayload {
        name,
        path: p.to_string_lossy().to_string(),
        bytes,
    })
}

/// Writes a generated file (e.g. the standalone HTML export) to an explicit
/// path, so the user controls where it lands rather than the download folder.
#[tauri::command]
fn save_file(path: String, contents: String) -> Result<String, String> {
    let p = PathBuf::from(&path);
    if let Some(dir) = p.parent() {
        fs::create_dir_all(dir).map_err(|e| format!("Ordner nicht anlegbar: {e}"))?;
    }
    fs::write(&p, contents).map_err(|e| format!("Schreibfehler: {e}"))?;
    Ok(p.to_string_lossy().to_string())
}

/// App version, shown in the UI without a separate build-time injection.
#[tauri::command]
fn app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let handle = app.handle().clone();
            let built = menu::build_menu(&handle)?;
            app.set_menu(built)?;
            Ok(())
        })
        .on_menu_event(|app, event| {
            menu::handle_menu_event(app, event.id().as_ref());
        })
        .invoke_handler(tauri::generate_handler![
            read_epub,
            save_file,
            app_version
        ])
        .run(tauri::generate_context!())
        .expect("error while running Bibliotheca 3D");
}
