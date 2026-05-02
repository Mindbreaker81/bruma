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

pub fn install(app: &App) -> tauri::Result<()> {
    app.set_menu(build_menu(app, &[])?)?;

    Ok(())
}

pub fn sync_recent_files<R: Runtime>(
    app: &AppHandle<R>,
    state: &RecentFilesMenuState,
    paths: Vec<String>,
) -> Result<(), String> {
    let mut recent_files = state
        .0
        .lock()
        .map_err(|_| "recent_files_lock_failed".to_string())?;
    *recent_files = paths;
    refresh_menu(app, &recent_files).map_err(|error| error.to_string())
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

fn refresh_menu<R: Runtime>(app: &AppHandle<R>, recent_files: &[String]) -> tauri::Result<()> {
    app.set_menu(build_menu(app, recent_files)?)?;
    Ok(())
}

fn build_menu<R: Runtime, M: Manager<R>>(
    app: &M,
    recent_files: &[String],
) -> tauri::Result<Menu<R>> {
    #[cfg(target_os = "macos")]
    let app_menu = build_app_menu(app)?;
    let file_menu = build_file_menu(app, recent_files)?;

    let edit_find = MenuItem::with_id(app, "edit_find", "Buscar", true, Some("CmdOrCtrl+F"))?;
    let edit_menu = Submenu::with_items(app, "Editar", true, &[&edit_find])?;

    let view_toggle_mode = MenuItem::with_id(
        app,
        "view_toggle_mode",
        "Cambiar vista",
        true,
        Some("CmdOrCtrl+Shift+V"),
    )?;
    let view_separator_top = PredefinedMenuItem::separator(app)?;
    let view_editor = MenuItem::with_id(app, "view_editor", "Editor", true, None::<&str>)?;
    let view_preview = MenuItem::with_id(app, "view_preview", "Preview", true, None::<&str>)?;
    let view_split = MenuItem::with_id(app, "view_split", "Dividido", true, None::<&str>)?;
    let view_separator_bottom = PredefinedMenuItem::separator(app)?;
    let view_toggle_theme = MenuItem::with_id(
        app,
        "view_toggle_theme",
        "Cambiar tema",
        true,
        Some("CmdOrCtrl+Shift+T"),
    )?;
    let view_menu = Submenu::with_items(
        app,
        "Ver",
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

    let language_es = MenuItem::with_id(app, "language_es", "Espanol", true, None::<&str>)?;
    let language_en = MenuItem::with_id(app, "language_en", "English", true, None::<&str>)?;
    let language_menu = Submenu::with_items(app, "Idioma", true, &[&language_es, &language_en])?;

    let help_preferences = MenuItem::with_id(app, "help_preferences", "Preferencias", true, Some("CmdOrCtrl+,"))?;
    let help_separator = PredefinedMenuItem::separator(app)?;
    let help_about = MenuItem::with_id(app, "help_about", "Acerca de Bruma", true, None::<&str>)?;
    let help_menu = Submenu::with_items(app, "Ayuda", true, &[&help_preferences, &help_separator, &help_about])?;

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
) -> tauri::Result<Submenu<R>> {
    let file_new = MenuItem::with_id(app, "file_new", "Nuevo", true, Some("CmdOrCtrl+N"))?;
    let file_open = MenuItem::with_id(app, "file_open", "Abrir...", true, Some("CmdOrCtrl+O"))?;
    let recent_menu = build_recent_menu(app, recent_files)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let file_save = MenuItem::with_id(app, "file_save", "Guardar", true, Some("CmdOrCtrl+S"))?;
    let file_save_as = MenuItem::with_id(
        app,
        "file_save_as",
        "Guardar como...",
        true,
        Some("CmdOrCtrl+Shift+S"),
    )?;
    let print_separator = PredefinedMenuItem::separator(app)?;
    let file_print = MenuItem::with_id(app, "file_print", "Imprimir...", true, Some("CmdOrCtrl+P"))?;

    Submenu::with_items(
        app,
        "Archivo",
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
) -> tauri::Result<Submenu<R>> {
    let recent_items = build_recent_menu_items(app, recent_files)?;
    let recent_item_refs = recent_items
        .iter()
        .map(|item| item as &dyn IsMenuItem<R>)
        .collect::<Vec<_>>();

    Submenu::with_id_and_items(
        app,
        RECENT_MENU_ID,
        "Abrir recientes",
        true,
        &recent_item_refs,
    )
}

fn build_recent_menu_items<R: Runtime, M: Manager<R>>(
    app: &M,
    recent_files: &[String],
) -> tauri::Result<Vec<MenuItem<R>>> {
    if recent_files.is_empty() {
        return Ok(vec![MenuItem::with_id(
            app,
            RECENT_EMPTY_ID,
            "Sin recientes",
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

#[cfg(test)]
mod tests {
    use super::{parse_recent_menu_index, recent_menu_item_id, recent_menu_item_label};

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
}
