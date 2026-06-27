#[cfg(target_os = "linux")]
pub fn configure_webkit_workarounds() {
    // WebKitGTK on Ubuntu 24.04+ can render a blank window when the DMABUF renderer
    // or accelerated compositing disagrees with the GPU driver (common on NVIDIA).
    // Respect explicit user overrides, including `WEBKIT_DISABLE_*=0`.
    if std::env::var_os("WEBKIT_DISABLE_DMABUF_RENDERER").is_none() {
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
    }
    if std::env::var_os("WEBKIT_DISABLE_COMPOSITING_MODE").is_none() {
        std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
    }
    if std::env::var_os("__NV_DISABLE_EXPLICIT_SYNC").is_none() {
        std::env::set_var("__NV_DISABLE_EXPLICIT_SYNC", "1");
    }
}

#[cfg(not(target_os = "linux"))]
pub fn configure_webkit_workarounds() {}
