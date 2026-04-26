use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    App, Emitter,
};

pub fn install(app: &App) -> tauri::Result<()> {
    let file_menu = Submenu::with_items(
        app,
        "Archivo",
        true,
        &[
            &MenuItem::with_id(app, "file_new", "Nuevo", true, Some("CmdOrCtrl+N"))?,
            &MenuItem::with_id(app, "file_open", "Abrir...", true, Some("CmdOrCtrl+O"))?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "file_save", "Guardar", true, Some("CmdOrCtrl+S"))?,
            &MenuItem::with_id(
                app,
                "file_save_as",
                "Guardar como...",
                true,
                Some("CmdOrCtrl+Shift+S"),
            )?,
        ],
    )?;

    let edit_menu = Submenu::with_items(
        app,
        "Editar",
        true,
        &[&MenuItem::with_id(
            app,
            "edit_find",
            "Buscar",
            true,
            Some("CmdOrCtrl+F"),
        )?],
    )?;

    let view_menu = Submenu::with_items(
        app,
        "Ver",
        true,
        &[
            &MenuItem::with_id(
                app,
                "view_toggle_theme",
                "Cambiar tema",
                true,
                Some("CmdOrCtrl+Shift+T"),
            )?,
            &MenuItem::with_id(app, "view_editor", "Editor", true, None::<&str>)?,
        ],
    )?;

    let language_menu = Submenu::with_items(
        app,
        "Idioma",
        true,
        &[
            &MenuItem::with_id(app, "language_es", "Espanol", true, None::<&str>)?,
            &MenuItem::with_id(app, "language_en", "English", true, None::<&str>)?,
        ],
    )?;

    let help_menu = Submenu::with_items(
        app,
        "Ayuda",
        true,
        &[&MenuItem::with_id(app, "help_about", "Acerca de Bruma", true, None::<&str>)?],
    )?;

    let menu = Menu::with_items(
        app,
        &[&file_menu, &edit_menu, &view_menu, &language_menu, &help_menu],
    )?;

    app.set_menu(menu)?;

    Ok(())
}

pub fn handle_event(app: &App, id: &str) {
    let _ = app.emit("menu://action", id);
}
