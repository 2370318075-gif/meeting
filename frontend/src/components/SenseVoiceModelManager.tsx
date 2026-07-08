import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { CheckCircle, Download, FolderOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type ModelStatus =
  | 'Available'
  | 'Missing'
  | { Downloading: { progress: number } }
  | { Error: string }
  | { Corrupted: { file_size: number; expected_min_size: number } };

interface SenseVoiceModelInfo {
  name: string;
  path: string;
  size_mb: number;
  speed: string;
  status: ModelStatus;
  description: string;
}

interface SenseVoiceModelManagerProps {
  selectedModel?: string;
  onModelSelect?: (modelName: string) => void;
  className?: string;
  autoSave?: boolean;
}

const DEFAULT_MODEL = 'sensevoice-zh-en-ja-ko-yue-int8';

export function SenseVoiceModelManager({
  selectedModel,
  onModelSelect,
  className = '',
  autoSave = false,
}: SenseVoiceModelManagerProps) {
  const [models, setModels] = useState<SenseVoiceModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const refreshModels = async () => {
    await invoke('sensevoice_init');
    const modelList = await invoke<SenseVoiceModelInfo[]>('sensevoice_get_available_models');
    setModels(modelList);
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        await refreshModels();
      } catch (error) {
        console.error('加载 SenseVoice 模型失败:', error);
        toast.error('加载中文转写模型失败', {
          description: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    let unlistenProgress: (() => void) | undefined;
    let unlistenComplete: (() => void) | undefined;
    let unlistenError: (() => void) | undefined;

    const setupListeners = async () => {
      unlistenProgress = await listen<{ modelName: string; progress: number }>(
        'sensevoice-model-download-progress',
        (event) => {
          setDownloading(true);
          setModels((prev) =>
            prev.map((model) =>
              model.name === event.payload.modelName
                ? { ...model, status: { Downloading: { progress: event.payload.progress } } }
                : model
            )
          );
        }
      );

      unlistenComplete = await listen<{ modelName: string }>(
        'sensevoice-model-download-complete',
        async (event) => {
          setDownloading(false);
          await refreshModels();
          await selectModel(event.payload.modelName, true);
          toast.success('中文转写模型已下载完成');
        }
      );

      unlistenError = await listen<{ modelName: string; error: string }>(
        'sensevoice-model-download-error',
        async (event) => {
          setDownloading(false);
          await refreshModels();
          toast.error('中文转写模型下载失败', {
            description: event.payload.error,
          });
        }
      );
    };

    setupListeners();

    return () => {
      unlistenProgress?.();
      unlistenComplete?.();
      unlistenError?.();
    };
  }, []);

  const saveModelSelection = async (modelName: string) => {
    await invoke('api_save_transcript_config', {
      provider: 'senseVoice',
      model: modelName,
      apiKey: null,
    });
  };

  const selectModel = async (modelName: string, silent = false) => {
    await invoke('sensevoice_load_model', { modelName });

    if (autoSave) {
      await saveModelSelection(modelName);
    }

    onModelSelect?.(modelName);

    if (!silent) {
      toast.success('已切换到 SenseVoice 中文转写');
    }
  };

  const downloadModel = async (modelName: string) => {
    try {
      setDownloading(true);
      setModels((prev) =>
        prev.map((model) =>
          model.name === modelName
            ? { ...model, status: { Downloading: { progress: 0 } } }
            : model
        )
      );
      toast.info('正在下载中文转写模型', {
        description: '模型约 228 MB，请保持网络连接。',
      });
      await invoke('sensevoice_download_model', { modelName });
    } catch (error) {
      setDownloading(false);
      toast.error('中文转写模型下载失败', {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const openFolder = async () => {
    await invoke('open_sensevoice_models_folder');
  };

  if (loading) {
    return (
      <div className={`rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          正在检查中文转写模型...
        </div>
      </div>
    );
  }

  const model = models.find((item) => item.name === DEFAULT_MODEL) ?? models[0];
  if (!model) {
    return null;
  }

  const isSelected = selectedModel === model.name;
  const isAvailable = model.status === 'Available';
  const isMissing = model.status === 'Missing';
  const progress =
    typeof model.status === 'object' && 'Downloading' in model.status
      ? model.status.Downloading.progress
      : null;
  const isError = typeof model.status === 'object' && 'Error' in model.status;
  const isCorrupted = typeof model.status === 'object' && 'Corrupted' in model.status;

  return (
    <div
      className={`rounded-lg border-2 p-4 transition-colors ${
        isSelected && isAvailable ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">SenseVoice 中文快速转写</h3>
            {isSelected && isAvailable && (
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                已选择
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-600">
            中文优先，适合会议口语；支持中英日韩粤，约 {model.size_mb} MB。
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isAvailable && (
            <button
              type="button"
              onClick={() => selectModel(model.name)}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <CheckCircle className="h-4 w-4" />
              使用
            </button>
          )}

          {(isMissing || isError || isCorrupted) && (
            <button
              type="button"
              disabled={downloading}
              onClick={() => downloadModel(model.name)}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              下载
            </button>
          )}
        </div>
      </div>

      {progress !== null && (
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
            <span>正在下载</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {isAvailable && (
        <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          可用
        </div>
      )}

      <button
        type="button"
        onClick={openFolder}
        className="mt-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <FolderOpen className="h-4 w-4" />
        打开模型文件夹
      </button>
    </div>
  );
}
