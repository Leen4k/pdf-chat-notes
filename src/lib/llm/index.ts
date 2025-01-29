// lib/llm/llm-factory.ts
import {
  chatSession as geminiSession,
  updateChatModel,
} from "./gemini/gemini-model";
import {
  createDeepSeekCompletion,
  updateDeepSeekModel,
} from "./deepseek/deepseek-model";
import {
  createOpenAICompletion,
  updateOpenAIModel,
} from "./openai/openai-model";

export type LLMProvider = "gemini" | "deepseek" | "openai";

interface LLMConfig {
  provider: LLMProvider;
  model: string;
}

// const DEFAULT_CONFIG: LLMConfig = {
//   provider: "gemini",
//   model: "gemini-1.5-flash",
// };

const DEFAULT_CONFIG: LLMConfig = {
  provider: "openai",
  model: "gpt-3.5-turbo",
};

// const DEFAULT_CONFIG: LLMConfig = {
//   provider: "deepseek",
//   model: "deepseek-chat",
// };

// Store the config in localStorage to persist between refreshes
const STORAGE_KEY = "llm-config";

function loadStoredConfig(): LLMConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse stored config:", e);
    }
  }
  return DEFAULT_CONFIG;
}

let currentConfig: LLMConfig = loadStoredConfig();

export function updateLLMProvider(provider: LLMProvider, model: string) {
  currentConfig = { provider, model };

  // Persist the config
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentConfig));
  }

  const handlers = {
    gemini: () => {
      console.log("Creating Gemini session with model:", model);
      updateChatModel(model);
    },
    deepseek: () => {
      console.log("Creating DeepSeek session with model:", model);
      updateDeepSeekModel(model);
    },
    openai: () => {
      console.log("Creating OpenAI session with model:", model);
      updateOpenAIModel(model);
    },
  };

  const handler = handlers[provider];
  if (handler) {
    handler();
  }
}

export function getCurrentConfig(): LLMConfig {
  return { ...currentConfig };
}

export async function sendMessageToLLM(prompt: string) {
  const handlers = {
    gemini: async () => {
      try {
        console.log(
          `Sending message to Gemini API using model: ${currentConfig.model}`
        );
        const result = await geminiSession.sendMessage(prompt);
        return result.response.text();
      } catch (error) {
        console.error("Gemini error:", error);
        throw new Error("Failed to get response from Gemini");
      }
    },
    deepseek: async () => {
      try {
        console.log(
          `Sending message to DeepSeek API using model: ${currentConfig.model}`
        );
        const completion = createDeepSeekCompletion();
        const response = await completion.create({
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: prompt },
          ],
          model: currentConfig.model,
        });
        return response.choices[0].message.content;
      } catch (error) {
        console.error("DeepSeek error:", error);
        throw new Error("Failed to get response from DeepSeek");
      }
    },
    openai: async () => {
      try {
        console.log(
          `Sending message to OpenAI API using model: ${currentConfig.model}`
        );
        const completion = createOpenAICompletion();
        const response = await completion.create({
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: prompt },
          ],
          model: currentConfig.model,
        });
        return response.choices[0].message.content;
      } catch (error) {
        console.error("OpenAI error:", error);
        throw new Error("Failed to get response from OpenAI");
      }
    },
  };

  const handler = handlers[currentConfig.provider];
  if (!handler) {
    throw new Error(`Unsupported LLM provider: ${currentConfig.provider}`);
  }

  return handler();
}
