use serde::Deserialize;
use std::{path::Path, sync::Mutex};
use tauri::{
    menu::{IsMenuItem, Menu, MenuId, MenuItem, PredefinedMenuItem, Submenu},
    App, AppHandle, Emitter, Manager, Runtime,
};

const MENU_ACTION_EVENT: &str = "menu://action";
pub const RECENT_OPEN_EVENT: &str = "menu://recent-open";
const RECENT_MENU_ID: &str = "file_recent";
const RECENT_ITEM_ID_PREFIX: &str = "file_recent_open_";
const RECENT_EMPTY_ID: &str = "file_recent_empty";

#[derive(Default)]
pub struct RecentFilesMenuState(pub Mutex<Vec<String>>);

#[derive(Default)]
pub struct UpdateMenuState(pub Mutex<bool>);

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MenuLabels {
    file: String,
    new_document: String,
    open: String,
    open_recent: String,
    no_recent: String,
    save: String,
    save_as: String,
    print: String,
    edit: String,
    find: String,
    view: String,
    toggle_view: String,
    editor: String,
    preview: String,
    split: String,
    toggle_theme: String,
    language: String,
    spanish: String,
    english: String,
    help: String,
    preferences: String,
    shortcuts: String,
    check_updates: String,
    about: String,
}

impl Default for MenuLabels {
    fn default() -> Self {
        Self {
            file: "Archivo".into(),
            new_document: "Nuevo".into(),
            open: "Abrir…".into(),
            open_recent: "Abrir recientes".into(),
            no_recent: "Sin recientes".into(),
            save: "Guardar".into(),
            save_as: "Guardar como…".into(),
            print: "Imprimir…".into(),
            edit: "Editar".into(),
            find: "Buscar".into(),
            view: "Ver".into(),
            toggle_view: "Cambiar vista".into(),
            editor: "Editor".into(),
            preview: "Vista previa".into(),
            split: "Dividido".into(),
            toggle_theme: "Cambiar tema".into(),
            language: "Idioma".into(),
            spanish: "Español".into(),
            english: "Inglés".into(),
            help: "Ayuda".into(),
            preferences: "Preferencias".into(),
            shortcuts: "Atajos de teclado".into(),
            check_updates: "Buscar actualizaciones".into(),
            about: "Acerca de Bruma".into(),
        }
    }
}

#[derive(Default)]
pub struct MenuLabelsState(pub Mutex<MenuLabels>);

pub fn install(app: &App) -> tauri::Result<()> {
    app.set_menu(build_menu(app, &[], false, &MenuLabels::default())?)?;

    Ok(())
}

pub fn sync_recent_files<R: Runtime>(
    app: &AppHandle<R>,
    state: &RecentFilesMenuState,
    update_state: &UpdateMenuState,
    labels_state: &MenuLabelsState,
    paths: Vec<String>,
) -> Result<(), String> {
    let mut recent_files = state
        .0
        .lock()
        .map_err(|_| "recent_files_lock_failed".to_string())?;
    *recent_files = paths;

    let update_available = *update_state
        .0
        .lock()
        .map_err(|_| "update_menu_lock_failed".to_string())?;
    let labels = labels_state
        .0
        .lock()
        .map_err(|_| "menu_labels_lock_failed".to_string())?
        .clone();
    refresh_menu(app, &recent_files, update_available, &labels).map_err(|error| error.to_string())
}

pub fn set_update_available<R: Runtime>(
    app: &AppHandle<R>,
    recent_state: &RecentFilesMenuState,
    update_state: &UpdateMenuState,
    labels_state: &MenuLabelsState,
    available: bool,
) -> Result<(), String> {
    let recent_files = recent_state
        .0
        .lock()
        .map_err(|_| "recent_files_lock_failed".to_string())?
        .clone();
    let mut update_available = update_state
        .0
        .lock()
        .map_err(|_| "update_menu_lock_failed".to_string())?;
    *update_available = available;
    let labels = labels_state
        .0
        .lock()
        .map_err(|_| "menu_labels_lock_failed".to_string())?
        .clone();
    refresh_menu(app, &recent_files, available, &labels).map_err(|error| error.to_string())
}

pub fn set_labels<R: Runtime>(
    app: &AppHandle<R>,
    recent_state: &RecentFilesMenuState,
    update_state: &UpdateMenuState,
    labels_state: &MenuLabelsState,
    labels: MenuLabels,
) -> Result<(), String> {
    let recent_files = recent_state
        .0
        .lock()
        .map_err(|_| "recent_files_lock_failed".to_string())?
        .clone();
    let update_available = *update_state
        .0
        .lock()
        .map_err(|_| "update_menu_lock_failed".to_string())?;
    *labels_state
        .0
        .lock()
        .map_err(|_| "menu_labels_lock_failed".to_string())? = labels.clone();
    refresh_menu(app, &recent_files, update_available, &labels).map_err(|error| error.to_string())
}

