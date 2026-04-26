use tauri::{AppHandle, Runtime, State};

use crate::menu::{self, RecentFilesMenuState};

#[tauri::command]
pub fn sync_recent_files_menu<R: Runtime>(
    app: AppHandle<R>,
    state: State<'_, RecentFilesMenuState>,
    paths: Vec<String>,
) -> Result<(), String> {
    menu::sync_recent_files(&app, &state, paths)
}
