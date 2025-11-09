import { useState, useCallback } from 'react';
import { detectLanguageLocally } from '../utils/localAnalyzers';

type LanguageOption = string;

interface UseLanguageDetectorProps {
  activeTab: LanguageOption;
  onSwitchTab: (lang: LanguageOption) => void;
  languageOptions: readonly LanguageOption[];
}

export const useLanguageDetector = ({ activeTab, onSwitchTab, languageOptions }: UseLanguageDetectorProps) => {
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const handlePaste = useCallback(async (pastedText: string) => {
    setSuggestion(null); // Clear previous suggestion on new paste
    try {
      const detected = detectLanguageLocally(pastedText, [...languageOptions]);
      if (detected && detected.toLowerCase() !== activeTab.toLowerCase()) {
        setSuggestion(detected);
      }
    } catch (error) {
      console.error("Language detection failed:", error);
    }
  }, [activeTab, languageOptions]);

  const handleSwitch = () => {
    if (suggestion) {
      onSwitchTab(suggestion);
      setSuggestion(null);
    }
  };

  const handleDismiss = () => {
    setSuggestion(null);
  };

  return {
    suggestion,
    handlePaste,
    handleSwitch,
    handleDismiss,
  };
};
