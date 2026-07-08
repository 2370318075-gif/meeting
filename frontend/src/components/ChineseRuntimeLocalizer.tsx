'use client';

import { useEffect } from 'react';

const TEXT_TRANSLATIONS: Record<string, string> = {
  'Transcript': '转写',
  'Transcription': '转写',
  'Ai Summary': 'AI 摘要',
  'AI Summary': 'AI 摘要',
  'Summary': '摘要',
  'Preferences': '偏好设置',
  'About': '关于',
  'Settings': '设置',
  'General': '常规',
  'Recordings': '录制',
  'Beta': 'Beta',
  'Back': '返回',
  'Home': '首页',
  'Meeting Notes': '会议笔记',
  'Copy': '复制',
  'Copy Transcript': '复制转写内容',
  'No transcript available': '暂无可用转写内容',
  'Language': '语言',
  'Transcription Language': '转写语言',
  'Summary Language': '摘要语言',
  'Finalizing transcription...': '正在完成转写...',
  'Saving transcript...': '正在保存转写内容...',
  'Search language...': '搜索语言...',
  'Auto': '自动',
  'Auto Detect (Original Language)': '自动检测（原始语言）',
  'Auto Detect (Translate to English)': '自动检测（翻译为英语）',
  'English': '英语',
  'Chinese': '简体中文',
  'Traditional Chinese': '繁体中文',
  'German': '德语',
  'Spanish': '西班牙语',
  'Russian': '俄语',
  'Korean': '韩语',
  'French': '法语',
  'Japanese': '日语',
  'Portuguese': '葡萄牙语',
  'Italian': '意大利语',
  'Dutch': '荷兰语',
  'Polish': '波兰语',
  'Arabic': '阿拉伯语',
  'Hindi': '印地语',
  'Tamil': '泰米尔语',
  'Turkish': '土耳其语',
  'Vietnamese': '越南语',
  'Thai': '泰语',
  'Indonesian': '印尼语',
  'Swedish': '瑞典语',
  'Czech': '捷克语',
  'Danish': '丹麦语',
  'Finnish': '芬兰语',
  'Greek': '希腊语',
  'Hebrew': '希伯来语',
  'Hungarian': '匈牙利语',
  'Norwegian': '挪威语',
  'Romanian': '罗马尼亚语',
  'Ukrainian': '乌克兰语',
  'Add language': '添加语言',
  '＋ Add language': '＋ 添加语言',
  'Click to unset as default': '点击取消默认',
  'Click to set as default': '点击设为默认',
  'Click any language to set it as your default. Max 5 quick-switch options.': '点击任意语言即可设为默认。最多 5 个快捷切换选项。',
  'Pin one language as the default for new meetings. Unpinned languages remain as quick-switch options in the summary generator. Auto uses the dominant transcript language.': '固定一种语言作为新会议的默认摘要语言。未固定的语言会保留为摘要生成器中的快捷切换选项。自动模式会使用转写内容的主要语言。',
  'Uses dominant transcript language': '使用转写内容的主要语言',
  'Summary language saved on this device': '摘要语言已保存在此设备上',
  'Could not load saved summary language': '无法加载已保存的摘要语言',
  'Failed to save summary language': '保存摘要语言失败',
  'Set summary language': '设置摘要语言',
  'Language preference saved': '语言偏好已保存',
  'Failed to save language preference': '保存语言偏好失败',
  'Current:': '当前：',
  'Current': '当前',
  'Parakeet Language Support': 'Parakeet 语言支持',
  'Parakeet currently only supports automatic language detection. Manual language selection is not available. Use Whisper if you need to specify a particular language.': 'Parakeet 会忽略手动语言设置。要中文转写，请切换到 SenseVoice 中文快速转写。',
  'Auto Detect may produce incorrect results': '自动检测可能产生不准确结果',
  'For best accuracy, select your specific language (e.g., English, Spanish, etc.)': '为获得更高准确率，请选择具体语言，例如中文、英语、西班牙语等。',
  'Translation Mode Active': '翻译模式已启用',
  'All audio will be automatically translated to English. Best for multilingual meetings where you need English output.': '所有音频都会自动翻译为英语，适合需要英语输出的多语言会议。',
  'Select language': '选择语言',
  'Select a specific language to improve accuracy, or use auto-detect': '选择具体语言可提高准确率，也可以使用自动检测。',
  'Language selection isn\'t supported for Parakeet. It always uses automatic detection.': 'Parakeet 不支持手动选择语言，它始终使用自动检测。',
  'Re-process the audio with different language settings': '使用不同语言设置重新处理音频',
  'Real-time notes and summaries that never leave your machine.': '实时记录与摘要，全程保留在你的本机。',
  'Check for Updates': '检查更新',
  'Checking...': '正在检查...',
  'Update available': '有可用更新',
  'What makes Meetily different': 'Meetily 的不同之处',
  'Privacy-first': '隐私优先',
  'Your data & AI processing workflow can now stay within your premise. No cloud, no leaks.': '你的数据和 AI 处理流程都可以留在本机或自有环境中。不依赖云端，减少泄露风险。',
  'Use Any Model': '可使用任意模型',
  'Prefer local open-source model? Great. Want to plug in an external API? Also fine. No lock-in.': '想用本地开源模型可以，想接入外部 API 也可以。没有厂商锁定。',
  'Cost-Smart': '成本友好',
  'Avoid pay-per-minute bills by running models locally (or pay only for the calls you choose).': '通过本地运行模型避免按分钟计费，也可以只为你选择的外部调用付费。',
  'Works everywhere': '适用于各种会议',
  'Google Meet, Zoom, Teams-online or offline.': '支持 Google Meet、Zoom、Teams，以及线上或线下会议。',
  'Coming soon:': '即将推出：',
  'A library of on-device AI agents-automating follow-ups, action tracking, and more.': '本机 AI 智能体库，用于自动跟进、行动项追踪等。',
  'Ready to push your business further?': '准备让业务再进一步？',
  'If you\'re planning to build privacy-first custom AI agents or a fully tailored product for your business, we can help you build it.': '如果你计划构建隐私优先的定制 AI 智能体，或为业务打造完全定制的产品，我们可以协助落地。',
  'Chat with the Zackriya team': '联系 Zackriya 团队',
  'Built by Zackriya Solutions': '由 Zackriya Solutions 构建',
  'You are running the latest version': '你正在使用最新版本',
  'Failed to check for updates': '检查更新失败',
  'Please complete setup first': '请先完成设置',
  'You need to finish onboarding before you can start recording.': '开始录制前需要先完成初始化设置。',
  'Beta feature disabled': 'Beta 功能未启用',
  'Enable "Import Audio & Retranscribe" in Settings > Beta to use this feature.': '请在“设置 > Beta”中启用“导入音频并重新转写”后使用此功能。',
  'Please drop an audio file': '请拖入音频文件',
  'Meeting recovered successfully!': '会议已成功恢复！',
  'Meeting deleted successfully': '会议删除成功',
  'All associated data has been removed': '所有关联数据已删除',
  'Recording saved successfully!': '录制已成功保存！',
  'Transcripts and audio recovered': '转写内容和音频已恢复',
  'Transcripts recovered (no audio available)': '转写内容已恢复（无可用音频）',
  'View Meeting': '查看会议',
  'Failed to recover meeting': '恢复会议失败',
  'Unknown error occurred': '发生未知错误',
  'No transcript yet': '暂无转写内容',
  'Start recording to see live transcription here.': '开始录制后，这里会显示实时转写内容。',
  'Welcome to meetily!': '欢迎使用 Meetily！',
  'Start recording to see live transcription': '开始录制后，这里会显示实时转写',
  'Recording paused': '录制已暂停',
  'Listening for speech...': '正在聆听语音...',
  'Click resume to continue recording': '点击继续以恢复录制',
  'Speak to see live transcription': '开始说话后这里会显示实时转写',
  'Start Recording': '开始录制',
  'Stop Recording': '停止录制',
  'Pause': '暂停',
  'Resume': '继续',
  'Import Audio': '导入音频',
  'New Meeting': '新会议',
  'Meetings': '会议',
  'Search': '搜索',
  'Delete': '删除',
  'Cancel': '取消',
  'Confirm Delete': '确认删除',
  'Are you sure you want to delete this meeting? This action cannot be undone.': '确定要删除这个会议吗？此操作无法撤销。',
  'Save': '保存',
  'Close': '关闭',
  'Done': '完成',
  'Search meeting content...': '搜索会议内容...',
  'Notifications': '通知',
  'Enable or disable notifications of start and end of meeting': '启用或关闭会议开始和结束通知',
  'Data Storage Locations': '数据存储位置',
  'View and access where Meetily stores your data': '查看并访问 Meetily 存储数据的位置',
  'Meeting Recordings': '会议录音',
  'Open Folder': '打开文件夹',
  'Note:': '注意：',
  'Database and models are stored together in your application data directory for unified management.': '数据库和模型统一存储在应用数据目录中，便于管理。',
  'Microphone': '麦克风',
  'System Audio': '系统音频',
  'Audio Devices': '音频设备',
  'Default': '默认',
  'Model': '模型',
  'Provider': '提供方',
  'Save Settings': '保存设置',
  'Recording': '录制',
  'Recording Settings': '录制设置',
  'Summary Settings': '摘要设置',
  'Transcript Settings': '转写设置',
  'Import': '导入',
  'Try Again': '重试',
  'Drop audio file to import': '拖入音频文件以导入',
  'Configure how your audio recordings are saved during meetings.': '配置会议期间音频录制的保存方式。',
  'Save Audio Recordings': '保存音频录制',
  'Automatically save audio files when recording stops': '录制停止后自动保存音频文件',
  'Save Location': '保存位置',
  'Default folder': '默认文件夹',
  'File Format:': '文件格式：',
  'MP4 files': 'MP4 文件',
  'Recordings are saved with timestamp: recording_YYYYMMDD_HHMMSS.mp4': '录音会按时间戳保存：recording_YYYYMMDD_HHMMSS.mp4',
  'Audio recording is disabled. Enable "Save Audio Recordings" to automatically save your meeting audio.': '音频录制已关闭。请启用“保存音频录制”，以便自动保存会议音频。',
  'Recording Start Notification': '录制开始通知',
  'Show reminder to inform participants when recording starts': '录制开始时显示提醒，通知参会者',
  'Default Audio Devices': '默认音频设备',
  'Set your preferred microphone and system audio devices for recording. These will be automatically selected when starting new recordings.': '设置录制时优先使用的麦克风和系统音频设备。开始新录制时会自动选择这些设备。',
  'Transcript Model': '转写模型',
  'Select provider': '选择提供方',
  'Select model': '选择模型',
  'Select model...': '选择模型...',
  'Recommended': '推荐',
  'Ready': '就绪',
  'Download': '下载',
  'Downloading...': '正在下载...',
  'Loading models...': '正在加载模型...',
  'No models found.': '未找到模型。',
  'No models found. Download a model to get started with Built-in AI.': '未找到模型。请先下载一个模型以开始使用内置 AI。',
  'Real time': '实时',
  'Real time • Best for speed, great accuracy': '实时 • 速度优先，准确率高',
  'Real time • Smaller size': '实时 • 体积更小',
  '20x real-time • Higher accuracy': '20 倍实时速度 • 准确率更高',
  'Using Lightning for transcription': '正在使用 Lightning 进行转写',
  'Using Compact for transcription': '正在使用 Compact 进行转写',
  'Using Precise for transcription': '正在使用 Precise 进行转写',
  'Parakeet (Recommended - Real-time / Accurate)': 'Parakeet（推荐 - 实时 / 准确）',
  'Local Whisper (High Accuracy)': 'Local Whisper（高准确率）',
  'Auto Summary': '自动摘要',
  'Auto Generating summary after meeting completion(Stopping)': '会议结束（停止录制）后自动生成摘要',
  'No Summary Generated Yet': '暂未生成摘要',
  'Generate an AI-powered summary of your meeting transcript to get key points, action items, and decisions.': '生成 AI 会议摘要，快速提取关键要点、行动项和决策内容。',
  'Generate Summary': '生成摘要',
  'Regenerate Summary': '重新生成摘要',
  'Generate AI Summary': '生成 AI 摘要',
  'Regenerate AI Summary': '重新生成 AI 摘要',
  'Generating...': '正在生成...',
  'Processing...': '处理中...',
  'Loading model configuration...': '正在加载模型配置...',
  'Checking models...': '正在检查模型...',
  'Please select a model in Settings first': '请先在设置中选择模型',
  'AI Model': 'AI 模型',
  'Add context for AI summary. For example people involved, meeting overview, objective etc...': '为 AI 摘要补充上下文，例如参会人员、会议概述、会议目标等...',
  'No Ollama models found. Please download gemma3:1b from Model Settings.': '未找到 Ollama 模型。请在模型设置中下载 gemma3:1b。',
  'No Ollama models found. Please download gemma2:2b from Model Settings.': '未找到 Ollama 模型。请在模型设置中下载 gemma2:2b。',
  'Summary Model Configuration': '摘要模型配置',
  'Configure the AI model used for generating meeting summaries.': '配置用于生成会议摘要的 AI 模型。',
  'Model Settings': '模型设置',
  'Summarization Model': '摘要模型',
  'Speech Recognition Setup Required': '需要设置语音识别',
  'Transcription Model Settings': '转写模型设置',
  'Built-in AI': '内置 AI',
  'Built-in AI (Offline, No API needed)': '内置 AI（离线，无需 API）',
  'Built-in AI Models': '内置 AI 模型',
  'Custom Server (OpenAI)': '自定义服务器（OpenAI）',
  'Search models...': '搜索模型...',
  'Fetch Models': '获取模型',
  'Download Ollama': '下载 Ollama',
  'After installing Ollama, restart this application and click "Fetch Models" to continue.': '安装 Ollama 后，请重启此应用，然后点击“获取模型”继续。',
  'Endpoint changed. Click "Fetch Models" to load models from the new endpoint.': '端点已更改。点击“获取模型”从新端点加载模型。',
  'No models found. Download a recommended model or click "Fetch Models" to load available Ollama models.': '未找到模型。请下载推荐模型，或点击“获取模型”加载可用的 Ollama 模型。',
  'Download gemma3:1b (Recommended, ~800MB)': '下载 gemma3:1b（推荐，约 800MB）',
  'Downloading gemma3:1b...': '正在下载 gemma3:1b...',
  'Downloading gemma3:1b': '正在下载 gemma3:1b',
  'Beta Features': 'Beta 功能',
  'These features are still being tested. You may encounter issues, and we appreciate your feedback.': '这些功能仍在测试中，可能会遇到问题，欢迎反馈。',
  'Import Audio & Retranscribe': '导入音频并重新转写',
  'Import audio files to transcribe or retranscribe existing meetings with different language settings.': '导入音频文件进行转写，或使用不同语言设置重新转写已有会议。',
  'When disabled, beta features will be hidden. Your existing meetings remain unaffected.': '关闭后，Beta 功能将被隐藏；已有会议不会受到影响。',
  'Recording Started': '录制已开始',
  'Failed to save model settings': '保存模型设置失败',
  'Failed to load Built-in AI models': '加载内置 AI 模型失败',
  'Built-in AI model not downloaded': '内置 AI 模型尚未下载',
  'Built-in AI model not available': '内置 AI 模型不可用',
  'Built-in AI model not ready': '内置 AI 模型尚未就绪',
  'Usage Analytics': '使用分析',
  'Usage analytics is off by default. You can turn it on to share anonymous product and performance data; no personal content is collected.': '使用分析默认关闭。开启后只会共享匿名产品和性能数据；不会收集个人内容。',
  'Enable Analytics': '启用分析',
  'Updating...': '正在更新...',
  'Off unless you choose to enable it': '默认关闭，除非你选择启用',
  'Your meetings, transcripts, and recordings remain completely private and local.': '你的会议、转写内容和录音都会完全保留在本机并保持私密。',
  'View Privacy Policy': '查看隐私政策',
  'Your User ID': '你的用户 ID',
  'Share this ID when reporting issues to help us investigate your issue logs': '报告问题时提供此 ID，可帮助我们排查日志',
  'Copy User ID': '复制用户 ID',
  'Copied!': '已复制！',
  'System Audio Backend': '系统音频后端',
  'Audio Capture Methods:': '音频采集方式：',
  'Apple\'s ScreenCaptureKit framework - Higher level API with good compatibility': 'Apple 的 ScreenCaptureKit 框架 - 高层级 API，兼容性较好',
  'Direct Core Audio API - Lower latency, more control over audio pipeline': '直接使用 Core Audio API - 延迟更低，对音频管线控制更多',
  'Active': '已启用',
  'Disabled': '已禁用',
  'Try different backends to find which works best for your system.': '可以尝试不同后端，找到最适合当前系统的方式。',
  'Backend selection only affects system audio capture': '后端选择只影响系统音频采集',
  'Microphone always uses the default method': '麦克风始终使用默认方式',
  'Changes apply to new recording sessions': '更改会在新的录制会话中生效',
  '• Backend selection only affects system audio capture': '• 后端选择只影响系统音频采集',
  '• Microphone always uses the default method': '• 麦克风始终使用默认方式',
  '• Changes apply to new recording sessions': '• 更改会在新的录制会话中生效',
  'Select System Audio': '选择系统音频',
  'Default System Audio': '默认系统音频',
  'No system audio devices found': '未找到系统音频设备',
  'Microphone:': '麦克风：',
  'System Audio:': '系统音频：',
  'Records your voice and ambient sound': '录制你的声音和环境音',
  'Records computer audio (music, calls, etc.)': '录制电脑音频（音乐、通话等）',
  'Tip:': '提示：',
  'Click "Test Mic" to check if your microphone is working': '点击“测试麦克风”检查麦克风是否正常工作',
  'Mic Levels:': '麦克风音量：',
  'Green = good, Yellow = loud, Red = too loud': '绿色 = 正常，黄色 = 偏大，红色 = 过大',
  'Parakeet does not support Chinese language selection': 'Parakeet 不支持指定中文转写',
  'Parakeet ignores manual language settings. To transcribe Chinese, switch Transcript Model to Local Whisper and download a Whisper model.': 'Parakeet 会忽略手动语言设置。要中文转写，请把转写模型切换到 SenseVoice 中文快速转写。',
};