pub fn handle_event<R: Runtime>(app: &AppHandle<R>, id: &MenuId) {
    if let Some(index) = parse_recent_menu_index(id.as_ref()) {
        let selected_path = {
            let state = app.state::<RecentFilesMenuState>();
            state
                .0
                .lock()
                .ok()
                .and_then(|recent_files| recent_files.get(index).cloned())
        };

        if let Some(path) = selected_path {
            let _ = app.emit(RECENT_OPEN_EVENT, path);
            return;
        }
    }

    let _ = app.emit(MENU_ACTION_EVENT, id.as_ref());
}

fn refresh_menu<R: Runtime>(
    app: &AppHandle<R>,
    recent_files: &[String],
    update_available: bool,
    labels: &MenuLabels,
) -> tauri::Result<()> {
    app.set_menu(build_menu(app, recent_files, update_available, labels)?)?;
    Ok(())
}

fn build_menu<R: Runtime, M: Manager<R>>(
    app: &M,
    recent_files: &[String],
    update_available: bool,
    labels: &MenuLabels,
) -> tauri::Result<Menu<R>> {
    #[cfg(target_os = "macos")]
    let app_menu = build_app_menu(app)?;
    let file_menu = build_file_menu(app, recent_files, labels)?;

    let edit_find = MenuItem::with_id(app, "edit_find", &labels.find, true, Some("CmdOrCtrl+F"))?;
    let edit_menu = Submenu::with_items(app, &labels.edit, true, &[&edit_find])?;

    let view_toggle_mode = MenuItem::with_id(
        app,
        "view_toggle_mode",
        &labels.toggle_view,
        true,
        Some("CmdOrCtrl+Shift+V"),
    )?;
    let view_separator_top = PredefinedMenuItem::separator(app)?;
    let view_editor = MenuItem::with_id(app, "view_editor", &labels.editor, true, None::<&str>)?;
    let view_preview = MenuItem::with_id(app, "view_preview", &labels.preview, true, None::<&str>)?;
    let view_split = MenuItem::with_id(app, "view_split", &labels.split, true, None::<&str>)?;
    let view_separator_bottom = PredefinedMenuItem::separator(app)?;
    let view_toggle_theme = MenuItem::with_id(
        app,
        "view_toggle_theme",
        &labels.toggle_theme,
        true,
        Some("CmdOrCtrl+Shift+T"),
    )?;
    let view_menu = Submenu::with_items(
        app,
        &labels.view,
        true,
        &[
            &view_toggle_mode,
            &view_separator_top,
            &view_editor,
            &view_preview,
            &view_split,
            &view_separator_bottom,
            &view_toggle_theme,
        ],
    )?;

    let language_es = MenuItem::with_id(app, "language_es", &labels.spanish, true, None::<&str>)?;
    let language_en = MenuItem::with_id(app, "language_en", &labels.english, true, None::<&str>)?;
    let language_menu =
        Submenu::with_items(app, &labels.language, true, &[&language_es, &language_en])?;

    let help_preferences = MenuItem::with_id(
        app,
        "help_preferences",
        &labels.preferences,
        true,
        Some("CmdOrCtrl+,"),
    )?;
    let help_shortcuts =
        MenuItem::with_id(app, "help_shortcuts", &labels.shortcuts, true, None::<&str>)?;
    let help_check_updates = MenuItem::with_id(
        app,
        "help_check_updates",
        update_menu_item_label(&labels.check_updates, update_available),
        true,
        None::<&str>,
    )?;
    let help_separator = PredefinedMenuItem::separator(app)?;
    let help_about = MenuItem::with_id(app, "help_about", &labels.about, true, None::<&str>)?;
    let help_menu = Submenu::with_items(
        app,
        &labels.help,
        true,
        &[
            &help_preferences,
            &help_shortcuts,
            &help_check_updates,
            &help_separator,
            &help_about,
        ],
    )?;

    Menu::with_items(
        app,
        &[
            #[cfg(target_os = "macos")]
            &app_menu,
            &file_menu,
            &edit_menu,
            &view_menu,
            &language_menu,
            &help_menu,
        ],
    )
}

#[cfg(target_os = "macos")]
fn build_app_menu<R: Runtime, M: Manager<R>>(app: &M) -> tauri::Result<Submenu<R>> {
    let app_name = app.package_info().name.clone();
    let about = PredefinedMenuItem::about(app, None, None)?;
    let separator_top = PredefinedMenuItem::separator(app)?;
    let services = PredefinedMenuItem::services(app, None)?;
    let separator_middle = PredefinedMenuItem::separator(app)?;
    let hide = PredefinedMenuItem::hide(app, None)?;
    let hide_others = PredefinedMenuItem::hide_others(app, None)?;
    let separator_bottom = PredefinedMenuItem::separator(app)?;
    let quit = PredefinedMenuItem::quit(app, None)?;

    Submenu::with_items(
        app,
        app_name,
        true,
        &[
            &about,
            &separator_top,
            &services,
            &separator_middle,
            &hide,
            &hide_others,
            &separator_bottom,
            &quit,
        ],
    )
}

