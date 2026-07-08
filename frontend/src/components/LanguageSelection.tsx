import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import Analytics from '@/lib/analytics';
import { toast } from 'sonner';
import { useConfig } from '@/contexts/ConfigContext';

export interface Language {
  code: string;
  name: string;
}

// ISO 639-1 language codes supported by Whisper
const LANGUAGES: Language[] = [
  { code: 'auto', name: '自动检测（原始语言）' },
  { code: 'auto-translate', name: '自动检测（翻译为英语）' },
  { code: 'en', name: '英语' },
  { code: 'zh', name: '简体中文' },
  { code: 'de', name: '德语' },
  { code: 'es', name: '西班牙语' },
  { code: 'ru', name: '俄语' },
  { code: 'ko', name: '韩语' },
  { code: 'fr', name: '法语' },
  { code: 'ja', name: '日语' },
  { code: 'pt', name: '葡萄牙语' },
  { code: 'tr', name: '土耳其语' },
  { code: 'pl', name: '波兰语' },
  { code: 'ca', name: '加泰罗尼亚语' },
  { code: 'nl', name: '荷兰语' },
  { code: 'ar', name: '阿拉伯语' },
  { code: 'sv', name: '瑞典语' },
  { code: 'it', name: '意大利语' },
  { code: 'id', name: '印尼语' },
  { code: 'hi', name: '印地语' },
  { code: 'fi', name: '芬兰语' },
  { code: 'vi', name: '越南语' },
  { code: 'he', name: '希伯来语' },
  { code: 'uk', name: '乌克兰语' },
  { code: 'el', name: '希腊语' },
  { code: 'ms', name: '马来语' },
  { code: 'cs', name: '捷克语' },
  { code: 'ro', name: '罗马尼亚语' },
  { code: 'da', name: '丹麦语' },
  { code: 'hu', name: '匈牙利语' },
  { code: 'ta', name: '泰米尔语' },
  { code: 'no', name: '挪威语' },
  { code: 'th', name: '泰语' },
  { code: 'ur', name: '乌尔都语' },
  { code: 'hr', name: '克罗地亚语' },
  { code: 'bg', name: '保加利亚语' },
  { code: 'lt', name: '立陶宛语' },
  { code: 'la', name: '拉丁语' },
  { code: 'mi', name: '毛利语' },
  { code: 'ml', name: '马拉雅拉姆语' },
  { code: 'cy', name: '威尔士语' },
  { code: 'sk', name: '斯洛伐克语' },
  { code: 'te', name: '泰卢固语' },
  { code: 'fa', name: '波斯语' },
  { code: 'lv', name: '拉脱维亚语' },
  { code: 'bn', name: '孟加拉语' },
  { code: 'sr', name: '塞尔维亚语' },
  { code: 'az', name: '阿塞拜疆语' },
  { code: 'sl', name: '斯洛文尼亚语' },
  { code: 'kn', name: '卡纳达语' },
  { code: 'et', name: '爱沙尼亚语' },
  { code: 'mk', name: '马其顿语' },
  { code: 'br', name: '布列塔尼语' },
  { code: 'eu', name: '巴斯克语' },
  { code: 'is', name: '冰岛语' },
  { code: 'hy', name: '亚美尼亚语' },
  { code: 'ne', name: '尼泊尔语' },
  { code: 'mn', name: '蒙古语' },
  { code: 'bs', name: '波斯尼亚语' },
  { code: 'kk', name: '哈萨克语' },
  { code: 'sq', name: '阿尔巴尼亚语' },
  { code: 'sw', name: '斯瓦希里语' },
  { code: 'gl', name: '加利西亚语' },
  { code: 'mr', name: '马拉地语' },
  { code: 'pa', name: '旁遮普语' },
  { code: 'si', name: '僧伽罗语' },
  { code: 'km', name: '高棉语' },
  { code: 'sn', name: '绍纳语' },
  { code: 'yo', name: '约鲁巴语' },
  { code: 'so', name: '索马里语' },
  { code: 'af', name: '南非荷兰语' },
  { code: 'oc', name: '奥克语' },
  { code: 'ka', name: '格鲁吉亚语' },
  { code: 'be', name: '白俄罗斯语' },
  { code: 'tg', name: '塔吉克语' },
  { code: 'sd', name: '信德语' },
  { code: 'gu', name: '古吉拉特语' },
  { code: 'am', name: '阿姆哈拉语' },
  { code: 'yi', name: '意第绪语' },
  { code: 'lo', name: '老挝语' },
  { code: 'uz', name: '乌兹别克语' },
  { code: 'fo', name: '法罗语' },
  { code: 'ht', name: '海地克里奥尔语' },
  { code: 'ps', name: '普什图语' },
  { code: 'tk', name: '土库曼语' },
  { code: 'nn', name: '新挪威语' },
  { code: 'mt', name: '马耳他语' },
  { code: 'sa', name: '梵语' },
  { code: 'lb', name: '卢森堡语' },
  { code: 'my', name: '缅甸语' },
  { code: 'bo', name: '藏语' },
  { code: 'tl', name: '塔加洛语' },
  { code: 'mg', name: '马达加斯加语' },
  { code: 'as', name: '阿萨姆语' },
  { code: 'tt', name: '鞑靼语' },
  { code: 'haw', name: '夏威夷语' },
  { code: 'ln', name: '林加拉语' },
  { code: 'ha', name: '豪萨语' },
  { code: 'ba', name: '巴什基尔语' },
  { code: 'jw', name: '爪哇语' },
  { code: 'su', name: '巽他语' },
];

