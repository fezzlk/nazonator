export interface Learning {
  id: string;
  content: string; // max 80文字
  createdAt: number; // Date.now()
  tags?: string[];
}
