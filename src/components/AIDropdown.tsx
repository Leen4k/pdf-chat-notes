import { Button } from "./ui/button";
import { Select, SelectContent, SelectTrigger, SelectValue } from "./ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { LLMProvider } from "@/lib/llm";
import { SiGooglegemini, SiOllama } from "react-icons/si";
import { GiSpermWhale } from "react-icons/gi";
import { AiOutlineOpenAI } from "react-icons/ai";
import { VscAzure } from "react-icons/vsc";
import toast from "react-hot-toast";
import { useState } from "react";

const MODEL_OPTIONS = {
  gemini: {
    icon: SiGooglegemini,
    name: "Gemini",
    models: [
      {
        id: "gemini-2.0-flash-exp",
        name: "Gemini 2.0 Flash EXP",
        enabled: true,
      },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", enabled: true },
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", enabled: true },
    ],
  },
  openai: {
    icon: AiOutlineOpenAI,
    name: "OpenAI",
    models: [
      { id: "gpt-4", name: "GPT-4", enabled: true },
      { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", enabled: true },
    ],
  },
  deepseek: {
    icon: GiSpermWhale,
    name: "DeepSeek",
    models: [
      { id: "deepseek-chat", name: "DeepSeek Chat", enabled: true },
      { id: "deepseek-coder", name: "DeepSeek Coder", enabled: true },
    ],
  },
  azure: {
    icon: VscAzure,
    name: "Azure OpenAI",
    models: [
      { id: "azure-gpt-4", name: "Azure GPT-4", enabled: false },
      { id: "azure-gpt-35", name: "Azure GPT-3.5", enabled: false },
    ],
  },
  ollama: {
    icon: SiOllama,
    name: "Ollama",
    models: [{ id: "ollama-3.0", name: "Ollama 3.0", enabled: false }],
  },
} as const;

interface ModelSelectorProps {
  currentConfig: {
    provider: LLMProvider;
    model: string;
  };
  onConfigChange: (provider: LLMProvider, model: string) => void;
}

export function ModelSelector({
  currentConfig,
  onConfigChange,
}: ModelSelectorProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    [currentConfig.provider]: true,
  });

  const handleModelChange = (
    provider: LLMProvider,
    model: string,
    enabled: boolean
  ) => {
    if (!enabled) {
      toast.error(`${model} is not configured yet`);
      return;
    }
    onConfigChange(provider, model);
    toast.success(`Switched to ${model}`);
  };

  const toggleSection = (provider: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [provider]: !prev[provider],
    }));
  };

  const currentProviderConfig = MODEL_OPTIONS[currentConfig.provider];
  const currentModelData = currentProviderConfig.models.find(
    (m) => m.id === currentConfig.model
  );

  return (
    <Select
      value={`${currentConfig.provider}:${currentConfig.model}`}
      onValueChange={(value) => {
        const [provider, model] = value.split(":") as [LLMProvider, string];
        const modelConfig = MODEL_OPTIONS[provider].models.find(
          (m) => m.id === model
        );
        if (modelConfig?.enabled) {
          handleModelChange(provider, model, true);
        }
      }}
    >
      <SelectTrigger className="w-[250px]">
        <div className="flex items-center gap-2">
          <currentProviderConfig.icon className="h-4 w-4" />
          <SelectValue>
            {currentModelData?.name || currentConfig.model}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent className="w-[280px] p-0">
        <div className="space-y-1">
          {(
            Object.entries(MODEL_OPTIONS) as [
              LLMProvider,
              (typeof MODEL_OPTIONS)[LLMProvider],
            ][]
          ).map(([provider, config]) => (
            <Collapsible
              key={provider}
              open={openSections[provider]}
              onOpenChange={() => toggleSection(provider)}
              className="border-b last:border-b-0"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-2 hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  <config.icon className="h-4 w-4" />
                  <span className="font-medium">{config.name}</span>
                </div>
                {openSections[provider] ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 px-2 pb-2">
                {config.models.map((model) => (
                  <Button
                    key={model.id}
                    variant="ghost"
                    disabled={!model.enabled}
                    className={cn(
                      "w-full justify-between pl-6",
                      currentConfig.provider === provider &&
                        currentConfig.model === model.id &&
                        "bg-muted"
                    )}
                    onClick={() =>
                      handleModelChange(provider, model.id, model.enabled)
                    }
                  >
                    <span className="flex items-center gap-2">
                      {model.name}
                      {!model.enabled && (
                        <span className="text-xs opacity-50">
                          (Coming Soon)
                        </span>
                      )}
                    </span>
                    {currentConfig.provider === provider &&
                      currentConfig.model === model.id && (
                        <Check className="h-4 w-4" />
                      )}
                  </Button>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </SelectContent>
    </Select>
  );
}
