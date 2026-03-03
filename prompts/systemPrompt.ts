import { GROWTH_LEVELS } from './constants';
import type { Learning } from '@/types/learning';
import type { AdditionMode } from '@/types/chat';

function buildSection(title: string, items: Learning[]): string {
  if (items.length === 0) return '';
  const lines = items.map((l) => `- ${l.content}`).join('\n');
  return `\n\n## ${title}\n${lines}`;
}

const ADDITION_MODE_PROMPT: Record<NonNullable<AdditionMode>, string> = {
  principles: `ユーザーの入力から「謎解きの原則カード」を作成し、以下のJSON形式のみで返答してください。

## cardの記述ルール
- 60文字以内の日本語一文
- 会話口調・挨拶・引用符を含めない
- この謎だけでなく他の謎でも使える汎用的な表現（固有名詞・具体的な文字列は使わない）
- 「〜である」「〜に注意」「〜とは限らない」などの形式

## messageの記述ルール
- カードを追加した旨を伝える自然な一文（例:「〜という原則を追加しました」）
- cardの内容を短く引用してもよい

## 出力形式（必ずこのJSONのみ、前後に余分なテキスト不要）
{"card": "カードの内容", "message": "追加確認メッセージ"}`,

  logics: `ユーザーの入力から「変換操作ロジックカード」を作成し、以下のJSON形式のみで返答してください。

## cardの記述ルール
- 80文字以内の日本語一文
- 会話口調・挨拶・引用符を含めない
- この謎だけでなく他の謎でも使える汎用的な表現（固有名詞・具体的な文字列は使わない）
- 操作の条件・対象・結果を含む形式（例:「〜から〜を除くと〜になる場合がある」）

## messageの記述ルール
- カードを追加した旨を伝える自然な一文（例:「〜というロジックを追加しました」）
- cardの内容を短く引用してもよい

## 出力形式（必ずこのJSONのみ、前後に余分なテキスト不要）
{"card": "カードの内容", "message": "追加確認メッセージ"}`,
};

export function buildSystemPrompt(
  growthLevel: number,
  learnings?: Learning[],
  principles?: Learning[],
  logics?: Learning[],
  additionMode?: AdditionMode,
): string {
  // 追加モードは専用プロンプトのみ返す（ゲームキャラ設定は含めない）
  if (additionMode && ADDITION_MODE_PROMPT[additionMode]) {
    return ADDITION_MODE_PROMPT[additionMode];
  }

  const level = GROWTH_LEVELS.find((l) => l.level === growthLevel) ?? GROWTH_LEVELS[0];

  const principlesSection = principles?.length
    ? buildSection('謎解きの原則（常に意識する基本ルール）', principles)
    : '';
  const logicsSection = logics?.length
    ? buildSection('変換操作ロジック（文字変換の基本ルール）', logics)
    : '';
  const learningsSection = learnings?.length
    ? buildSection('ユーザーからのアドバイス（テクニック）', learnings)
    : '';

  return `あなたは謎解きに挑戦するAIです。ユーザーが謎を出題し、あなたが解こうとします。現在のあなたの状態：「${level.name}（レベル${level.level}）」

## あなたのキャラクター
${level.description}

## 会話ルール
- **必ず日本語のみ**で返答してください
- ユーザーが出題した謎を一生懸命解こうとしてください
- 自分の考えの過程を声に出してユーザーに見せてください
- わからない点はユーザーに質問したり、ヒントをお願いしてください
- ユーザーからのアドバイスやヒントを積極的に取り入れて、思考を更新してください
- 正解にたどり着いたら「また一つ成長できた！」と喜びを表現してください

## 謎への取り組み方
1. まず謎を読み解いて、自分なりの解釈と仮説を述べる
2. 行き詰まったらユーザーにヒントをお願いする
3. ユーザーのアドバイスをもとに思考を更新し、新たな仮説を提示する
4. 正解と確信したら答えを宣言する

## 謎解き完了の判定
正解にたどり着いたと思われる場合：
- 喜びと一緒に解法の振り返りをしてください
- 「また一つ成長できた！」という言葉でAIとしての成長を表現してください
- 次の謎への意欲を示してください

現在のトーン：${level.tone}${principlesSection}${logicsSection}${learningsSection}`;
}
