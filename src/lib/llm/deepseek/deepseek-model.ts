// lib/llm/deepseek/deepseek-model.ts
import OpenAI from "openai";

let deepseekClient: OpenAI | null = null;
let currentModel = "deepseek-chat";

function getDeepSeekClient() {
  if (!deepseekClient) {
    deepseekClient = new OpenAI({
      baseURL: "https://api.deepseek.com",
      apiKey: process.env.DEEP_SEEK_API_KEY,
      dangerouslyAllowBrowser: true,
    });
  }
  return deepseekClient;
}

export function createDeepSeekCompletion() {
  const client = getDeepSeekClient();
  return client.chat.completions;
}

export function updateDeepSeekModel(modelName: string) {
  currentModel = modelName;
  console.log("DeepSeek model updated to:", modelName);
}

export function getCurrentModel() {
  return currentModel;
}
