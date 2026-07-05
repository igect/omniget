use tauri::{command, Emitter, AppHandle};
use std::process::{Command, Stdio};
use std::fs;
use std::path::PathBuf;
use std::io::{BufRead, BufReader};
use serde::{Deserialize, Serialize};
use chrono::Utc;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Profile {
    pub url: String,
    pub username: Option<String>,
    pub platform: String,
    pub added_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DownloadResult {
    pub success: bool,
    pub message: String,
    pub files_count: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DownloadProgress {
    pub progress: u32,
    pub message: String,
    pub files_downloaded: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppSettings {
    pub output_directory: Option<String>,
    pub cookies_file: Option<String>,
}

// Check Python dependencies (hidden window)
#[command]
pub fn check_python_dependencies() -> Result<String, String> {
    let mut python_cmd = Command::new("python");
    #[cfg(target_os = "windows")]
    python_cmd.creation_flags(0x08000000);
    
    let python_check = python_cmd
        .arg("--version")
        .output()
        .map_err(|e| format!("Python not found: {}", e))?;

    if !python_check.status.success() {
        return Err("Python is not installed".to_string());
    }

    let mut gallery_cmd = Command::new("gallery-dl");
    #[cfg(target_os = "windows")]
    gallery_cmd.creation_flags(0x08000000);
    
    let gallery_check = gallery_cmd
        .arg("--version")
        .output()
        .map_err(|e| format!("gallery-dl not found: {}", e))?;

    if !gallery_check.status.success() {
        return Err("gallery-dl is not installed".to_string());
    }

    Ok("All dependencies OK".to_string())
}

// Run gallery-dl download asynchronously
#[command]
pub async fn run_gallery_dl_download(
    app: AppHandle,
    url: String,
    output_dir: String,
    cookies_file: Option<String>,
    content_type: String,
    download_id: String,
) -> Result<DownloadResult, String> {
    // Create output directory if it doesn't exist
    fs::create_dir_all(&output_dir)
        .map_err(|e| format!("Failed to create output directory: {}", e))?;

    let mut cmd = Command::new("gallery-dl");
    
    #[cfg(target_os = "windows")]
    cmd.creation_flags(0x08000000);
    
    cmd.arg("-d").arg(&output_dir);
    
    match content_type.as_str() {
        "photos" => {
            cmd.arg("--filter").arg("extension in ('jpg', 'jpeg', 'png', 'gif', 'webp')");
        }
        "videos" => {
            cmd.arg("--filter").arg("extension in ('mp4', 'webm', 'mkv', 'mov', 'avi')");
        }
        _ => {}
    }

    if let Some(cookies) = cookies_file {
        if !cookies.is_empty() {
            cmd.arg("--cookies").arg(&cookies);
        }
    }

    cmd.arg("--sleep-request").arg("2");
    cmd.arg(&url);

    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());

    let mut child = cmd.spawn()
        .map_err(|e| format!("Failed to start gallery-dl: {}", e))?;

    let mut files_downloaded = 0u32;
    let mut last_message = String::new();

    // Read stderr asynchronously
    if let Some(stderr) = child.stderr.take() {
        let reader = BufReader::new(stderr);
        let app_clone = app.clone();
        let download_id_clone = download_id.clone();
        
        for line in reader.lines() {
            if let Ok(line) = line {
                last_message = line.clone();
                
                // Count files more accurately
                if line.contains("[#") || 
                   line.contains("Downloading") || 
                   line.contains(".jpg") || 
                   line.contains(".png") ||
                   line.contains(".mp4") {
                    files_downloaded += 1;
                }
                
                // Emit progress event
                let _ = app_clone.emit(&format!("download_{}", download_id_clone), DownloadProgress {
                    progress: 0,
                    message: line.clone(),
                    files_downloaded,
                });
            }
        }
    }

    let status = child.wait()
        .map_err(|e| format!("Download process failed: {}", e))?;

    if status.success() {
        Ok(DownloadResult {
            success: true,
            message: format!("Download completed successfully. {} files downloaded.", files_downloaded),
            files_count: files_downloaded,
        })
    } else {
        let error_msg = if !last_message.is_empty() {
            last_message
        } else {
            format!("gallery-dl exited with code {}", status.code().unwrap_or(-1))
        };
        Err(error_msg)
    }
}

// Save app settings
#[command]
pub fn save_app_settings(
    output_directory: Option<String>,
    cookies_file: Option<String>,
) -> Result<String, String> {
    let settings = AppSettings {
        output_directory,
        cookies_file,
    };

    let config_dir = dirs::data_local_dir()
        .ok_or("Could not find data directory")?
        .join("OpenMint");

    fs::create_dir_all(&config_dir)
        .map_err(|e| format!("Failed to create config dir: {}", e))?;

    let settings_file = config_dir.join("app_settings.json");

    let content = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;

    fs::write(&settings_file, content)
        .map_err(|e| format!("Failed to write settings: {}", e))?;

    Ok("Settings saved successfully".to_string())
}

// Load app settings
#[command]
pub fn load_app_settings() -> Result<AppSettings, String> {
    let settings_file = dirs::data_local_dir()
        .ok_or("Could not find data directory")?
        .join("OpenMint")
        .join("app_settings.json");

    if !settings_file.exists() {
        return Ok(AppSettings {
            output_directory: None,
            cookies_file: None,
        });
    }

    let content = fs::read_to_string(&settings_file)
        .map_err(|e| format!("Failed to read settings: {}", e))?;

    let settings: AppSettings = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse settings: {}", e))?;

    Ok(settings)
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

// Save profile with validation
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

    let username = if url.starts_with("http") {
        url.split('/').filter(|s| !s.is_empty()).last().map(|s| s.to_string())
    } else {
        Some(url.clone())
    };

    if let Some(arr) = all_profiles
        .as_object()
        .and_then(|obj| obj.get(&platform))
        .and_then(|v| v.as_array())
    {
        for profile in arr {
            if let Some(existing_url) = profile.get("url").and_then(|v| v.as_str()) {
                if existing_url == url {
                    return Err("Profile already exists".to_string());
                }
            }
        }
    }

    let new_profile = serde_json::json!({
        "url": url,
        "username": username,
        "platform": platform,
        "added_at": Utc::now().timestamp()
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
