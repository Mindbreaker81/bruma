use serde::{Deserialize, Serialize};
use std::{
    fs,
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

    read_markdown_file(&path).map(Some)
}

#[tauri::command]
pub fn read_file(path: String) -> Result<OpenedFile, String> {
    read_markdown_file(Path::new(&path))
}

#[tauri::command]
pub fn save_file(path: String, content: String, eol: DocumentEol) -> Result<SavedFile, String> {
    write_markdown_file(Path::new(&path), &content, eol)
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

    write_markdown_file(&ensure_markdown_extension(path), &content, eol).map(Some)
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
    use super::{is_markdown_path, normalize_eol, DocumentEol};
    use std::path::Path;

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
}
