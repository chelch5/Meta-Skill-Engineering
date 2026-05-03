use serde::Serialize;
use std::path::PathBuf;
use std::process::Command;
use tauri::Manager;

#[derive(Serialize)]
struct StudioActionResult {
    ok: bool,
    stdout: String,
    stderr: String,
    exit_code: i32,
}

#[tauri::command]
fn run_studio_action(action: String, args: Vec<String>, app: tauri::AppHandle) -> Result<StudioActionResult, String> {
    let repo_root = resolve_repo_root(&app)?;
    let script = repo_root.join("scripts").join("meta-skill-studio.py");
    let python = if cfg!(target_os = "windows") { "python" } else { "python3" };
    let mut command = Command::new(python);
    command
        .current_dir(&repo_root)
        .arg(&script)
        .arg("--mode")
        .arg("cli")
        .arg("--action")
        .arg(action);

    for arg in args {
        command.arg(arg);
    }

    let output = command.output().map_err(|error| error.to_string())?;
    let exit_code = output.status.code().unwrap_or(1);
    Ok(StudioActionResult {
        ok: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code,
    })
}

fn resolve_repo_root(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let exe = app
        .path()
        .resolve("", tauri::path::BaseDirectory::Resource)
        .map_err(|error| error.to_string())?;
    let mut current = exe.as_path();
    for _ in 0..8 {
        if current.join("scripts").join("meta-skill-studio.py").exists() {
            return Ok(current.to_path_buf());
        }
        if let Some(parent) = current.parent() {
            current = parent;
        } else {
            break;
        }
    }
    std::env::current_dir().map_err(|error| error.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![run_studio_action])
        .run(tauri::generate_context!())
        .expect("failed to run Meta Skill Studio");
}
