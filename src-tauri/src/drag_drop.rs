// Workaround for a wry/WebView2 file-drop gap on Windows: wry registers its
// IDropTarget only on child HWNDs that already have one registered. On recent
// WebView2 runtimes the render widget HWND either does not exist yet when wry
// enumerates the children, or its target has already been revoked by
// `SetAllowExternalDrop(false)`, so no `tauri://drag-*` events are ever
// emitted. We register our own IDropTarget on every WebView2 child HWND and
// emit the same `tauri://drag-*` events Tauri would emit, so the frontend
// `onDragDropEvent` path works unchanged.

use std::cell::UnsafeCell;
use std::ffi::OsString;
use std::os::windows::ffi::OsStringExt;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use serde::Serialize;
use tauri::{AppHandle, Emitter, EventTarget, Manager, PhysicalPosition, WindowEvent};
use windows::core::{implement, BOOL};
use windows::Win32::Foundation::{HWND, LPARAM, POINT, POINTL};
use windows::Win32::Graphics::Gdi::ScreenToClient;
use windows::Win32::System::Com::{IDataObject, DVASPECT_CONTENT, FORMATETC, TYMED_HGLOBAL};
use windows::Win32::System::Ole::{
    IDropTarget, IDropTarget_Impl, RegisterDragDrop, RevokeDragDrop, CF_HDROP, DROPEFFECT,
    DROPEFFECT_COPY, DROPEFFECT_NONE,
};
use windows::Win32::System::SystemServices::MODIFIERKEYS_FLAGS;
use windows::Win32::UI::Shell::{DragFinish, DragQueryFileW, HDROP};
use windows::Win32::UI::WindowsAndMessaging::{EnumChildWindows, GetClassNameW};

use crate::commands::fs::AllowedPaths;

const DRAG_ENTER_EVENT: &str = "tauri://drag-enter";
const DRAG_OVER_EVENT: &str = "tauri://drag-over";
const DRAG_DROP_EVENT: &str = "tauri://drag-drop";
const DRAG_LEAVE_EVENT: &str = "tauri://drag-leave";

const RENDER_WIDGET_CLASS: &str = "Chrome_RenderWidgetHostHWND";

/// Same shape as Tauri's internal `DragDropPayload`.
#[derive(Serialize, Clone)]
struct DragDropPayload {
    #[serde(skip_serializing_if = "Option::is_none")]
    paths: Option<Vec<PathBuf>>,
    position: PhysicalPosition<f64>,
}

#[derive(Default)]
struct DragDropState {
    /// Raw HWND values that already have our drop target registered.
    registered: Mutex<Vec<isize>>,
}

fn window_class(hwnd: HWND) -> String {
    let mut buf = [0u16; 256];
    let len = unsafe { GetClassNameW(hwnd, &mut buf) };
    String::from_utf16_lossy(&buf[..len as usize])
}

struct RegisterCtx<'a> {
    app: &'a AppHandle,
    label: String,
    state: &'a DragDropState,
    render_widget_done: bool,
}

