/// Whether the app is running inside a Flatpak sandbox. The frontend uses
/// this to hide updater affordances — self-update cannot work there.
#[tauri::command]
pub fn is_flatpak() -> bool {
    crate::is_flatpak_runtime()
}
