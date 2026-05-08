// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{tray::TrayIconBuilder, Manager, RunEvent, WindowEvent};

fn main() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .setup(|app| {
            TrayIconBuilder::with_id("timetray-main")
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("TimeTray — Click to switch tasks")
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| {
                    // "Open Dashboard" is handled here in Rust because calling
                    // getCurrentWindow().show() from a JS action callback is unreliable
                    // when the window is hidden. All other items use JS action callbacks.
                    if event.id.as_ref() == "tray:show" {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|_app_handle, event| {
        if let RunEvent::ExitRequested { api, .. } = event {
            api.prevent_exit();
        }
    });
}
