use crate::sensevoice_engine::{DownloadProgress, ModelInfo, ModelStatus, SenseVoiceEngine};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{command, AppHandle, Emitter, Manager, Runtime};

pub static SENSEVOICE_ENGINE: Mutex<Option<Arc<SenseVoiceEngine>>> = Mutex::new(None);

static MODELS_DIR: Mutex<Option<PathBuf>> = Mutex::new(None);

pub fn set_models_directory<R: Runtime>(app: &AppHandle<R>) {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .expect("Failed to get app data dir");

    let models_dir = app_data_dir.join("models");
    if !models_dir.exists() {
        if let Err(e) = std::fs::create_dir_all(&models_dir) {
            log::error!("Failed to create models directory: {}", e);
            return;
        }
    }

    log::info!(
        "SenseVoice models directory set to: {}",
        models_dir.display()
    );
    *MODELS_DIR.lock().unwrap() = Some(models_dir);
}

fn get_models_directory() -> Option<PathBuf> {
    MODELS_DIR.lock().unwrap().clone()
}

#[command]
pub async fn sensevoice_init() -> Result<(), String> {
    let mut guard = SENSEVOICE_ENGINE.lock().unwrap();
    if guard.is_some() {
        return Ok(());
    }

    let engine = SenseVoiceEngine::new_with_models_dir(get_models_directory())
        .map_err(|e| format!("Failed to initialize SenseVoice engine: {}", e))?;
    *guard = Some(Arc::new(engine));
    Ok(())
}

#[command]
pub async fn sensevoice_get_available_models() -> Result<Vec<ModelInfo>, String> {
    let engine = get_engine()?;
    engine
        .discover_models()
        .await
        .map_err(|e| format!("Failed to discover SenseVoice models: {}", e))
}

#[command]
pub async fn sensevoice_load_model<R: Runtime>(
    app_handle: AppHandle<R>,
    model_name: String,
) -> Result<(), String> {
    let engine = get_engine()?;

    let _ = app_handle.emit(
        "sensevoice-model-loading-started",
        serde_json::json!({ "modelName": model_name }),
    );

    let result = engine
        .load_model(&model_name)
        .await
        .map_err(|e| format!("Failed to load SenseVoice model: {}", e));

    let event = if result.is_ok() {
        "sensevoice-model-loading-completed"
    } else {
        "sensevoice-model-loading-failed"
    };

    let _ = app_handle.emit(
        event,
        serde_json::json!({
            "modelName": model_name,
            "error": result.as_ref().err()
        }),
    );

    result
}

#[command]
pub async fn sensevoice_get_current_model() -> Result<Option<String>, String> {
    Ok(get_engine()?.get_current_model().await)
}

#[command]
pub async fn sensevoice_is_model_loaded() -> Result<bool, String> {
    Ok(get_engine()?.is_model_loaded().await)
}

#[command]
pub async fn sensevoice_has_available_models() -> Result<bool, String> {
    let models = get_engine()?
        .discover_models()
        .await
        .map_err(|e| format!("Failed to discover SenseVoice models: {}", e))?;
    Ok(models
        .iter()
        .any(|model| matches!(model.status, ModelStatus::Available)))
}

#[command]
pub async fn sensevoice_validate_model_ready() -> Result<String, String> {
    validate_model_ready(None).await
}

pub async fn sensevoice_validate_model_ready_with_config<R: Runtime>(
    app: &AppHandle<R>,
) -> Result<String, String> {
    let configured_model = match crate::api::api::api_get_transcript_config(
        app.clone(),
        app.state(),
        None,
    )
    .await
    {
        Ok(Some(config)) if config.provider == "senseVoice" && !config.model.is_empty() => {
            Some(config.model)
        }
        _ => None,
    };

    validate_model_ready(configured_model).await
}

async fn validate_model_ready(configured_model: Option<String>) -> Result<String, String> {
    let engine = get_engine()?;

    if engine.is_model_loaded().await {
        if let Some(current_model) = engine.get_current_model().await {
            return Ok(current_model);
        }
    }

    let models = engine
        .discover_models()
        .await
        .map_err(|e| format!("Failed to discover SenseVoice models: {}", e))?;

    let model_name = configured_model
        .filter(|name| models.iter().any(|m| m.name == *name))
        .unwrap_or_else(|| crate::config::DEFAULT_SENSEVOICE_MODEL.to_string());

    let model = models
        .iter()
        .find(|m| m.name == model_name)
        .ok_or_else(|| format!("SenseVoice model '{}' is not registered", model_name))?;

    if !matches!(model.status, ModelStatus::Available) {
        return Err("SenseVoice 中文转写模型还没有下载完成，请先在转写设置里下载模型。".to_string());
    }

    engine
        .load_model(&model_name)
        .await
        .map_err(|e| format!("Failed to load SenseVoice model {}: {}", model_name, e))?;

    Ok(model_name)
}

#[command]
pub async fn sensevoice_transcribe_audio(audio_data: Vec<f32>) -> Result<String, String> {
    get_engine()?
        .transcribe_audio(audio_data)
        .await
        .map_err(|e| format!("SenseVoice transcription failed: {}", e))
}

#[command]
pub async fn sensevoice_get_models_directory() -> Result<String, String> {
    let path = get_engine()?.get_models_directory().await;
    Ok(path.to_string_lossy().to_string())
}

#[command]
pub async fn sensevoice_download_model<R: Runtime>(
    app_handle: AppHandle<R>,
    model_name: String,
) -> Result<(), String> {
    let engine = get_engine()?;
    let app_handle_clone = app_handle.clone();
    let model_name_clone = model_name.clone();

    let progress_callback = Box::new(move |progress: DownloadProgress| {
        let _ = app_handle_clone.emit(
            "sensevoice-model-download-progress",
            serde_json::json!({
                "modelName": model_name_clone,
                "progress": progress.percent,
                "downloaded_bytes": progress.downloaded_bytes,
                "total_bytes": progress.total_bytes,
                "downloaded_mb": progress.downloaded_mb,
                "total_mb": progress.total_mb,
                "speed_mbps": progress.speed_mbps
            }),
        );
    });

    let result = engine
        .download_model(&model_name, Some(progress_callback))
        .await;

    match result {
        Ok(()) => {
            let _ = app_handle.emit(
                "sensevoice-model-download-complete",
                serde_json::json!({ "modelName": model_name }),
            );
            Ok(())
        }
        Err(e) => {
            let error = e.to_string();
            let _ = app_handle.emit(
                "sensevoice-model-download-error",
                serde_json::json!({
                    "modelName": model_name,
                    "error": error
                }),
            );
            Err(error)
        }
    }
}

#[command]
pub async fn open_sensevoice_models_folder() -> Result<(), String> {
    let models_dir = get_models_directory()
        .ok_or_else(|| "SenseVoice models directory not initialized".to_string())?
        .join("sensevoice");

    if !models_dir.exists() {
        std::fs::create_dir_all(&models_dir)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(models_dir)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(models_dir)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(models_dir)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }

    Ok(())
}

fn get_engine() -> Result<Arc<SenseVoiceEngine>, String> {
    let guard = SENSEVOICE_ENGINE.lock().unwrap();
    guard
        .as_ref()
        .cloned()
        .ok_or_else(|| "SenseVoice engine not initialized".to_string())
}
