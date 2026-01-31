mod commands;

use tauri::menu::{MenuBuilder, SubmenuBuilder, PredefinedMenuItem};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![
            // Database commands
            commands::database::init_database,
            commands::database::create_project,
            commands::database::get_projects,
            commands::database::update_project,
            commands::database::delete_project,
            commands::database::create_board,
            commands::database::get_boards,
            commands::database::save_canvas_snapshot,
            commands::database::load_canvas_snapshot,
            commands::database::create_card,
            commands::database::get_cards,
            commands::database::update_card,
            commands::database::delete_card,
            commands::database::search_content,
            commands::database::get_app_data_dir,
            commands::database::ensure_directory_structure,
            // FTS5 commands
            commands::database::fts_search,
            commands::database::fts_index_entity,
            commands::database::fts_remove_entity,
            commands::database::fts_rebuild_index,
            // Asset management commands
            commands::database::get_assets_dir,
            commands::database::copy_file_to_assets,
            commands::database::delete_asset_file,
            commands::database::get_asset_path,
            commands::database::save_bytes_to_assets,
        ])
        .setup(|app| {
            // Create Edit menu with clipboard accelerators
            let edit_menu = SubmenuBuilder::new(app, "Edit")
                .item(&PredefinedMenuItem::undo(app, Some("Undo"))?)
                .item(&PredefinedMenuItem::redo(app, Some("Redo"))?)
                .separator()
                .item(&PredefinedMenuItem::cut(app, Some("Cut"))?)
                .item(&PredefinedMenuItem::copy(app, Some("Copy"))?)
                .item(&PredefinedMenuItem::paste(app, Some("Paste"))?)
                .separator()
                .item(&PredefinedMenuItem::select_all(app, Some("Select All"))?)
                .build()?;

            let menu = MenuBuilder::new(app)
                .item(&edit_menu)
                .build()?;

            // Set the menu for all windows
            app.set_menu(menu)?;

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
