// import LlamaAI from "llamaai";

// const llamaAPI = new LlamaAI({
//   apiKey: process.env.LLAMA_API_KEY,
// });


import { LlamaAI } from "@llama/ai";  // Adjust based on actual Llama module

const llamaAI = new LlamaAI();

let currentModelName = "llama-chat";

export function createChatSession(modelName: string = currentModelName) {
  console.log("Creating session with model:", modelName);

  const model = llamaAI.getModel({
    model: modelName,
  });

  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxTokens: 8192,
  };

  return model.startChat({
    generationConfig,
    history: [],
  });
}

export let chatSession = createChatSession();

export function updateChatModel(modelName: string) {
  console.log("Updating model to:", modelName);
  currentModelName = modelName;
  chatSession = createChatSession(modelName);
}

export function getCurrentModel(): string {
  return currentModelName;
}

//llama model
