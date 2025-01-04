export interface Chat {
  id: number;
  name: string;
  createdAt: string;
  thumbnailUrl?: string;
  gradientId?: number;
  position?: number;
}

export interface ChatOrderUpdate {
  id: number;
  position: number;
}

export interface CreateChatInput {
  name: string;
  gradientId?: number;
} 