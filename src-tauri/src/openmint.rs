use tauri::{command, Emitter};
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

#[derive(Debug, Serialize, Deserialize)]
pub struct DownloadResult {
    pub success: bool,
    pub message: String,
    pub files_count: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DownloadProgress {
    pub progress: u32,
    pub message: String,
    pub files_downloaded: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DownloadStats {
    pub total_downloads: u32,
    pub total_files: u32,
    pub success_rate: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QueuedDownload {
    pub id: String,
    pub url: String,
    pub platform: String,
    pub content_type: String,
    pub output_dir: String,
    pub cookies_file: Option<String>,
    pub status: String,
    pub progress: u32,
    pub files_downloaded: u32,
    pub created_at: i64,
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

// Validate profile URL
#[command]
pub fn validate_profile_url(url: String, platform: String) -> Result<String, String> {
    // Basic URL validation
    if url.is_empty() {
        return Err("URL cannot be empty".to_string());
    }

    // Check if it's a valid URL or username
    let is_url = url.starts_with("http://") || url.starts_with("https://");
    
    if !is_url {
        // It's a username, validate format
        if !url.chars().all(|c| c.is_alphanumeric() || c == '_' || c == '.') {
            return Err("Username can only contain letters, numbers, underscores, and dots".to_string());
        }
        if url.len() < 3 || url.len() > 30 {
            return Err("Username must be between 3 and 30 characters".to_string());
        }
        return Ok(format!("Valid username: {}", url));
    }

    // Validate URL format
    let lower_url = url.to_lowercase();
    let platform_lower = platform.to_lowercase();
    
    let valid_domains = match platform_lower.as_str() {
        "instagram" => vec!["instagram.com"],
        "tiktok" => vec!["tiktok.com"],
        "facebook" => vec!["facebook.com", "fb.com"],
        "x" => vec!["twitter.com", "x.com"],
        _ => vec![],
    };

    if valid_domains.is_empty() {
        return Err(format!("Unsupported platform: {}", platform));
    }

    for domain in valid_domains {
        if lower_url.contains(domain) {
            return Ok(format!("Valid {} URL", platform));
        }
    }

    Err(format!("URL does not appear to be a valid {} profile", platform))
}

#[command]
pub fn run_gallery_dl_download(
    app: tauri::AppHandle,
    url: String,
    output_dir: String,
    cookies_file: Option<String>,
    content_type: String,
    download_id: String,
) -> Result<DownloadResult, String> {
    let mut cmd = Command::new("gallery-dl");
    
    #[cfg(target_os = "windows")]
    cmd.creation_flags(0x08000000);
    
    cmd.arg("-d").arg(&output_dir);
    cmd.arg("--no-progress");  // Changed from --progress
    
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

    // Set stdout to null to prevent the process from hanging when the pipe fills up
    cmd.stdout(Stdio::null());
    cmd.stderr(Stdio::piped());

    let mut child = cmd.spawn()
        .map_err(|e| format!("Failed to start gallery-dl: {}", e))?;

    let mut stderr_output = String::new();
    let mut files_downloaded = 0u32;

    // Read stderr
    if let Some(stderr) = child.stderr.take() {
        let reader = BufReader::new(stderr);
        for line in reader.lines() {
            if let Ok(line) = line {
                stderr_output.push_str(&line);
                stderr_output.push('\n');
                
                if line.contains("[#") || line.contains("Downloading") {
                    files_downloaded += 1;
                }
                
                let _ = app.emit(&format!("download_{}", download_id), DownloadProgress {
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
            message: format!("Download completed. {} files.", files_downloaded),
            files_count: Some(files_downloaded),
        })
    } else {
        // ✅ Return ACTUAL error from gallery-dl
        let error_msg = if !stderr_output.is_empty() {
            stderr_output.trim().to_string()
        } else {
            format!("gallery-dl exited with code {}", status.code().unwrap_or(-1))
        };
        Err(error_msg)
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

// Save profile with validation
#[command]
pub fn save_profile(platform: String, url: String) -> Result<String, String> {
    // Validate URL first
    let _ = validate_profile_url(url.clone(), platform.clone())?;

    let config_dir = dirs::data_local_dir()
        .ok_or("Could not find data directory")?
        .join("OpenMint");

    fs::create_dir_all(&config_dir)
        .map_err(|e| format!("Failed to create config dir: {}", e))?;

    let profiles_file = config_dir.join("profiles.json");

    // Load existing profiles or create empty
    let mut all_profiles: serde_json::Value = if profiles_file.exists() {
        let content = fs::read_to_string(&profiles_file)
            .unwrap_or_else(|_| "{}".to_string());
        serde_json::from_str(&content).unwrap_or(serde_json::json!({}))
    } else {
        serde_json::json!({})
    };

    // Extract username from URL
    let username = if url.starts_with("http") {
        url.split('/').filter(|s| !s.is_empty()).last().map(|s| s.to_string())
    } else {
        Some(url.clone())
    };

    // Check for duplicates
    if let Some(arr) = all_profiles
        .as_object()
        .and_then(|obj| obj.get(&platform))
        .and_then(|v| v.as_array())
    {
        for profile in arr {
            if let Some(existing_url) = profile.get("url").and_then(|v| v.as_str()) {
                if existing_url == url || existing_url.contains(&username.clone().unwrap_or_default()) {
                    return Err("Profile already exists".to_string());
                }
            }
        }
    }

    // Add new profile
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

    // Save back to file
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

// Get download statistics
#[command]
pub fn get_download_stats() -> Result<DownloadStats, String> {
    let stats_file = dirs::data_local_dir()
        .ok_or("Could not find data directory")?
        .join("OpenMint")
        .join("download_stats.json");

    if !stats_file.exists() {
        return Ok(DownloadStats {
            total_downloads: 0,
            total_files: 0,
            success_rate: 100.0,
        });
    }

    let content = fs::read_to_string(&stats_file)
        .map_err(|e| format!("Failed to read stats: {}", e))?;

    let stats: DownloadStats = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse stats: {}", e))?;

    Ok(stats)
}

// Save download statistics
#[command]
pub fn save_download_stats(stats: DownloadStats) -> Result<String, String> {
    let stats_file = dirs::data_local_dir()
        .ok_or("Could not find data directory")?
        .join("OpenMint")
        .join("download_stats.json");

    let content = serde_json::to_string_pretty(&stats)
        .map_err(|e| format!("Failed to serialize stats: {}", e))?;

    fs::write(&stats_file, content)
        .map_err(|e| format!("Failed to write stats: {}", e))?;

    Ok("Stats saved".to_string())
}
