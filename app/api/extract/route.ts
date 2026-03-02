import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai';
import { MAX_CONTENT_LENGTH } from '@/hooks/useLearnings';

const EXTRACT_PROMPT = `あなたは会話から「AIが今後の謎解きに活かせる学習事項」を抽出する専門家です。

以下の会話を分析して、ユーザーがAIに教えたヒント・修正・洞察・解き方のコツを
短い日本語の箇条書きとして抽出してください。

## 抽出のルール
- 対象：ユーザーが謎解きの方向性を修正した発言、解法のコツ、思考の前提となる情報
- 除外：謎の文章そのもの、単純な返答（「そう」「違う」「正解」のみ）、雑談
- 各カードは最大80文字の日本語で、具体的かつ他の謎でも再利用できる形で記述する
- 既存の学習カードとほぼ同じ意味のものは除外する
- 1回の抽出で最大3件まで
- 抽出すべき内容がなければ空配列を返す

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