/// Registers our drop target on every descendant HWND of the main window.
/// Returns `true` once the WebView2 render widget HWND has been registered
/// (it is created asynchronously by the browser process, so callers retry
/// until this succeeds).
fn ensure_targets(app: &AppHandle, container: HWND, state: &DragDropState) -> bool {
    let Some(window) = app.get_webview_window("main") else {
        return false;
    };
    let mut ctx = RegisterCtx {
        app,
        label: window.label().to_string(),
        state,
        render_widget_done: false,
    };

    unsafe extern "system" fn callback(child: HWND, lparam: LPARAM) -> BOOL {
        let ctx = unsafe { &mut *(lparam.0 as *mut RegisterCtx<'_>) };
        if ctx
            .state
            .registered
            .lock()
            .map(|list| list.contains(&(child.0 as isize)))
            .unwrap_or(true)
        {
            return true.into();
        }

        let target: IDropTarget =
            BrumaDropTarget::new(child, ctx.app.clone(), ctx.label.clone()).into();
        // Override whatever target exists (WebView2's own or wry's) — ours
        // emits the same `tauri://drag-*` events plus the AllowedPaths grant.
        let _ = unsafe { RevokeDragDrop(child) };
        if unsafe { RegisterDragDrop(child, &target) }.is_ok() {
            if let Ok(mut list) = ctx.state.registered.lock() {
                list.push(child.0 as isize);
            }
            if window_class(child) == RENDER_WIDGET_CLASS {
                ctx.render_widget_done = true;
            }
            // The registration must outlive the HWND; the process owns the
            // target until exit.
            std::mem::forget(target);
        }
        true.into()
    }

    let lparam = LPARAM(&mut ctx as *mut RegisterCtx<'_> as isize);
    let _ = unsafe { EnumChildWindows(Some(container), Some(callback), lparam) };
    ctx.render_widget_done
}

/// Installs the workaround on the main window. Must be called during `setup`.
pub fn install(app: &AppHandle) {
    let Some(window) = app.get_webview_window("main") else {
        return;
    };
    let Ok(container) = window.hwnd() else {
        return;
    };
    let container_raw = container.0 as isize;

    app.manage(DragDropState::default());
    ensure_targets(app, container, app.state::<DragDropState>().inner());

    // The WebView2 render widget HWND is created asynchronously; retry until
    // it is registered (bounded so we do not loop forever on failure).
    let app_retry = app.clone();
    std::thread::spawn(move || {
        for _ in 0..80 {
            std::thread::sleep(Duration::from_millis(250));
            let done = Arc::new(AtomicBool::new(false));
            let done_clone = done.clone();
            let app2 = app_retry.clone();
            if app_retry
                .run_on_main_thread(move || {
                    let state = app2.state::<DragDropState>();
                    if ensure_targets(&app2, HWND(container_raw as _), state.inner()) {
                        done_clone.store(true, Ordering::SeqCst);
                    }
                })
                .is_err()
            {
                break;
            }
            if done.load(Ordering::SeqCst) {
                break;
            }
        }
    });

    // WebView2 can recreate its child HWNDs later (GPU reset, navigation);
    // re-register on window geometry changes.
    let app_events = app.clone();
    window.on_window_event(move |event| {
        if !matches!(
            event,
            WindowEvent::Resized(_)
                | WindowEvent::Moved(_)
                | WindowEvent::ScaleFactorChanged { .. }
        ) {
            return;
        }
        if let Some(window) = app_events.get_webview_window("main") {
            if let Ok(hwnd) = window.hwnd() {
                let state = app_events.state::<DragDropState>();
                let _ = ensure_targets(&app_events, hwnd, state.inner());
            }
        }
    });
}

fn iterate_filenames(data_obj: &IDataObject, mut callback: impl FnMut(PathBuf)) -> Option<HDROP> {
    let drop_format = FORMATETC {
        cfFormat: CF_HDROP.0,
        ptd: std::ptr::null_mut(),
        dwAspect: DVASPECT_CONTENT.0,
        lindex: -1,
        tymed: TYMED_HGLOBAL.0 as u32,
    };

    match unsafe { data_obj.GetData(&drop_format) } {
        Ok(medium) => {
            let hdrop = HDROP(unsafe { medium.u.hGlobal }.0 as _);
            let item_count = unsafe { DragQueryFileW(hdrop, 0xFFFFFFFF, None) };
            for i in 0..item_count {
                let character_count = unsafe { DragQueryFileW(hdrop, i, None) } as usize;
                let mut path_buf = vec![0u16; character_count + 1];
                unsafe { DragQueryFileW(hdrop, i, Some(&mut path_buf)) };
                callback(OsString::from_wide(&path_buf[..character_count]).into());
            }
            Some(hdrop)
        }
        Err(_) => None,
    }
}

#[implement(IDropTarget)]
struct BrumaDropTarget {
    hwnd: HWND,
    app: AppHandle,
    label: String,
    enter_is_valid: UnsafeCell<bool>,
    cursor_effect: UnsafeCell<DROPEFFECT>,
}

impl BrumaDropTarget {
    fn new(hwnd: HWND, app: AppHandle, label: String) -> Self {
        Self {
            hwnd,
            app,
            label,
            enter_is_valid: UnsafeCell::new(false),
            cursor_effect: UnsafeCell::new(DROPEFFECT_NONE),
        }
    }

    fn client_position(&self, pt: &POINTL) -> PhysicalPosition<f64> {
        let mut pt = POINT { x: pt.x, y: pt.y };
        let _ = unsafe { ScreenToClient(self.hwnd, &mut pt) };
        PhysicalPosition::new(pt.x as f64, pt.y as f64)
    }

    fn emit(&self, event: &str, payload: &DragDropPayload) {
        // Mirrors `Window::emit_to_window` — a single emit matching Window or
        // WebviewWindow listeners for this label.
        let label = self.label.clone();
        let _ = self
            .app
            .emit_filter(event, payload, move |target| match target {
                EventTarget::Window { label: l } | EventTarget::WebviewWindow { label: l } => {
                    l == &label
                }
                _ => false,
            });
    }
}

#[allow(non_snake_case)]
impl IDropTarget_Impl for BrumaDropTarget_Impl {
    fn DragEnter(
        &self,
        pDataObj: windows::core::Ref<'_, IDataObject>,
        _grfKeyState: MODIFIERKEYS_FLAGS,
        pt: &POINTL,
        pdwEffect: *mut DROPEFFECT,
    ) -> windows::core::Result<()> {
        let mut paths = Vec::new();
        let hdrop = iterate_filenames(
            pDataObj.as_ref().expect("Received null IDataObject"),
            |path| paths.push(path),
        );
        let valid = hdrop.is_some();
        unsafe { *self.enter_is_valid.get() = valid };
        if !valid {
            return Ok(());
        }

        self.emit(
            DRAG_ENTER_EVENT,
            &DragDropPayload {
                paths: Some(paths),
                position: self.client_position(pt),
            },
        );

        unsafe {
            *pdwEffect = DROPEFFECT_COPY;
            *self.cursor_effect.get() = DROPEFFECT_COPY;
        }
        Ok(())
    }

    fn DragOver(
        &self,
        _grfKeyState: MODIFIERKEYS_FLAGS,
        pt: &POINTL,
        pdwEffect: *mut DROPEFFECT,
    ) -> windows::core::Result<()> {
        if unsafe { *self.enter_is_valid.get() } {
            self.emit(
                DRAG_OVER_EVENT,
                &DragDropPayload {
                    paths: None,
                    position: self.client_position(pt),
                },
            );
        }
        unsafe { *pdwEffect = *self.cursor_effect.get() };
        Ok(())
    }

    fn DragLeave(&self) -> windows::core::Result<()> {
        if unsafe { *self.enter_is_valid.get() } {
            let label = self.label.clone();
            let _ =
                self.app
                    .emit_filter(DRAG_LEAVE_EVENT, (), move |target| match target {
                        EventTarget::Window { label: l }
                        | EventTarget::WebviewWindow { label: l } => l == &label,
                        _ => false,
                    });
        }
        unsafe { *self.enter_is_valid.get() = false };
        Ok(())
    }

    fn Drop(
        &self,
        pDataObj: windows::core::Ref<'_, IDataObject>,
        _grfKeyState: MODIFIERKEYS_FLAGS,
        pt: &POINTL,
        _pdwEffect: *mut DROPEFFECT,
    ) -> windows::core::Result<()> {
        if unsafe { *self.enter_is_valid.get() } {
            let mut paths = Vec::new();
            let hdrop = iterate_filenames(
                pDataObj.as_ref().expect("Received null IDataObject"),
                |path| paths.push(path),
            );

            // Same grant the `WindowEvent::DragDrop` handler in lib.rs applies
            // to wry-driven drops: our custom target bypasses that path.
            if let Some(allowed) = self.app.try_state::<AllowedPaths>() {
                for path in &paths {
                    let _ = allowed.grant_parent(path);
                }
            }

            self.emit(
                DRAG_DROP_EVENT,
                &DragDropPayload {
                    paths: Some(paths),
                    position: self.client_position(pt),
                },
            );

            if let Some(hdrop) = hdrop {
                unsafe { DragFinish(hdrop) };
            }
        }
        unsafe { *self.enter_is_valid.get() = false };
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn drop_payload_serializes_like_tauri_drag_drop() {
        // The frontend `onDragDropEvent` mapper expects
        // `{ paths: string[], position: { x: number, y: number } }`.
        let payload = DragDropPayload {
            paths: Some(vec![PathBuf::from("C:\\docs\\a.md")]),
            position: PhysicalPosition::new(12.0, 34.0),
        };
        let json = serde_json::to_value(&payload).unwrap();
        assert_eq!(json["paths"][0], "C:\\docs\\a.md");
        assert_eq!(json["position"]["x"], 12.0);
        assert_eq!(json["position"]["y"], 34.0);
    }

    #[test]
    fn over_payload_omits_paths() {
        let payload = DragDropPayload {
            paths: None,
            position: PhysicalPosition::new(1.0, 2.0),
        };
        let json = serde_json::to_value(&payload).unwrap();
        assert!(json.get("paths").is_none());
        assert_eq!(json["position"]["x"], 1.0);
    }
}
