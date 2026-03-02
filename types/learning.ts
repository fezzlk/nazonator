export interface Learning {
  id: string;
  content: string; // max 80文字
  createdAt: number; // Date.now()
  category?: string; // 将来拡張用
}
