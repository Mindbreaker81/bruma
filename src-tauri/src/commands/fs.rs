use serde::{Deserialize, Serialize};
use std::{
    env, fs,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};

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
        is_markdown_path, normalize_eol, read_file, save_file, user_home_dir, DocumentEol,
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
        let file_path = create_test_path(home.join(".bruma-security-tests").join("read-ok.md"));

        fs::create_dir_all(file_path.parent().expect("parent should exist")).unwrap();
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

        fs::remove_file(&file_path).unwrap();
        fs::remove_dir_all(file_path.parent().unwrap()).unwrap();
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
        let target = create_test_path(home.join(".bruma-security-tests").join("write-ok.md"));

        fs::create_dir_all(target.parent().expect("parent should exist")).unwrap();

        let result = save_file(
            target.to_string_lossy().into_owned(),
            "# Bruma".to_string(),
            DocumentEol::Lf,
        )
        .unwrap();

        let expected = target
            .canonicalize()
            .unwrap()
            .to_string_lossy()
            .into_owned();

        assert_eq!(result.path, expected);
        assert_eq!(fs::read_to_string(&target).unwrap(), "# Bruma");

        fs::remove_file(&target).unwrap();
        fs::remove_dir_all(target.parent().unwrap()).unwrap();
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

    #[cfg(target_family = "unix")]
    fn forbidden_system_path() -> PathBuf {
        PathBuf::from("/etc/passwd")
    }

    #[cfg(target_family = "windows")]
    fn forbidden_system_path() -> PathBuf {
        PathBuf::from(r"C:\Windows\System32\drivers\etc\hosts")
    }
}
