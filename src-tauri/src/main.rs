// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{tray::TrayIconBuilder, Emitter, Manager, RunEvent, WindowEvent};

fn main() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .setup(|app| {
            TrayIconBuilder::with_id("timetray-main")
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("TimeTray — Click to switch tasks")
                .show_menu_on_left_click(true)
                .build(app)?;
            Ok(())
        })
        // Menu clicks are handled here in Rust so they work even when the window is hidden.
        // The JS action callbacks on MenuItem are unreliable when WebView2 is throttled.
        .on_menu_event(|app, event| {
            let id = event.id.0.as_str();
            if let Some(task_id) = id.strip_prefix("task:") {
                let _ = app.emit("tray:switch-task", task_id.to_string());
            } else if id == "tray:stop" {
                let _ = app.emit("tray:stop", ());
            } else if id == "tray:show" {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
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
