// Bibliotheca 3D — native desktop shell.
//
// The reader itself is the same React app; this layer adds what a browser
// cannot do: a native file picker, direct file reads for drag-and-drop, saving
// exports to a chosen path, and a real menu bar with accelerators.

mod menu;

use std::fs;
use std::path::PathBuf;
use std::fs::OpenOptions;
use std::io::Write;
use walkdir::WalkDir;

use serde::Serialize;
use tauri::Manager;

/// Result of reading an EPUB from disk. The bytes travel to the webview as a
/// regular Vec<u8>, which Tauri maps onto a JS Uint8Array.
#[derive(Serialize)]
pub struct EpubPayload {
    pub name: String,
    pub path: String,
    pub bytes: Vec<u8>,
}

fn log_to_file(msg: &str) {
    let log_path = PathBuf::from(r"C:\Users\webma\bibliotheca-3d-debug.log");
    if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(log_path) {
        let _ = writeln!(file, "{}", msg);
    }
}

/// Reads an EPUB the user picked or dropped. Returns a clear error instead of
/// panicking so the UI can show something useful.
#[tauri::command]
fn read_epub(path: String) -> Result<EpubPayload, String> {
    let msg = format!("[read_epub] called with path: {}", path);
    eprintln!("{}", msg);
    log_to_file(&msg);
    
    let p = PathBuf::from(&path);
    let msg = format!("[read_epub] resolved path: {:?}", p);
    eprintln!("{}", msg);
    log_to_file(&msg);
    
    let msg = format!("[read_epub] path exists: {}", p.exists());
    eprintln!("{}", msg);
    log_to_file(&msg);

    let meta = fs::metadata(&p).map_err(|e| {
        let err = format!("Datei nicht lesbar: {e}");
        eprintln!("[read_epub] metadata error: {}", err);
        log_to_file(&format!("[read_epub] metadata error: {}", err));
        err
    })?;
    let msg = format!("[read_epub] metadata ok: is_file={}, len={} bytes", meta.is_file(), meta.len());
    eprintln!("{}", msg);
    log_to_file(&msg);
    
    if !meta.is_file() {
        eprintln!("[read_epub] not a file");
        log_to_file("[read_epub] not a file");
        return Err("Der Pfad ist keine Datei.".into());
    }
    // Guard against handing a multi-gigabyte file to the webview.
    const MAX_EPUB: u64 = 512 * 1024 * 1024;
    if meta.len() > MAX_EPUB {
        let err = format!(
            "Datei zu groß ({:.1} MB). EPUBs über 512 MB werden nicht unterstützt.",
            meta.len() as f64 / 1_048_576.0
        );
        eprintln!("[read_epub] size error: {}", err);
        log_to_file(&format!("[read_epub] size error: {}", err));
        return Err(err);
    }

    let bytes = fs::read(&p).map_err(|e| {
        let err = format!("Lesefehler: {e}");
        eprintln!("[read_epub] read error: {}", err);
        log_to_file(&format!("[read_epub] read error: {}", err));
        err
    })?;
    let msg = format!("[read_epub] read {} bytes", bytes.len());
    eprintln!("{}", msg);
    log_to_file(&msg);
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

/// Scans a folder recursively for EPUB files and reads them all.
#[tauri::command]
fn scan_epub_folder(folder_path: String) -> Result<Vec<EpubPayload>, String> {
    let msg = format!("[scan_epub_folder] called with path: {}", folder_path);
    eprintln!("{}", msg);
    log_to_file(&msg);

    let p = PathBuf::from(&folder_path);
    if !p.exists() || !p.is_dir() {
        let err = "Der angegebene Pfad ist kein gültiger Ordner.".to_string();
        eprintln!("[scan_epub_folder] {}", err);
        log_to_file(&format!("[scan_epub_folder] {}", err));
        return Err(err);
    }

    let mut results = Vec::new();
    for entry in WalkDir::new(&p).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.is_file() {
            if let Some(ext) = path.extension() {
                if ext.to_string_lossy().to_lowercase() == "epub" {
                    let msg = format!("[scan_epub_folder] found EPUB: {:?}", path);
                    eprintln!("{}", msg);
                    log_to_file(&msg);
                    
                    match read_epub(path.to_string_lossy().to_string()) {
                        Ok(payload) => results.push(payload),
                        Err(e) => {
                            let msg = format!("[scan_epub_folder] failed to read {:?}: {}", path, e);
                            eprintln!("{}", msg);
                            log_to_file(&msg);
                            // Continue with other files
                        }
                    }
                }
            }
        }
    }

    let msg = format!("[scan_epub_folder] total found: {}", results.len());
    eprintln!("{}", msg);
    log_to_file(&msg);
    Ok(results)
}

/// Toggles fullscreen on the main window.
#[tauri::command]
fn toggle_fullscreen(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        let is_fullscreen = window.is_fullscreen().map_err(|e| e.to_string())?;
        window.set_fullscreen(!is_fullscreen).map_err(|e| e.to_string())?;
    }
    Ok(())
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
                log_to_file("[setup] starting");
                let handle = app.handle().clone();
                let built = menu::build_menu(&handle)?;
                app.set_menu(built)?;
                log_to_file("[setup] menu built");
                Ok(())
            })
        .on_menu_event(|app, event| {
            menu::handle_menu_event(app, event.id().as_ref());
        })
        .invoke_handler(tauri::generate_handler![
                    read_epub,
                    scan_epub_folder,
                    toggle_fullscreen,
                    save_file,
                    app_version
                ])
                .run(tauri::generate_context!())
                .expect("error while running Bibliotheca 3D");
}
