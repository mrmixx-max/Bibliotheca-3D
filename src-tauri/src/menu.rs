// Native application menu.
//
// A desktop app is expected to have a menu bar with real accelerators; the
// webview has no way to provide that, so it is defined here and forwarded to
// the frontend as events.

use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::{AppHandle, Emitter, Manager};

/// Builds the German menu bar and wires each item to a frontend event.
pub fn build_menu(app: &AppHandle) -> tauri::Result<Menu<tauri::Wry>> {
    let open = MenuItem::with_id(
        app,
        "open_epub",
        "EPUB öffnen…",
        true,
        Some("CmdOrCtrl+O"),
    )?;
    let open_multiple = MenuItem::with_id(
        app,
        "open_multiple_epubs",
        "Mehrere EPUBs öffnen…",
        true,
        Some("CmdOrCtrl+Shift+O"),
    )?;
    let import_folder = MenuItem::with_id(
        app,
        "import_folder",
        "Ordner importieren…",
        true,
        Some("CmdOrCtrl+I"),
    )?;
    let export = MenuItem::with_id(
        app,
        "export_html",
        "Als HTML exportieren…",
        true,
        Some("CmdOrCtrl+E"),
    )?;
    let library = MenuItem::with_id(app, "open_library", "Bibliothek", true, Some("CmdOrCtrl+L"))?;
    let search = MenuItem::with_id(app, "open_search", "Volltextsuche", true, Some("CmdOrCtrl+F"))?;
    let bookmarks = MenuItem::with_id(
        app,
        "open_bookmarks",
        "Lesezeichen & Markierungen",
        true,
        Some("CmdOrCtrl+B"),
    )?;
    let settings = MenuItem::with_id(
        app,
        "open_settings",
        "Atmosphäre & Einstellungen",
        true,
        Some("CmdOrCtrl+,"),
    )?;
    let typography =
        MenuItem::with_id(app, "open_typography", "Typografie", true, Some("CmdOrCtrl+T"))?;
    let speed = MenuItem::with_id(
        app,
        "open_speed_reader",
        "Schnellleser",
        true,
        Some("CmdOrCtrl+R"),
    )?;
    let toggle_view = MenuItem::with_id(
        app,
        "toggle_view",
        "3D / 2D umschalten",
        true,
        Some("CmdOrCtrl+D"),
    )?;
    let toggle_speech = MenuItem::with_id(
        app,
        "toggle_speech",
        "Vorlesen starten/pausieren",
        true,
        Some("CmdOrCtrl+Shift+S"),
    )?;

    let file = Submenu::with_items(
        app,
        "Datei",
        true,
        &[
            &open,
            &open_multiple,
            &import_folder,
            &PredefinedMenuItem::separator(app)?,
            &library,
            &export,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::quit(app, Some("Beenden"))?,
        ],
    )?;

    let navigate = Submenu::with_items(
        app,
        "Navigieren",
        true,
        &[
            &search,
            &bookmarks,
            &PredefinedMenuItem::separator(app)?,
            &toggle_view,
            &toggle_speech,
        ],
    )?;

    let fullscreen = MenuItem::with_id(
        app,
        "toggle_fullscreen",
        "Vollbild umschalten",
        true,
        Some("F11"),
    )?;

    let view = Submenu::with_items(
        app,
        "Darstellung",
        true,
        &[
            &typography,
            &settings,
            &PredefinedMenuItem::separator(app)?,
            &speed,
            &PredefinedMenuItem::separator(app)?,
            &fullscreen,
        ],
    )?;

    Menu::with_items(app, &[&file, &navigate, &view])
}

/// Forwards menu clicks to the webview, which owns all the actual behaviour.
pub fn handle_menu_event(app: &AppHandle, id: &str) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.emit("menu-action", id);
        let _ = window.set_focus();
    }
}
