import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai';
import { MAX_CONTENT_LENGTH } from '@/hooks/useLearnings';

const EXTRACT_PROMPT = `あなたは会話から「AIが今後の謎解きに活かせる汎用テクニック」を抽出する専門家です。

以下の会話を分析して、ユーザーがAIに教えたヒント・修正・洞察・解き方のコツを抽出してください。

## 抽出のルール
- 対象：ユーザーが謎解きの方向性を修正した発言、解法のコツ、思考の前提となる情報
- 除外：謎の文章そのもの、単純な返答（「そう」「違う」「正解」のみ）、雑談
- 各カードは**最大80文字**の日本語一文
- 既存の学習カードとほぼ同じ意味のものは除外する
- 1回の抽出で最大3件まで
- 抽出すべき内容がなければ空配列を返す

## カード記述の重要ルール
- **汎用化必須**：この謎の固有名詞・具体的な文字列は使わず、他の謎でもそのまま使える表現にする
  - NG例：「"あした"の"し"を取ると"あた"になる」（この謎専用）
  - OK例：「特定の文字を除去する操作は、一箇所だけ除くパターンと全て除くパターンがある」
- **要約**：会話の内容から本質的なルール・コツのみを抽出し、冗長な表現は省く
- 「〜ことがある」「〜に注意」「〜が有効」などの形式で記述する

## 出力形式（これのみで返答すること）
{"cards": ["カード1の内容", "カード2の内容"]}`;

export async function POST(req: NextRequest) {
  try {
    const { messages, existingCardContents } = await req.json();

    if (!Array.isArray(messages) || messages.length < 2) {
      return NextResponse.json({ newCards: [] });
    }

    const recentMessages = messages.slice(-10);

    const conversationText = recentMessages
      .filter((m: { role: string }) => m.role === 'user' || m.role === 'assistant')
      .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'ユーザー' : 'AI'}: ${m.content}`)
      .join('\n');

    const existingSection =
      Array.isArray(existingCardContents) && existingCardContents.length > 0
        ? `\n\n## 既存の学習カード（重複除外対象）\n${existingCardContents.map((c: string) => `- ${c}`).join('\n')}`
        : '';

    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      max_tokens: 300,
      stream: false,
      messages: [
        { role: 'system', content: EXTRACT_PROMPT + existingSection },
        { role: 'user', content: conversationText },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ newCards: [] });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const cards: string[] = Array.isArray(parsed.cards) ? parsed.cards : [];

    const trimmed = cards
      .slice(0, 3)
      .map((c: string) => String(c).slice(0, MAX_CONTENT_LENGTH))
      .filter((c: string) => c.length > 0);

    return NextResponse.json({ newCards: trimmed });
  } catch {
    return NextResponse.json({ newCards: [] });
  }
}
