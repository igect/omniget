use tauri::command;
use std::process::Command;
use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Profile {
    pub url: String,
    pub username: Option<String>,
    pub platform: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DownloadResult {
    pub success: bool,
    pub message: String,
    pub files_count: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DownloadStats {
    pub total_downloads: u32,
    pub total_files: u32,
    pub success_rate: f64,
}

// Check Python dependencies
#[command]
pub fn check_python_dependencies() -> Result<String, String> {
    let python_check = Command::new("python")
        .arg("--version")
        .output()
        .map_err(|e| format!("Python not found: {}", e))?;

    if !python_check.status.success() {
        return Err("Python is not installed".to_string());
    }

    let gallery_check = Command::new("gallery-dl")
        .arg("--version")
        .output()
        .map_err(|e| format!("gallery-dl not found: {}", e))?;

    if !gallery_check.status.success() {
        return Err("gallery-dl is not installed".to_string());
    }

    Ok("All dependencies OK".to_string())
}

// Run gallery-dl download
#[command]
pub fn run_gallery_dl_download(
    url: String,
    output_dir: String,
    cookies_file: Option<String>,
    content_type: String,
) -> Result<DownloadResult, String> {
    let mut cmd = Command::new("gallery-dl");
    cmd.arg("-d").arg(&output_dir);

    match content_type.as_str() {
        "photos" => {
            cmd.arg("--filter").arg("extension in ('jpg','jpeg','png','gif','webp')");
        }
        "videos" => {
            cmd.arg("--filter").arg("extension in ('mp4','webm','mkv','mov')");
        }
        "all" => {}
        _ => {}
    }

    if let Some(cookies) = cookies_file {
        cmd.arg("--cookies").arg(cookies);
    }

    cmd.arg("--sleep-request").arg("2");
    cmd.arg(&url);

    let output = cmd.output()
        .map_err(|e| format!("Failed to execute gallery-dl: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    if output.status.success() {
        let files_count = stdout.matches("[").count() as u32;
        
        Ok(DownloadResult {
            success: true,
            message: stdout.to_string(),
            files_count: Some(files_count),
        })
    } else {
        Err(format!("Download failed: {}", stderr))
    }
}

// Load profiles
#[command]
pub fn load_profiles(platform: String) -> Result<Vec<Profile>, String> {
    let config_dir = dirs::data_local_dir()
        .ok_or("Could not find data directory")?
        .join("OpenMint")
        .join("profiles.json");

    if !config_dir.exists() {
        return Ok(vec![]);
    }

    let content = fs::read_to_string(&config_dir)
        .map_err(|e| format!("Failed to read profiles: {}", e))?;

    let all_profiles: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse profiles: {}", e))?;

    let platform_profiles = all_profiles
        .get(&platform)
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|v| serde_json::from_value(v.clone()).ok())
                .collect()
        })
        .unwrap_or_default();

    Ok(platform_profiles)
}

// Save profile
#[command]
pub fn save_profile(platform: String, url: String) -> Result<String, String> {
    let config_dir = dirs::data_local_dir()
        .ok_or("Could not find data directory")?
        .join("OpenMint");

    fs::create_dir_all(&config_dir)
        .map_err(|e| format!("Failed to create config dir: {}", e))?;

    let profiles_file = config_dir.join("profiles.json");

    let mut all_profiles: serde_json::Value = if profiles_file.exists() {
        let content = fs::read_to_string(&profiles_file)
            .unwrap_or_else(|_| "{}".to_string());
        serde_json::from_str(&content).unwrap_or(serde_json::json!({}))
    } else {
        serde_json::json!({})
    };

    let new_profile = serde_json::json!({
        "url": url,
        "platform": platform,
        "added_at": chrono::Utc::now().timestamp()
    });

    if let Some(arr) = all_profiles
        .as_object_mut()
        .and_then(|obj| obj.get_mut(&platform))
        .and_then(|v| v.as_array_mut())
    {
        arr.push(new_profile);
    } else {
        if let Some(obj) = all_profiles.as_object_mut() {
            obj.insert(platform.clone(), serde_json::json!([new_profile]));
        }
    }

    let content = serde_json::to_string_pretty(&all_profiles)
        .map_err(|e| format!("Failed to serialize: {}", e))?;

    fs::write(&profiles_file, content)
        .map_err(|e| format!("Failed to write profiles: {}", e))?;

    Ok("Profile saved successfully".to_string())
}

// Delete profile
#[command]
pub fn delete_profile(platform: String, index: usize) -> Result<String, String> {
    let config_dir = dirs::data_local_dir()
        .ok_or("Could not find data directory")?
        .join("OpenMint")
        .join("profiles.json");

    if !config_dir.exists() {
        return Err("Profiles file not found".to_string());
    }

    let content = fs::read_to_string(&config_dir)
        .map_err(|e| format!("Failed to read profiles: {}", e))?;

    let mut all_profiles: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse profiles: {}", e))?;

    if let Some(arr) = all_profiles
        .as_object_mut()
        .and_then(|obj| obj.get_mut(&platform))
        .and_then(|v| v.as_array_mut())
    {
        if index < arr.len() {
            arr.remove(index);
        } else {
            return Err("Profile index out of bounds".to_string());
        }
    } else {
        return Err("Platform not found".to_string());
    }

    let content = serde_json::to_string_pretty(&all_profiles)
        .map_err(|e| format!("Failed to serialize: {}", e))?;

    fs::write(&config_dir, content)
        .map_err(|e| format!("Failed to write profiles: {}", e))?;

    Ok("Profile deleted".to_string())
}

// Setup folder structure
#[command]
pub fn setup_openmint_folders(base_dir: String, cookies_dir: String) -> Result<String, String> {
    let base_path = PathBuf::from(base_dir);
    let cookies_path = PathBuf::from(cookies_dir);

    fs::create_dir_all(&base_path)
        .map_err(|e| format!("Failed to create base dir: {}", e))?;
    fs::create_dir_all(&cookies_path)
        .map_err(|e| format!("Failed to create cookies dir: {}", e))?;

    let platforms = vec!["instagram", "tiktok", "facebook", "x"];

    for platform in &platforms {
        let platform_dir = base_path.join(platform);
        fs::create_dir_all(&platform_dir)
            .map_err(|e| format!("Failed to create platform dir: {}", e))?;

        let profile_file = base_path.join(format!("{}_profiles.txt", platform));
        if !profile_file.exists() {
            fs::write(&profile_file, format!("# Add {} profile URLs here\n", platform))
                .map_err(|e| format!("Failed to create profile file: {}", e))?;
        }

        let cookie_file = cookies_path.join(format!("{}.com_cookies.txt", platform));
        if !cookie_file.exists() {
            fs::write(&cookie_file, format!("# Add {} cookies here\n", platform))
                .map_err(|e| format!("Failed to create cookie file: {}", e))?;
        }
    }

    Ok("Folder structure created successfully".to_string())
}
