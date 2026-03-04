import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai';
import { MAX_CONTENT_LENGTH } from '@/hooks/useLearnings';

const ASSOCIATE_PROMPT = `あなたは謎解きのパターンから関連パターンを派生・連想する専門家です。

新しく学んだカードの「操作の本質」「考え方の方向性」を抽象化し、別角度・別適用場面からの派生パターンを生成してください。

## 生成ルール
- 新カードの本質を別の形で言い換えた派生パターンや、逆方向・直交方向の応用パターンを考える
- 新カードおよび既存カードと内容が重複するものは除外する
- 汎用表現のみ（固有名詞・具体的な文字列は使わない）
- learnings: 思考のコツ・視点の転換（「〜と考えると有効」「〜に注意」形式）
- logics: 文字・言葉の具体的な変換操作（「〜すると〜になる場合がある」形式）
- 各カード80文字以内の日本語一文
- 合わせて最大2件
- 関連パターンが思いつかなければ空配列を返す（無理に生成しない）

## 出力形式（このJSONのみ）
{"learnings": ["..."], "logics": ["..."]}`;

export async function POST(req: NextRequest) {
  try {
    const { newCards, allCards, apiKey } = await req.json();

    if (!Array.isArray(newCards) || newCards.length === 0) {
      return NextResponse.json({ learnings: [], logics: [] });
    }
    if (!apiKey) {
      return NextResponse.json({ learnings: [], logics: [] });
    }

    const newSection = `## 新しく学んだカード\n${(newCards as string[]).map((c) => `- ${c}`).join('\n')}`;
    const existingSection =
      Array.isArray(allCards) && allCards.length > 0
        ? `\n\n## 既存の全カード（重複除外対象）\n${(allCards as string[]).map((c) => `- ${c}`).join('\n')}`
        : '';

    const client = getOpenAIClient(apiKey);
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.5,
      max_tokens: 300,
      stream: false,
      messages: [
        { role: 'system', content: ASSOCIATE_PROMPT },
        { role: 'user', content: newSection + existingSection },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ learnings: [], logics: [] });

    const parsed = JSON.parse(jsonMatch[0]);
    const trim = (arr: unknown) =>
      Array.isArray(arr)
        ? arr
            .slice(0, 2)
            .map((c) => String(c).slice(0, MAX_CONTENT_LENGTH))
            .filter((c) => c.length > 0)
        : [];

    return NextResponse.json({
      learnings: trim(parsed.learnings),
      logics: trim(parsed.logics),
    });
  } catch {
    return NextResponse.json({ learnings: [], logics: [] });
  }
}
