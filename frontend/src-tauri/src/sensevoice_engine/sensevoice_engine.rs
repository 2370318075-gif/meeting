use anyhow::{anyhow, Result};
use futures_util::StreamExt;
use once_cell::sync::Lazy;
use regex::Regex;
use serde::{Deserialize, Serialize};
use sherpa_onnx::{OfflineRecognizer, OfflineRecognizerConfig, OfflineSenseVoiceModelConfig};
use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::fs;
use tokio::io::{AsyncWriteExt, BufWriter};
use tokio::sync::RwLock;

const MODEL_NAME: &str = crate::config::DEFAULT_SENSEVOICE_MODEL;
const MODEL_FILE: &str = "model.int8.onnx";
const TOKENS_FILE: &str = "tokens.txt";
const MODEL_SIZE_MB: u32 = 228;
const MODEL_MIN_SIZE_BYTES: u64 = 200_000_000;
const TOKENS_MIN_SIZE_BYTES: u64 = 1_000;
const HF_REPO: &str = "csukuangfj/sherpa-onnx-sense-voice-zh-en-ja-ko-yue-2024-07-17";

static SENSEVOICE_MARKER_RE: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"<\|[^>]+\|>").expect("valid SenseVoice marker regex"));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ModelStatus {
    Available,
    Missing,
    Downloading { progress: u8 },
    Error(String),
    Corrupted { file_size: u64, expected_min_size: u64 },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgress {
    pub downloaded_bytes: u64,
    pub total_bytes: u64,
    pub downloaded_mb: f64,
    pub total_mb: f64,
    pub speed_mbps: f64,
    pub percent: u8,
}

impl DownloadProgress {
    fn new(downloaded: u64, total: u64, speed_mbps: f64) -> Self {
        let percent = if total > 0 {
            ((downloaded as f64 / total as f64) * 100.0).min(100.0) as u8
        } else {
            0
        };

        Self {
            downloaded_bytes: downloaded,
            total_bytes: total,
            downloaded_mb: downloaded as f64 / 1_048_576.0,
            total_mb: total as f64 / 1_048_576.0,
            speed_mbps,
            percent,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub name: String,
    pub path: PathBuf,
    pub size_mb: u32,
    pub speed: String,
    pub status: ModelStatus,
    pub description: String,
}

pub struct SenseVoiceEngine {
    models_dir: PathBuf,
    current_recognizer: Arc<RwLock<Option<Arc<OfflineRecognizer>>>>,
    current_model_name: Arc<RwLock<Option<String>>>,
    available_models: Arc<RwLock<HashMap<String, ModelInfo>>>,
    active_downloads: Arc<RwLock<HashSet<String>>>,
}

impl SenseVoiceEngine {
    pub fn new_with_models_dir(models_dir: Option<PathBuf>) -> Result<Self> {
        let models_dir = if let Some(dir) = models_dir {
            dir.join("sensevoice")
        } else {
            dirs::data_dir()
                .or_else(dirs::home_dir)
                .ok_or_else(|| anyhow!("Could not find system data directory"))?
                .join("Meetily")
                .join("models")
                .join("sensevoice")
        };

        if !models_dir.exists() {
            std::fs::create_dir_all(&models_dir)?;
        }

        log::info!(
            "SenseVoiceEngine using models directory: {}",
            models_dir.display()
        );

        Ok(Self {
            models_dir,
            current_recognizer: Arc::new(RwLock::new(None)),
            current_model_name: Arc::new(RwLock::new(None)),
            available_models: Arc::new(RwLock::new(HashMap::new())),
            active_downloads: Arc::new(RwLock::new(HashSet::new())),
        })
    }

    pub async fn discover_models(&self) -> Result<Vec<ModelInfo>> {
        let model_path = self.models_dir.join(MODEL_NAME);
        let status = if self.active_downloads.read().await.contains(MODEL_NAME) {
            ModelStatus::Downloading { progress: 0 }
        } else if model_path.exists() {
            match Self::validate_model_directory(&model_path) {
                Ok(_) => ModelStatus::Available,
                Err(e) => {
                    let size = directory_size(&model_path).unwrap_or(0);
                    log::warn!("SenseVoice model directory is incomplete: {}", e);
                    if size > 0 {
                        ModelStatus::Corrupted {
                            file_size: size,
                            expected_min_size: MODEL_MIN_SIZE_BYTES,
                        }
                    } else {
                        ModelStatus::Missing
                    }
                }
            }
        } else {
            ModelStatus::Missing
        };

        let model = ModelInfo {
            name: MODEL_NAME.to_string(),
            path: model_path,
            size_mb: MODEL_SIZE_MB,
            speed: "中文快速".to_string(),
            status,
            description: "中文优先，支持中英日韩粤，适合会议口语转写".to_string(),
        };

        let mut cache = self.available_models.write().await;
        cache.clear();
        cache.insert(model.name.clone(), model.clone());

        Ok(vec![model])
    }

    pub async fn load_model(&self, model_name: &str) -> Result<()> {
        if model_name != MODEL_NAME {
            return Err(anyhow!("SenseVoice model '{}' is not supported", model_name));
        }

        if let Some(current) = self.current_model_name.read().await.as_ref() {
            if current == model_name && self.current_recognizer.read().await.is_some() {
                log::info!("SenseVoice model {} is already loaded", model_name);
                return Ok(());
            }
        }

        let model_dir = self.models_dir.join(MODEL_NAME);
        Self::validate_model_directory(&model_dir)?;

        let model_file = model_dir.join(MODEL_FILE).to_string_lossy().to_string();
        let tokens_file = model_dir.join(TOKENS_FILE).to_string_lossy().to_string();

        let mut config = OfflineRecognizerConfig::default();
        config.model_config.sense_voice = OfflineSenseVoiceModelConfig {
            model: Some(model_file),
            language: Some("zh".to_string()),
            use_itn: true,
        };
        config.model_config.tokens = Some(tokens_file);
        config.model_config.num_threads = std::thread::available_parallelism()
            .map(|n| n.get().clamp(2, 6) as i32)
            .unwrap_or(4);
        config.model_config.provider = Some("cpu".to_string());

        log::info!(
            "Loading SenseVoice model '{}' with {} threads",
            model_name,
            config.model_config.num_threads
        );

        let recognizer = OfflineRecognizer::create(&config)
            .ok_or_else(|| anyhow!("Failed to create SenseVoice recognizer"))?;

        *self.current_recognizer.write().await = Some(Arc::new(recognizer));
        *self.current_model_name.write().await = Some(model_name.to_string());

        log::info!("Successfully loaded SenseVoice model: {}", model_name);
        Ok(())
    }

    pub async fn unload_model(&self) -> bool {
        let unloaded = self.current_recognizer.write().await.take().is_some();
        self.current_model_name.write().await.take();

        if unloaded {
            log::info!("SenseVoice model unloaded");
        }

        unloaded
    }

    pub async fn get_current_model(&self) -> Option<String> {
        self.current_model_name.read().await.clone()
    }

    pub async fn is_model_loaded(&self) -> bool {
        self.current_recognizer.read().await.is_some()
    }

    pub async fn get_models_directory(&self) -> PathBuf {
        self.models_dir.clone()
    }

    pub async fn transcribe_audio(&self, audio_data: Vec<f32>) -> Result<String> {
        if audio_data.len() < 1600 {
            return Ok(String::new());
        }

        let recognizer = self
            .current_recognizer
            .read()
            .await
            .clone()
            .ok_or_else(|| anyhow!("No SenseVoice model loaded. Please load a model first."))?;

        tokio::task::spawn_blocking(move || {
            let stream = recognizer.create_stream();
            stream.accept_waveform(16000, &audio_data);
            recognizer.decode(&stream);

            let result = stream
                .get_result()
                .ok_or_else(|| anyhow!("SenseVoice returned no result"))?;

            Ok(clean_sensevoice_text(&result.text))
        })
        .await
        .map_err(|e| anyhow!("SenseVoice task failed: {}", e))?
    }

    pub async fn download_model(
        &self,
        model_name: &str,
        progress_callback: Option<Box<dyn Fn(DownloadProgress) + Send + Sync>>,
    ) -> Result<()> {
        if model_name != MODEL_NAME {
            return Err(anyhow!("SenseVoice model '{}' is not supported", model_name));
        }

        {
            let mut active = self.active_downloads.write().await;
            if !active.insert(model_name.to_string()) {
                return Err(anyhow!("Download already in progress for {}", model_name));
            }
        }

        let result = self
            .download_model_inner(model_name, progress_callback)
            .await;

        self.active_downloads.write().await.remove(model_name);
        result
    }

    async fn download_model_inner(
        &self,
        model_name: &str,
        progress_callback: Option<Box<dyn Fn(DownloadProgress) + Send + Sync>>,
    ) -> Result<()> {
        let model_dir = self.models_dir.join(model_name);
        fs::create_dir_all(&model_dir).await?;

        let total_size = MODEL_MIN_SIZE_BYTES + TOKENS_MIN_SIZE_BYTES;
        let mut downloaded_total = 0u64;
        let start = Instant::now();

        for (filename, min_size) in [
            (MODEL_FILE, MODEL_MIN_SIZE_BYTES),
            (TOKENS_FILE, TOKENS_MIN_SIZE_BYTES),
        ] {
            let file_path = model_dir.join(filename);
            if file_path.exists() && file_size(&file_path).unwrap_or(0) >= min_size {
                downloaded_total += file_size(&file_path).unwrap_or(min_size);
                continue;
            }

            let bytes = self
                .download_file(filename, &file_path, downloaded_total, total_size, start, progress_callback.as_ref())
                .await?;
            downloaded_total += bytes;
        }

        Self::validate_model_directory(&model_dir)?;

        if let Some(callback) = progress_callback {
            callback(DownloadProgress::new(total_size, total_size, 0.0));
        }

        Ok(())
    }

    async fn download_file(
        &self,
        filename: &str,
        file_path: &Path,
        already_downloaded: u64,
        total_size: u64,
        start: Instant,
        progress_callback: Option<&Box<dyn Fn(DownloadProgress) + Send + Sync>>,
    ) -> Result<u64> {
        let client = reqwest::Client::builder()
            .tcp_nodelay(true)
            .connect_timeout(Duration::from_secs(30))
            .timeout(Duration::from_secs(1800))
            .build()?;

        let urls = [
            format!("https://hf-mirror.com/{}/resolve/main/{}", HF_REPO, filename),
            format!("https://huggingface.co/{}/resolve/main/{}", HF_REPO, filename),
        ];

        let mut last_error = None;
        for url in urls {
            match download_url(&client, &url, file_path, already_downloaded, total_size, start, progress_callback).await {
                Ok(bytes) => return Ok(bytes),
                Err(e) => {
                    log::warn!("Failed to download {} from {}: {}", filename, url, e);
                    last_error = Some(e);
                }
            }
        }

        Err(last_error.unwrap_or_else(|| anyhow!("Download failed for {}", filename)))
    }

    fn validate_model_directory(model_dir: &Path) -> Result<()> {
        let model_file = model_dir.join(MODEL_FILE);
        let tokens_file = model_dir.join(TOKENS_FILE);

        let model_size = file_size(&model_file)
            .map_err(|e| anyhow!("{} not found or unreadable: {}", MODEL_FILE, e))?;
        if model_size < MODEL_MIN_SIZE_BYTES {
            return Err(anyhow!(
                "{} is incomplete: {} bytes, expected at least {}",
                MODEL_FILE,
                model_size,
                MODEL_MIN_SIZE_BYTES
            ));
        }

        let tokens_size = file_size(&tokens_file)
            .map_err(|e| anyhow!("{} not found or unreadable: {}", TOKENS_FILE, e))?;
        if tokens_size < TOKENS_MIN_SIZE_BYTES {
            return Err(anyhow!(
                "{} is incomplete: {} bytes, expected at least {}",
                TOKENS_FILE,
                tokens_size,
                TOKENS_MIN_SIZE_BYTES
            ));
        }

        Ok(())
    }
}

async fn download_url(
    client: &reqwest::Client,
    url: &str,
    file_path: &Path,
    already_downloaded: u64,
    total_size: u64,
    start: Instant,
    progress_callback: Option<&Box<dyn Fn(DownloadProgress) + Send + Sync>>,
) -> Result<u64> {
    let response = client.get(url).send().await?;
    if !response.status().is_success() {
        return Err(anyhow!("HTTP {}", response.status()));
    }

    let tmp_path = file_path.with_extension("part");
    let file = fs::File::create(&tmp_path).await?;
    let mut writer = BufWriter::new(file);
    let mut stream = response.bytes_stream();
    let mut downloaded = 0u64;
    let mut last_report = Instant::now();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk?;
        writer.write_all(&chunk).await?;
        downloaded += chunk.len() as u64;

        if last_report.elapsed() >= Duration::from_millis(300) {
            last_report = Instant::now();
            let total_downloaded = already_downloaded + downloaded;
            let elapsed = start.elapsed().as_secs_f64().max(0.1);
            let speed = (total_downloaded as f64 / 1_048_576.0) / elapsed;
            if let Some(callback) = progress_callback {
                callback(DownloadProgress::new(total_downloaded, total_size, speed));
            }
        }
    }

    writer.flush().await?;
    drop(writer);
    fs::rename(&tmp_path, file_path).await?;

    Ok(downloaded)
}

fn clean_sensevoice_text(text: &str) -> String {
    SENSEVOICE_MARKER_RE
        .replace_all(text, "")
        .trim()
        .to_string()
}

fn file_size(path: &Path) -> std::io::Result<u64> {
    std::fs::metadata(path).map(|m| m.len())
}

fn directory_size(path: &Path) -> std::io::Result<u64> {
    let mut total = 0;
    if !path.exists() {
        return Ok(0);
    }

    for entry in std::fs::read_dir(path)? {
        let entry = entry?;
        let metadata = entry.metadata()?;
        if metadata.is_file() {
            total += metadata.len();
        }
    }

    Ok(total)
}