const ATTRIBUTE_TRANSLATIONS = TEXT_TRANSLATIONS;
const ATTRIBUTES = ['title', 'aria-label', 'placeholder'] as const;

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function translated(value: string): string | null {
  const direct = TEXT_TRANSLATIONS[value];
  if (direct) return direct;

  const normalized = normalizeText(value);
  if (!normalized) return null;

  const normalizedMatch = TEXT_TRANSLATIONS[normalized];
  if (normalizedMatch) {
    return value.replace(normalized, normalizedMatch);
  }

  const defaultMatch = normalized.match(/^Default: (.+) - click it again to unset\. Max 5 quick-switch options\.$/);
  if (defaultMatch) {
    return `默认：${defaultMatch[1]} - 再次点击可取消。最多 5 个快捷切换选项。`;
  }

  const summaryLanguageMatch = normalized.match(/^Summary language: (.+?)(?: \(saved on this device\))?$/);
  if (summaryLanguageMatch) {
    return `摘要语言：${summaryLanguageMatch[1]}${normalized.includes('(saved on this device)') ? '（已保存在此设备上）' : ''}`;
  }

  const transcriptOptimizedMatch = normalized.match(/^Transcription will be optimized for (.+)$/);
  if (transcriptOptimizedMatch) {
    return `转写将针对 ${transcriptOptimizedMatch[1]} 优化`;
  }

  const transcriptionSetMatch = normalized.match(/^Transcription language set to (.+)$/);
  if (transcriptionSetMatch) {
    return `转写语言已设为 ${transcriptionSetMatch[1]}`;
  }

  const updateMatch = normalized.match(/^Update available: v(.+)$/);
  if (updateMatch) {
    return `有可用更新：v${updateMatch[1]}`;
  }

  const recordingTimestampMatch = normalized.match(/^Recordings are saved with timestamp: recording_YYYYMMDD_HHMMSS\.(.+)$/);
  if (recordingTimestampMatch) {
    return `录音会按时间戳保存：recording_YYYYMMDD_HHMMSS.${recordingTimestampMatch[1]}`;
  }

  const transcriptSegmentsSavedMatch = normalized.match(/^(\d+) transcript segments saved\.$/);
  if (transcriptSegmentsSavedMatch) {
    return `已保存 ${transcriptSegmentsSavedMatch[1]} 条转写片段。`;
  }

  const providerDescriptorMatch = normalized.match(/^(.+) \((Recommended - Real-time \/ Accurate|High Accuracy)\)$/);
  if (providerDescriptorMatch) {
    const descriptor = providerDescriptorMatch[2] === 'High Accuracy' ? '高准确率' : '推荐 - 实时 / 准确';
    return `${providerDescriptorMatch[1]}（${descriptor}）`;
  }

  const usingTranscriptionMatch = normalized.match(/^Using (.+) for transcription$/);
  if (usingTranscriptionMatch) {
    return `正在使用 ${usingTranscriptionMatch[1]} 进行转写`;
  }

  const fileSizeMatch = normalized.match(/^(.+) files$/);
  if (fileSizeMatch) {
    return `${fileSizeMatch[1]} 文件`;
  }

  const noModelsSearchMatch = normalized.match(/^No models found matching "(.+)". Try a different search term\.$/);
  if (noModelsSearchMatch) {
    return `未找到匹配“${noModelsSearchMatch[1]}”的模型。请换个关键词搜索。`;
  }

  return null;
}

