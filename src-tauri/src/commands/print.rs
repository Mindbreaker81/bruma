use tauri::{AppHandle, Manager, Runtime};

#[tauri::command]
pub fn print_current_window<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "window_not_found".to_string())?;

    window
        .print()
        .map_err(|error| format!("print_failed: {error}"))
}
