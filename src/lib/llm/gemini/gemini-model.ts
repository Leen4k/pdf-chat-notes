import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey as string);

let currentModelName = "gemini-1.5-flash";

export function createChatSession(modelName: string = currentModelName) {
  console.log("Creating session with model:", modelName);

  const model = genAI.getGenerativeModel({
    model: modelName,
  });

  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
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

export function getCurrentModel() {
  return currentModelName;
}
