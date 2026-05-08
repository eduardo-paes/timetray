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
                .on_menu_event(|app, event| {
                    let id: &str = event.id.as_ref();
                    println!("[TimeTray] menu click: '{id}'");

                    let Some(window) = app.get_webview_window("main") else {
                        println!("[TimeTray] ERROR: main window not found");
                        return;
                    };

                    if let Some(task_id) = id.strip_prefix("task:") {
                        println!("[TimeTray] window.emit tray:switch-task -> {task_id}");
                        let _ = window.emit("tray:switch-task", task_id.to_string());
                    } else {
                        match id {
                            "tray:stop" => {
                                println!("[TimeTray] window.emit tray:stop");
                                let _ = window.emit("tray:stop", ());
                            }
                            "tray:show" => {
                                println!("[TimeTray] showing window");
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                            other => {
                                println!("[TimeTray] unhandled: '{other}'");
                            }
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