fn build_file_menu<R: Runtime, M: Manager<R>>(
    app: &M,
    recent_files: &[String],
    labels: &MenuLabels,
) -> tauri::Result<Submenu<R>> {
    let file_new = MenuItem::with_id(
        app,
        "file_new",
        &labels.new_document,
        true,
        Some("CmdOrCtrl+N"),
    )?;
    let file_open = MenuItem::with_id(app, "file_open", &labels.open, true, Some("CmdOrCtrl+O"))?;
    let recent_menu = build_recent_menu(app, recent_files, labels)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let file_save = MenuItem::with_id(app, "file_save", &labels.save, true, Some("CmdOrCtrl+S"))?;
    let file_save_as = MenuItem::with_id(
        app,
        "file_save_as",
        &labels.save_as,
        true,
        Some("CmdOrCtrl+Shift+S"),
    )?;
    let print_separator = PredefinedMenuItem::separator(app)?;
    let file_print =
        MenuItem::with_id(app, "file_print", &labels.print, true, Some("CmdOrCtrl+P"))?;

    Submenu::with_items(
        app,
        &labels.file,
        true,
        &[
            &file_new,
            &file_open,
            &recent_menu,
            &separator,
            &file_save,
            &file_save_as,
            &print_separator,
            &file_print,
        ],
    )
}

fn build_recent_menu<R: Runtime, M: Manager<R>>(
    app: &M,
    recent_files: &[String],
    labels: &MenuLabels,
) -> tauri::Result<Submenu<R>> {
    let recent_items = build_recent_menu_items(app, recent_files, labels)?;
    let recent_item_refs = recent_items
        .iter()
        .map(|item| item as &dyn IsMenuItem<R>)
        .collect::<Vec<_>>();

    Submenu::with_id_and_items(
        app,
        RECENT_MENU_ID,
        &labels.open_recent,
        true,
        &recent_item_refs,
    )
}

fn build_recent_menu_items<R: Runtime, M: Manager<R>>(
    app: &M,
    recent_files: &[String],
    labels: &MenuLabels,
) -> tauri::Result<Vec<MenuItem<R>>> {
    if recent_files.is_empty() {
        return Ok(vec![MenuItem::with_id(
            app,
            RECENT_EMPTY_ID,
            &labels.no_recent,
            false,
            None::<&str>,
        )?]);
    }

    recent_files
        .iter()
        .enumerate()
        .map(|(index, path)| {
            MenuItem::with_id(
                app,
                recent_menu_item_id(index),
                recent_menu_item_label(path),
                true,
                None::<&str>,
            )
        })
        .collect()
}

fn recent_menu_item_id(index: usize) -> String {
    format!("{RECENT_ITEM_ID_PREFIX}{index}")
}

fn recent_menu_item_label(path: &str) -> String {
    let path_ref = Path::new(path);
    let file_name = path_ref.file_name().and_then(|name| name.to_str());
    let parent = path_ref
        .parent()
        .map(|parent| parent.to_string_lossy().into_owned());

    match (file_name, parent) {
        (Some(file_name), Some(parent)) if !file_name.is_empty() && !parent.is_empty() => {
            format!("{file_name} — {parent}")
        }
        _ => path.to_string(),
    }
}

fn parse_recent_menu_index(id: &str) -> Option<usize> {
    id.strip_prefix(RECENT_ITEM_ID_PREFIX)?.parse().ok()
}

fn update_menu_item_label(label: &str, update_available: bool) -> String {
    if update_available {
        format!("* {label}")
    } else {
        label.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::{
        parse_recent_menu_index, recent_menu_item_id, recent_menu_item_label,
        update_menu_item_label, MenuLabels,
    };

    #[test]
    fn builds_recent_menu_ids_from_indexes() {
        assert_eq!(recent_menu_item_id(0), "file_recent_open_0");
        assert_eq!(recent_menu_item_id(9), "file_recent_open_9");
    }

    #[test]
    fn builds_recent_menu_labels_from_basename_and_parent() {
        assert_eq!(
            recent_menu_item_label("/home/user/notes/todo.md"),
            "todo.md — /home/user/notes"
        );
    }

    #[test]
    fn falls_back_to_full_path_when_label_cannot_be_derived() {
        assert_eq!(recent_menu_item_label("todo.md"), "todo.md");
        assert_eq!(recent_menu_item_label(""), "");
    }

    #[test]
    fn parses_recent_menu_indexes() {
        assert_eq!(parse_recent_menu_index("file_recent_open_0"), Some(0));
        assert_eq!(parse_recent_menu_index("file_recent_open_7"), Some(7));
        assert_eq!(parse_recent_menu_index("file_recent_open_"), None);
        assert_eq!(parse_recent_menu_index("file_recent_open_a"), None);
        assert_eq!(parse_recent_menu_index("file_recent"), None);
    }

    #[test]
    fn marks_update_menu_item_when_update_is_available() {
        assert_eq!(
            update_menu_item_label("Check for updates", false),
            "Check for updates"
        );
        assert_eq!(
            update_menu_item_label("Check for updates", true),
            "* Check for updates"
        );
    }

    #[test]
    fn uses_accented_spanish_fallback_labels() {
        let labels = MenuLabels::default();

        assert_eq!(labels.spanish, "Español");
        assert_eq!(labels.english, "Inglés");
        assert_eq!(labels.preview, "Vista previa");
    }
}
