export interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface DeepSeekChatOptions {
  apiKey: string;
  model: string;
}

export interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class DeepSeekChat {
  private apiKey: string;
  private model: string;

  constructor(options: DeepSeekChatOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model;
  }

  async create({
    messages,
  }: {
    messages: DeepSeekMessage[];
  }): Promise<DeepSeekResponse> {
    const response = await fetch(
      "https://api.deepseek.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    return response.json();
  }
}
