import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai';
import { MAX_CONTENT_LENGTH } from '@/hooks/useLearnings';

const REFLECT_PROMPT = `あなたは謎解き会話から「解法のエッセンス」を抽出する専門家です。

今しがた謎が解けた会話を分析して、この謎を解くために有効だったパターン・テクニックを抽出してください。

## 抽出ルール
- この謎に固有の情報（固有名詞・具体的な文字列）を含めず、他の謎にも使える汎用表現にする
- 既存カードと内容が重複する場合は抽出しない
- learnings: 思考のコツ・アドバイス・解くときの視点
- logics: 文字・言葉の変換操作パターン（「〜すると〜になる」形式）
- 各カード80文字以内の日本語一文
- 合わせて最大2件（learnings と logics の合計）
- 抽出すべき内容がなければ空配列を返す

## 出力形式（このJSONのみで返答すること）
{"learnings": ["..."], "logics": ["..."]}`;

export async function POST(req: NextRequest) {
  try {
    const { messages, existingLearnings, existingLogics, apiKey } = await req.json();

    if (!Array.isArray(messages) || messages.length < 2) {
      return NextResponse.json({ learnings: [], logics: [] });
    }
    if (!apiKey) {
      return NextResponse.json({ learnings: [], logics: [] });
    }

    const conversationText = messages
      .slice(-12)
      .filter((m: { role: string }) => m.role === 'user' || m.role === 'assistant')
      .map((m: { role: string; content: string }) =>
        `${m.role === 'user' ? 'ユーザー' : 'AI'}: ${m.content}`,
      )
      .join('\n');

    const existingSection = [
      ...(Array.isArray(existingLearnings) ? existingLearnings : []),
      ...(Array.isArray(existingLogics) ? existingLogics : []),
    ].length > 0
      ? `\n\n## 既存カード（重複除外対象）\n${[
          ...(existingLearnings ?? []),
          ...(existingLogics ?? []),
        ].map((c: string) => `- ${c}`).join('\n')}`
      : '';

    const client = getOpenAIClient(apiKey);
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      max_tokens: 300,
      stream: false,
      messages: [
        { role: 'system', content: REFLECT_PROMPT + existingSection },
        { role: 'user', content: conversationText },
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
