import { 
  DeepSeekAI, 
  GenerationConfig 
} from "@deepseek/ai";

const deepSeek = new DeepSeekAI();

let currentModelName = "deepseek-2.0-pro";

export function createChatSession(modelName: string = currentModelName) {
  console.log("Creating session with model:", modelName);

  const model = deepSeek.getModel({
    model: modelName,
  });

  const generationConfig: GenerationConfig = {
    temperature: 0.9,
    topP: 0.9,
    topK: 50,
    maxTokens: 8000,
  };

  return model.startChatSession({
    config: generationConfig,
    chatHistory: [],
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