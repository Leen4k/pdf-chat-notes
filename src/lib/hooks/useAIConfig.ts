import { useState, useEffect } from "react";
import {
  LLMConfig,
  LLMProvider,
  getCurrentConfig,
  updateLLMProvider,
} from "@/lib/llm";

export function useAIConfig() {
  const [config, setConfig] = useState<LLMConfig>(getCurrentConfig());

  useEffect(() => {
    // Sync with stored config on mount
    setConfig(getCurrentConfig());
  }, []);

  const handleConfigChange = (provider: LLMProvider, model: string) => {
    console.log(`Switching to ${provider} model: ${model}`);
    updateLLMProvider(provider, model);
    setConfig(getCurrentConfig());
  };

  return {
    config,
    updateConfig: handleConfigChange,
  };
}
