import { DeepSeekAI } from "@deepseek/ai";

const deepSeekAI = new DeepSeekAI();

let currentModelName = "deepseek-chat";

export function createChatSession(modelName: string = currentModelName) {
  console.log("Creating session with model:", modelName);

  const model = deepSeekAI.getModel({
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
