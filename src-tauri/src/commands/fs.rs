use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use serde::{Deserialize, Serialize};
use std::{
    env, fs,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenedFile {
    path: String,
    content: String,
    eol: DocumentEol,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedFile {
    path: String,
    saved_at: u128,
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum DocumentEol {
    Lf,
    Crlf,
}

#[tauri::command]
pub fn open_file_dialog() -> Result<Option<OpenedFile>, String> {
    let Some(path) = rfd::FileDialog::new()
        .add_filter("Markdown", &["md", "markdown"])
        .pick_file()
    else {
        return Ok(None);
    };

    let path = resolve_allowed_read_path(&path)?;

    read_markdown_file(&path).map(Some)
}

#[tauri::command]
pub fn read_file(path: String) -> Result<OpenedFile, String> {
    let path = resolve_allowed_read_path(Path::new(&path))?;

    read_markdown_file(&path)
}

#[tauri::command]
pub fn save_file(path: String, content: String, eol: DocumentEol) -> Result<SavedFile, String> {
    let path = resolve_allowed_write_path(Path::new(&path))?;

    write_markdown_file(&path, &content, eol)
}

#[tauri::command]
pub fn save_file_dialog(
    content: String,
    eol: DocumentEol,
    suggested: Option<String>,
) -> Result<Option<SavedFile>, String> {
    let mut dialog = rfd::FileDialog::new().add_filter("Markdown", &["md", "markdown"]);

    if let Some(file_name) = suggested.filter(|value| !value.trim().is_empty()) {
        dialog = dialog.set_file_name(file_name);
    }

    let Some(path) = dialog.save_file() else {
        return Ok(None);
    };

    let path = resolve_allowed_write_path(&ensure_markdown_extension(path))?;

    write_markdown_file(&path, &content, eol).map(Some)
}

#[tauri::command]
pub fn read_image_as_data_url(base: String, relative: String) -> Result<String, String> {
    let base_path = Path::new(&base);
    let base_dir = if base_path.is_dir() {
        base_path.to_path_buf()
    } else {
        base_path
            .parent()
            .ok_or_else(|| "invalid_base_path".to_string())?
            .to_path_buf()
    };

    let candidate = base_dir.join(&relative);
    let canonical = resolve_allowed_read_path(&candidate)?;

    if !is_allowed_image_path(&canonical) {
        return Err("unsupported_file_type".to_string());
    }

    let mime = image_mime_for_path(&canonical)
        .ok_or_else(|| "unsupported_file_type".to_string())?;
    let bytes = fs::read(&canonical).map_err(|error| format!("read_failed: {error}"))?;
    let encoded = BASE64.encode(&bytes);

    Ok(format!("data:{mime};base64,{encoded}"))
}

#[tauri::command]
pub fn save_binary_export_dialog(
    content: String,
    suggested: Option<String>,
    extension: String,
    label: Option<String>,
) -> Result<Option<SavedFile>, String> {
    let extension = extension.trim().trim_start_matches('.').to_string();
    if extension.is_empty() {
        return Err("invalid_extension".to_string());
    }

    let bytes = BASE64
        .decode(content.as_bytes())
        .map_err(|error| format!("base64_decode_failed: {error}"))?;

    let label = label.unwrap_or_else(|| extension.to_uppercase());
    let mut dialog = rfd::FileDialog::new().add_filter(label.as_str(), &[extension.as_str()]);

    if let Some(file_name) = suggested.filter(|value| !value.trim().is_empty()) {
        dialog = dialog.set_file_name(file_name);
    }

    let Some(path) = dialog.save_file() else {
        return Ok(None);
    };

    let path = ensure_extension(path, &extension);
    let path = resolve_allowed_write_path(&path)?;

    fs::write(&path, &bytes).map_err(|error| format!("write_failed: {error}"))?;

    Ok(Some(SavedFile {
        path: path_to_string(&path),
        saved_at: now_millis(),
    }))
}

#[tauri::command]
pub fn save_export_dialog(
    content: String,
    suggested: Option<String>,
    extension: String,
    label: Option<String>,
) -> Result<Option<SavedFile>, String> {
    let extension = extension.trim().trim_start_matches('.').to_string();
    if extension.is_empty() {
        return Err("invalid_extension".to_string());
    }

    let label = label.unwrap_or_else(|| extension.to_uppercase());
    let mut dialog = rfd::FileDialog::new().add_filter(label.as_str(), &[extension.as_str()]);

    if let Some(file_name) = suggested.filter(|value| !value.trim().is_empty()) {
        dialog = dialog.set_file_name(file_name);
    }

    let Some(path) = dialog.save_file() else {
        return Ok(None);
    };

    let path = ensure_extension(path, &extension);
    let path = resolve_allowed_write_path(&path)?;

    fs::write(&path, content.as_bytes()).map_err(|error| format!("write_failed: {error}"))?;

    Ok(Some(SavedFile {
        path: path_to_string(&path),
        saved_at: now_millis(),
    }))
}

fn is_allowed_image_path(path: &Path) -> bool {
    image_mime_for_path(path).is_some()
}

fn image_mime_for_path(path: &Path) -> Option<&'static str> {
    let extension = path.extension()?.to_str()?.to_ascii_lowercase();
    match extension.as_str() {
        "png" => Some("image/png"),
        "jpg" | "jpeg" => Some("image/jpeg"),
        "gif" => Some("image/gif"),
        "webp" => Some("image/webp"),
        "svg" => Some("image/svg+xml"),
        _ => None,
    }
}

fn ensure_extension(path: PathBuf, extension: &str) -> PathBuf {
    let matches = path
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| value.eq_ignore_ascii_case(extension))
        .unwrap_or(false);

    if matches {
        path
    } else {
        path.with_extension(extension)
    }
}

fn resolve_allowed_read_path(path: &Path) -> Result<PathBuf, String> {
    let canonical_path = path
        .canonicalize()
        .map_err(|_| "invalid_path".to_string())?;

    if !is_allowed_path(&canonical_path) {
        eprintln!("Denied read outside allowed scope: {}", path.display());
        return Err("path_not_allowed".to_string());
    }

    Ok(canonical_path)
}

fn resolve_allowed_write_path(path: &Path) -> Result<PathBuf, String> {
    if path.exists() {
        let canonical_path = path
            .canonicalize()
            .map_err(|_| "invalid_path".to_string())?;

        if !is_allowed_path(&canonical_path) {
            eprintln!("Denied write outside allowed scope: {}", path.display());
            return Err("path_not_allowed".to_string());
        }

        return Ok(canonical_path);
    }

    let parent = path
        .parent()
        .ok_or_else(|| "parent_directory_not_found".to_string())?;
    let canonical_parent = parent
        .canonicalize()
        .map_err(|_| "parent_directory_not_found".to_string())?;

    if !is_allowed_path(&canonical_parent) {
        eprintln!("Denied write outside allowed scope: {}", path.display());
        return Err("path_not_allowed".to_string());
    }

    let file_name = path.file_name().ok_or_else(|| "invalid_path".to_string())?;

    Ok(canonical_parent.join(file_name))
}

fn is_allowed_path(path: &Path) -> bool {
    let Some(home_path) = user_home_dir() else {
        return false;
    };

    let Ok(canonical_home) = home_path.canonicalize() else {
        return false;
    };

    path.starts_with(&canonical_home)
}

fn user_home_dir() -> Option<PathBuf> {
    env::var_os("HOME")
        .map(PathBuf::from)
        .or_else(|| env::var_os("USERPROFILE").map(PathBuf::from))
}

fn read_markdown_file(path: &Path) -> Result<OpenedFile, String> {
    if !is_markdown_path(path) {
        return Err("unsupported_file_type".to_string());
    }

    let bytes = fs::read(path).map_err(|error| format!("read_failed: {error}"))?;
    let content_bytes = bytes.strip_prefix(&[0xEF, 0xBB, 0xBF]).unwrap_or(&bytes);
    let content = String::from_utf8(content_bytes.to_vec())
        .map_err(|error| format!("utf8_failed: {error}"))?;
    let eol = if content.contains("\r\n") {
        DocumentEol::Crlf
    } else {
        DocumentEol::Lf
    };

    Ok(OpenedFile {
        path: path_to_string(path),
        content,
        eol,
    })
}

fn write_markdown_file(path: &Path, content: &str, eol: DocumentEol) -> Result<SavedFile, String> {
    if !is_markdown_path(path) {
        return Err("unsupported_file_type".to_string());
    }

    let normalized = normalize_eol(content, eol);

    fs::write(path, normalized.as_bytes()).map_err(|error| format!("write_failed: {error}"))?;

    Ok(SavedFile {
        path: path_to_string(path),
        saved_at: now_millis(),
    })
}

fn normalize_eol(content: &str, eol: DocumentEol) -> String {
    let lf = content.replace("\r\n", "\n").replace('\r', "\n");

    match eol {
        DocumentEol::Lf => lf,
        DocumentEol::Crlf => lf.replace('\n', "\r\n"),
    }
}

fn is_markdown_path(path: &Path) -> bool {
    path.extension()
        .and_then(|extension| extension.to_str())
        .map(|extension| {
            let extension = extension.to_ascii_lowercase();
            extension == "md" || extension == "markdown"
        })
        .unwrap_or(false)
}

fn ensure_markdown_extension(path: PathBuf) -> PathBuf {
    if is_markdown_path(&path) {
        return path;
    }

    path.with_extension("md")
}

fn path_to_string(path: &Path) -> String {
    path.to_string_lossy().into_owned()
}

fn now_millis() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use super::{
        ensure_extension, image_mime_for_path, is_markdown_path, is_safe_template_id,
        normalize_eol, read_file, read_image_as_data_url, save_file, user_home_dir, DocumentEol,
    };
    use std::{
        fs,
        path::{Path, PathBuf},
        time::{SystemTime, UNIX_EPOCH},
    };

    #[test]
    fn normalizes_line_endings_for_writes() {
        assert_eq!(normalize_eol("a\r\nb\rc", DocumentEol::Lf), "a\nb\nc");
        assert_eq!(normalize_eol("a\nb", DocumentEol::Crlf), "a\r\nb");
    }

    #[test]
    fn detects_markdown_paths() {
        assert!(is_markdown_path(Path::new("note.md")));
        assert!(is_markdown_path(Path::new("note.markdown")));
        assert!(!is_markdown_path(Path::new("note.txt")));
    }

    #[test]
    fn rejects_absolute_system_paths_for_reads() {
        let system_path = forbidden_system_path();

        let result = read_file(system_path.to_string_lossy().into_owned());

        assert!(result.is_err());
    }

    #[test]
    fn accepts_valid_user_paths_for_reads() {
        let home = user_home_dir().expect("home directory should exist");
        let dir = create_test_path(home.join(".bruma-security-tests").join("read-ok"));
        fs::create_dir_all(&dir).unwrap();
        let file_path = dir.join("note.md");
        fs::write(&file_path, "# Bruma").unwrap();

        let result = read_file(file_path.to_string_lossy().into_owned()).unwrap();

        assert_eq!(
            result.path,
            file_path
                .canonicalize()
                .unwrap()
                .to_string_lossy()
                .into_owned()
        );

        fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn rejects_paths_that_escape_home_on_write() {
        let result = save_file(
            forbidden_system_path()
                .with_extension("md")
                .to_string_lossy()
                .into_owned(),
            "# Bruma".to_string(),
            DocumentEol::Lf,
        );

        assert!(result.is_err());
    }

    #[test]
    fn accepts_new_markdown_paths_inside_home_on_write() {
        let home = user_home_dir().expect("home directory should exist");
        let dir = create_test_path(home.join(".bruma-security-tests").join("write-ok"));
        fs::create_dir_all(&dir).unwrap();
        let target = dir.join("note.md");

        let result = save_file(
            target.to_string_lossy().into_owned(),
            "# Bruma".to_string(),
            DocumentEol::Lf,
        )
        .unwrap();

        // On Windows, canonicalize() can return NT paths (e.g., \\?\C:\$Extend\$Deleted\...)
        // which don't match the returned path. Verify the file was created at the expected location instead.
        assert!(Path::new(&result.path).exists());
        assert_eq!(fs::read_to_string(&target).unwrap(), "# Bruma");

        fs::remove_dir_all(&dir).unwrap();
    }

    fn create_test_path(base: PathBuf) -> PathBuf {
        let millis = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis();

        let stem = base.file_stem().unwrap().to_string_lossy();

        match base.extension().and_then(|extension| extension.to_str()) {
            Some(extension) if !extension.is_empty() => {
                base.with_file_name(format!("{stem}-{millis}.{extension}"))
            }
            _ => base.with_file_name(format!("{stem}-{millis}")),
        }
    }

    #[test]
    fn maps_image_extensions_to_mime() {
        assert_eq!(image_mime_for_path(Path::new("a.png")), Some("image/png"));
        assert_eq!(image_mime_for_path(Path::new("a.JPG")), Some("image/jpeg"));
        assert_eq!(image_mime_for_path(Path::new("a.svg")), Some("image/svg+xml"));
        assert_eq!(image_mime_for_path(Path::new("a.bmp")), None);
    }

    #[test]
    fn ensures_extension_is_appended_when_missing() {
        assert_eq!(
            ensure_extension(PathBuf::from("note"), "html"),
            PathBuf::from("note.html")
        );
        assert_eq!(
            ensure_extension(PathBuf::from("note.HTML"), "html"),
            PathBuf::from("note.HTML")
        );
        assert_eq!(
            ensure_extension(PathBuf::from("note.txt"), "html"),
            PathBuf::from("note.html")
        );
    }

    #[test]
    fn reads_image_as_data_url_for_valid_file() {
        let home = user_home_dir().expect("home directory should exist");
        let dir = create_test_path(home.join(".bruma-security-tests").join("img-ok"));
        fs::create_dir_all(&dir).unwrap();
        let image = dir.join("logo.png");
        // 1x1 transparent PNG
        let png: [u8; 67] = [
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48,
            0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00,
            0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x44, 0x41, 0x54, 0x78,
            0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
            0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82,
        ];
        fs::write(&image, png).unwrap();

        let base = dir.join("note.md");
        fs::write(&base, "# x").unwrap();

        let result = read_image_as_data_url(
            base.to_string_lossy().into_owned(),
            "logo.png".to_string(),
        )
        .unwrap();

        assert!(result.starts_with("data:image/png;base64,"));

        fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn rejects_image_outside_home() {
        let result = read_image_as_data_url(
            forbidden_system_path().to_string_lossy().into_owned(),
            "passwd".to_string(),
        );
        assert!(result.is_err());
    }

    #[test]
    fn rejects_template_ids_that_escape_the_templates_directory() {
        assert!(is_safe_template_id("daily-note"));
        assert!(is_safe_template_id("acta.v2"));

        assert!(!is_safe_template_id(""));
        assert!(!is_safe_template_id(".."));
        assert!(!is_safe_template_id("../../.ssh/notes"));
        assert!(!is_safe_template_id("..\\..\\notes"));
        assert!(!is_safe_template_id("sub/dir"));
        assert!(!is_safe_template_id("/etc/passwd"));
    }

    #[cfg(target_family = "unix")]
    fn forbidden_system_path() -> PathBuf {
        PathBuf::from("/etc/passwd")
    }

    #[cfg(target_family = "windows")]
    fn forbidden_system_path() -> PathBuf {
        PathBuf::from(r"C:\Windows\System32\drivers\etc\hosts")
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomTemplate {
    pub id: String,
    pub name: String,
}

#[tauri::command]
pub fn list_custom_templates(app: AppHandle) -> Result<Vec<CustomTemplate>, String> {
    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("config_dir_error: {e}"))?;

    let templates_dir = config_dir.join("templates");

    if !templates_dir.exists() {
        // Create templates directory if it doesn't exist
        fs::create_dir_all(&templates_dir)
            .map_err(|e| format!("create_templates_dir_error: {e}"))?;
        return Ok(Vec::new());
    }

    let mut templates = Vec::new();

    let entries = fs::read_dir(&templates_dir)
        .map_err(|e| format!("read_templates_dir_error: {e}"))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("read_entry_error: {e}"))?;
        let path = entry.path();

        if path.extension().and_then(|e| e.to_str()) == Some("md") {
            let file_name = path
                .file_stem()
                .and_then(|s| s.to_str())
                .ok_or_else(|| "invalid_template_name".to_string())?;

            templates.push(CustomTemplate {
                id: file_name.to_string(),
                name: file_name.to_string(),
            });
        }
    }

    templates.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(templates)
}

/// Template ids come from the frontend, so they must not be able to walk out of
/// the templates directory: `../../.ssh/notes` would otherwise canonicalize to
/// any `.md` file inside the user's home.
fn is_safe_template_id(id: &str) -> bool {
    !id.is_empty()
        && id != "."
        && id != ".."
        && !id.contains("..")
        && !id.contains('/')
        && !id.contains('\\')
        && !id.contains('\0')
        && !Path::new(id).is_absolute()
        && Path::new(id).components().count() == 1
}

#[tauri::command]
pub fn read_custom_template(app: AppHandle, id: String) -> Result<String, String> {
    if !is_safe_template_id(&id) {
        return Err("invalid_template_name".to_string());
    }

    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("config_dir_error: {e}"))?;

    let template_path = config_dir.join("templates").join(format!("{}.md", id));

    let canonical_path = resolve_allowed_read_path(&template_path)?;

    if !is_markdown_path(&canonical_path) {
        return Err("unsupported_file_type".to_string());
    }

    let content = fs::read_to_string(&canonical_path)
        .map_err(|e| format!("read_template_error: {e}"))?;

    Ok(content)
}
