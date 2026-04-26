mod commands;
mod menu;

pub fn run() {
    tauri::Builder::default()
        .manage(menu::RecentFilesMenuState::default())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            commands::fs::open_file_dialog,
            commands::fs::read_file,
            commands::fs::read_image_as_data_url,
            commands::fs::save_export_dialog,
            commands::fs::save_file,
            commands::fs::save_file_dialog,
            commands::recent::sync_recent_files_menu
        ])
        .setup(|app| {
            menu::install(app)?;
            Ok(())
        })
        .on_menu_event(|app, event| {
            menu::handle_event(app, event.id());
        })
        .run(tauri::generate_context!())
        .expect("error while running Bruma");
}
