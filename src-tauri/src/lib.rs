mod menu;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {
            menu::install(app)?;
            Ok(())
        })
        .on_menu_event(|app, event| {
            menu::handle_event(app, event.id().as_ref());
        })
        .run(tauri::generate_context!())
        .expect("error while running Bruma");
}
