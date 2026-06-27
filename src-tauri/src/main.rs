#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    bruma_lib::linux::configure_webkit_workarounds();
    bruma_lib::run();
}
