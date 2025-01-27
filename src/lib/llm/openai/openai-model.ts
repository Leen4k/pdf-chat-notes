// src/lib/llm/openai/openai-model.ts
import OpenAI from "openai";
import { OpenAIEmbeddings } from "@langchain/openai";

const apiKey = process.env.OPENAI_API_KEY;
const openai = new OpenAI({
  apiKey: apiKey,
});

let currentModelName = "gpt-4";

export function createChatSession(modelName: string = currentModelName) {
  console.log("Creating session with model:", modelName);

  return openai.beta.chat.completions.stream({
    model: modelName,
    messages: [],
  });
}

export let chatSession = createChatSession();

export function updateChatModel(modelName: string) {
  console.log("Updating model to:", modelName);
  currentModelName = modelName;
  chatSession = createChatSession(modelName);
}

export function getCurrentModel() {
  return currentModelName;
}