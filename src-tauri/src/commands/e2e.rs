use tauri::{AppHandle, Emitter};

#[tauri::command]
pub fn e2e_emit_recent_open(app: AppHandle, path: String) -> Result<(), String> {
    if !cfg!(debug_assertions) {
        return Err("not_available".to_string());
    }

    app.emit("menu://recent-open", path)
        .map_err(|error| format!("emit_failed: {error}"))?;

    Ok(())
}

