use super::provider::{TranscriptionError, TranscriptionProvider, TranscriptResult};
use async_trait::async_trait;
use std::sync::Arc;

pub struct SenseVoiceProvider {
    engine: Arc<crate::sensevoice_engine::SenseVoiceEngine>,
}

impl SenseVoiceProvider {
    pub fn new(engine: Arc<crate::sensevoice_engine::SenseVoiceEngine>) -> Self {
        Self { engine }
    }
}

#[async_trait]
impl TranscriptionProvider for SenseVoiceProvider {
    async fn transcribe(
        &self,
        audio: Vec<f32>,
        _language: Option<String>,
    ) -> std::result::Result<TranscriptResult, TranscriptionError> {
        match self.engine.transcribe_audio(audio).await {
            Ok(text) => Ok(TranscriptResult {
                text: text.trim().to_string(),
                confidence: None,
                is_partial: false,
            }),
            Err(e) => Err(TranscriptionError::EngineFailed(e.to_string())),
        }
    }

    async fn is_model_loaded(&self) -> bool {
        self.engine.is_model_loaded().await
    }

    async fn get_current_model(&self) -> Option<String> {
        self.engine.get_current_model().await
    }

    fn provider_name(&self) -> &'static str {
        "SenseVoice"
    }
}
