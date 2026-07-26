use tauri::{AppHandle, Runtime, State};

use crate::menu::{self, MenuLabels, MenuLabelsState, RecentFilesMenuState, UpdateMenuState};

#[tauri::command]
pub fn set_update_available_menu_state<R: Runtime>(
    app: AppHandle<R>,
    recent_state: State<'_, RecentFilesMenuState>,
    update_state: State<'_, UpdateMenuState>,
    labels_state: State<'_, MenuLabelsState>,
    available: bool,
) -> Result<(), String> {
    menu::set_update_available(&app, &recent_state, &update_state, &labels_state, available)
}

#[tauri::command]
pub fn set_menu_labels<R: Runtime>(
    app: AppHandle<R>,
    recent_state: State<'_, RecentFilesMenuState>,
    update_state: State<'_, UpdateMenuState>,
    labels_state: State<'_, MenuLabelsState>,
    labels: MenuLabels,
) -> Result<(), String> {
    menu::set_labels(&app, &recent_state, &update_state, &labels_state, labels)
}