function shouldSkipElement(element: Element | null): boolean {
  if (!element) return false;
  return Boolean(element.closest('script, style, code, pre, [data-no-localize]'));
}

function localizeTextNode(node: Text): void {
  if (shouldSkipElement(node.parentElement)) return;

  const next = translated(node.nodeValue ?? '');
  if (next && node.nodeValue !== next) {
    node.nodeValue = next;
  }
}

function localizeElement(element: Element): void {
  if (shouldSkipElement(element)) return;

  for (const attr of ATTRIBUTES) {
    const current = element.getAttribute(attr);
    if (!current) continue;
    const next = ATTRIBUTE_TRANSLATIONS[current] ?? translated(current);
    if (next && current !== next) {
      element.setAttribute(attr, next);
    }
  }
}

function localizeTree(root: ParentNode): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }

  textNodes.forEach(localizeTextNode);

  if (root instanceof Element) {
    localizeElement(root);
  }

  root.querySelectorAll?.('*').forEach(localizeElement);
}

function ensureChineseDefaults(): void {
  try {
    const defaults: Record<string, string> = {
      primaryLanguage: 'zh',
      summaryLanguageDefault: 'zh',
      summaryLanguageRecents: '["zh"]',
    };

    Object.entries(defaults).forEach(([key, value]) => {
      if (!window.localStorage.getItem(key)) {
        window.localStorage.setItem(key, value);
      }
    });
  } catch {
    // Local storage can be unavailable in unusual WebView states.
  }
}

export function ChineseRuntimeLocalizer() {
  useEffect(() => {
    document.documentElement.lang = 'zh-CN';
    ensureChineseDefaults();
    localizeTree(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData' && mutation.target instanceof Text) {
          localizeTextNode(mutation.target);
        }

        mutation.addedNodes.forEach((node) => {
          if (node instanceof Text) {
            localizeTextNode(node);
          } else if (node instanceof Element) {
            localizeTree(node);
          }
        });
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
