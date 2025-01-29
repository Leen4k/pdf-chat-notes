import { createChatSession, updateChatModel, getCurrentModel, chatSession } from "./deepseek-model";

// Function to send a message and get a response from the chat session
export async function sendMessage(message: string): Promise<string> {
  if (!chatSession) {
    throw new Error("Chat session is not initialized. Please create a chat session first.");
  }

  console.log("Sending message:", message);

  const response = await chatSession.sendMessage({
    input: message,
  });

  return response.text;
}

// Function to switch models dynamically
export function switchModel(modelName: string): void {
  console.log(`Switching to model: ${modelName}`);
  updateChatModel(modelName);
}

// Function to get the current model being used
export function getActiveModel(): string {
  return getCurrentModel();
}

// Example usage
(async () => {
  try {
    console.log("Active model:", getActiveModel());

    const message = "Hello, how can DeepSeekAI help me today?";
    const response = await sendMessage(message);

    console.log("AI Response:", response);

    // Switch to a different model if needed
    switchModel("deepseek-advanced");
    console.log("Switched model. Current model:", getActiveModel());
  } catch (error) {
    console.error("Error:", error.message);
  }
})();