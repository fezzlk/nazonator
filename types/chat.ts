export type Role = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
}

export interface ChatRequest {
  messages: Omit<Message, 'id' | 'timestamp'>[];
  growthLevel: number;
  learnings?: import('@/types/learning').Learning[];
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  streamingContent: string;
  error: string | null;
}