interface LanguageSelectionProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  disabled?: boolean;
  provider?: 'senseVoice' | 'localWhisper' | 'parakeet' | 'deepgram' | 'elevenLabs' | 'groq' | 'openai';
}

export function LanguageSelection({
  selectedLanguage,
  onLanguageChange,
  disabled = false,
  provider = 'localWhisper'
}: LanguageSelectionProps) {
  const [saving, setSaving] = useState(false);
  const { setSelectedLanguage } = useConfig();

  // Parakeet only supports auto-detection (doesn't support manual language selection)
  const isParakeet = provider === 'parakeet';
  const isManualLanguageSelected = selectedLanguage !== 'auto' && selectedLanguage !== 'auto-translate';
  const displayedLanguage = isParakeet && isManualLanguageSelected ? 'auto' : selectedLanguage;
  const availableLanguages = isParakeet
    ? LANGUAGES.filter(lang => lang.code === 'auto' || lang.code === 'auto-translate')
    : LANGUAGES;

  const handleLanguageChange = async (languageCode: string) => {
    setSaving(true);
    try {
      // Save language preference to localStorage and sync to backend
      setSelectedLanguage(languageCode);
      onLanguageChange(languageCode);
      console.log('Language preference saved:', languageCode);

      // Track language selection analytics
      const selectedLang = LANGUAGES.find(lang => lang.code === languageCode);
      await Analytics.track('language_selected', {
        language_code: languageCode,
        language_name: selectedLang?.name || 'Unknown',
        is_auto_detect: (languageCode === 'auto').toString(),
        is_auto_translate: (languageCode === 'auto-translate').toString()
      });

      // Show success toast
      const languageName = selectedLang?.name || languageCode;
      toast.success("Language preference saved", {
        description: `Transcription language set to ${languageName}`
      });
    } catch (error) {
      console.error('Failed to save language preference:', error);
      toast.error("Failed to save language preference", {
        description: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setSaving(false);
    }
  };

  // Find the selected language name for display
  const selectedLanguageName = LANGUAGES.find(
    lang => lang.code === selectedLanguage
  )?.name || 'Auto Detect (Original Language)';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-gray-600" />
          <h4 className="text-sm font-medium text-gray-900">Transcription Language</h4>
        </div>
      </div>

      <div className="space-y-2">
        <select
          value={displayedLanguage}
          onChange={(e) => handleLanguageChange(e.target.value)}
          disabled={disabled || saving}
          className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
        >
          {availableLanguages.map((language) => (
            <option key={language.code} value={language.code}>
              {language.name}
              {language.code !== 'auto' && language.code !== 'auto-translate' && ` (${language.code})`}
            </option>
          ))}
        </select>

        {/* Parakeet language limitation warning */}
        {isParakeet && (
          <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-800">
            <p className="font-medium">ℹ️ Parakeet 不支持指定中文转写</p>
            <p className="mt-1 text-xs">当前 Parakeet 会忽略“简体中文”等手动语言设置。要得到中文转写，请把转写模型切换到 SenseVoice 中文快速转写。</p>
            {isManualLanguageSelected && (
              <p className="mt-1 text-xs">你当前保存的默认语言是 {selectedLanguageName}；切换到 SenseVoice 或 Whisper 后会生效。</p>
            )}
          </div>
        )}

        {/* Info text */}
        <div className="text-xs space-y-2 pt-2">
          <p className="text-gray-600">
            <strong>Current:</strong> {selectedLanguageName}
          </p>
          {selectedLanguage === 'auto' && (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
              <p className="font-medium">⚠️ Auto Detect may produce incorrect results</p>
              <p className="mt-1">For best accuracy, select your specific language (e.g., English, Spanish, etc.)</p>
            </div>
          )}
          {selectedLanguage === 'auto-translate' && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded text-blue-800">
              <p className="font-medium">🌐 Translation Mode Active</p>
              <p className="mt-1">All audio will be automatically translated to English. Best for multilingual meetings where you need English output.</p>
            </div>
          )}
          {selectedLanguage !== 'auto' && selectedLanguage !== 'auto-translate' && (
            <p className="text-gray-600">
              Transcription will be optimized for <strong>{selectedLanguageName}</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
