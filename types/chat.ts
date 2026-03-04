export type Role = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
}

export type AdditionMode = 'principles' | 'logics' | null;

export interface ChatRequest {
  messages: Omit<Message, 'id' | 'timestamp'>[];
  learnings?: import('@/types/learning').Learning[];
  principles?: import('@/types/learning').Learning[];
  logics?: import('@/types/learning').Learning[];
  additionMode?: AdditionMode;
  apiKey?: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  streamingContent: string;
  error: string | null;
}
