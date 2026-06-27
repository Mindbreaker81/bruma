mod commands;
pub mod linux;
mod menu;

#[cfg(target_os = "windows")]
fn configure_fixed_webview2_runtime_if_present() {
    use std::path::PathBuf;

    if std::env::var_os("WEBVIEW2_BROWSER_EXECUTABLE_FOLDER").is_some() {
        return;
    }

    let exe_dir: PathBuf = match std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()))
    {
        Some(dir) => dir,
        None => return,
    };

    let fixed_runtime_dir = exe_dir.join("WebView2");
    if fixed_runtime_dir.is_dir() {
        std::env::set_var("WEBVIEW2_BROWSER_EXECUTABLE_FOLDER", fixed_runtime_dir);
    }
}

#[cfg(not(target_os = "windows"))]
fn configure_fixed_webview2_runtime_if_present() {}

pub fn run() {
    configure_fixed_webview2_runtime_if_present();

    tauri::Builder::default()
        .manage(menu::RecentFilesMenuState::default())
        .manage(menu::UpdateMenuState::default())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            commands::fs::open_file_dialog,
            commands::fs::read_file,
            commands::fs::read_image_as_data_url,
            commands::fs::save_binary_export_dialog,
            commands::fs::save_export_dialog,
            commands::fs::save_file,
            commands::fs::save_file_dialog,
            commands::app_menu::set_update_available_menu_state,
            commands::fs::list_custom_templates,
            commands::fs::read_custom_template,
            commands::e2e::e2e_emit_recent_open,
            commands::print::print_current_window,
            commands::recent::sync_recent_files_menu
        ])
        .setup(|app| {
            #[cfg(desktop)]
            app.handle()
                .plugin(tauri_plugin_updater::Builder::new().build())?;

            menu::install(app)?;
            Ok(())
        })
        .on_menu_event(|app, event| {
            menu::handle_event(app, event.id());
        })
        .run(tauri::generate_context!())
        .expect("error while running Bruma");
}
