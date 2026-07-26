use tauri::{AppHandle, Runtime, State};

use crate::menu::{self, MenuLabelsState, RecentFilesMenuState, UpdateMenuState};

#[tauri::command]
pub fn sync_recent_files_menu<R: Runtime>(
    app: AppHandle<R>,
    state: State<'_, RecentFilesMenuState>,
    update_state: State<'_, UpdateMenuState>,
    labels_state: State<'_, MenuLabelsState>,
    paths: Vec<String>,
) -> Result<(), String> {
    menu::sync_recent_files(&app, &state, &update_state, &labels_state, paths)
}
