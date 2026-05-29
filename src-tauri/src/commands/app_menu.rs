use tauri::{AppHandle, Runtime, State};

use crate::menu::{self, RecentFilesMenuState, UpdateMenuState};

#[tauri::command]
pub fn set_update_available_menu_state<R: Runtime>(
    app: AppHandle<R>,
    recent_state: State<'_, RecentFilesMenuState>,
    update_state: State<'_, UpdateMenuState>,
    available: bool,
) -> Result<(), String> {
    menu::set_update_available(&app, &recent_state, &update_state, available)
}
