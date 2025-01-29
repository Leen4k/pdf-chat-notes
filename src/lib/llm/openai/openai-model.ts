// src/lib/llm/openai/openai-model.ts
import OpenAI from "openai";

let openaiClient: OpenAI | null = null;
let currentModel = "gpt-3.5-turbo";

function getOpenAIClient() {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPEN_AI_API_KEY,
    });
  }
  return openaiClient;
}

export function createOpenAICompletion() {
  const client = getOpenAIClient();
  console.log("Creating OpenAI session with model:", currentModel);
  return client.chat.completions;
}

export function updateOpenAIModel(modelName: string) {
  currentModel = modelName;
  console.log("OpenAI model updated to:", modelName);
}

export function getCurrentModel() {
  return currentModel;
}
