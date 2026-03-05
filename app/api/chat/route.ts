import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai';
import { buildSystemPrompt } from '@/prompts/systemPrompt';
import { TOOLS, dispatchTool } from '@/lib/tools';
import { getPineconeIndex, isPineconeEnabled } from '@/lib/pinecone';
import { embedText } from '@/lib/embedding';
import { DEFAULT_PRINCIPLES, DEFAULT_LOGICS } from '@/lib/userDoc';
import type { ChatRequest } from '@/types/chat';
import type { Learning } from '@/types/learning';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const MAX_TOOL_ROUNDS = 3;
const PSEUDO_STREAM_CHUNK_SIZE = 20;

function pseudoStream(content: string): Response {
  const readableStream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let offset = 0;
      while (offset < content.length) {
        controller.enqueue(encoder.encode(content.slice(offset, offset + PSEUDO_STREAM_CHUNK_SIZE)));
        offset += PSEUDO_STREAM_CHUNK_SIZE;
      }
      controller.close();
    },
  });

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  });
}

async function retrieveRelevantCards(
  query: string,
  uid: string,
  apiKey: string,
): Promise<{ learnings: Learning[]; principles: Learning[]; logics: Learning[] }> {
  try {
    const index = getPineconeIndex();
    const vector = await embedText(query, apiKey);

    const [lRes, pRes, loRes] = await Promise.all([
      index.query({ vector, topK: 8, filter: { uid: { $eq: uid }, category: { $eq: 'learnings' } }, includeMetadata: true }),
      index.query({ vector, topK: 5, filter: { uid: { $eq: uid }, category: { $eq: 'principles' } }, includeMetadata: true }),
      index.query({ vector, topK: 5, filter: { uid: { $eq: uid }, category: { $eq: 'logics' } }, includeMetadata: true }),
    ]);

    const toCards = (matches: typeof lRes.matches): Learning[] =>
      matches
        .filter((m) => m.metadata?.content)
        .map((m) => ({
          id: String(m.metadata!.cardId ?? m.id),
          content: String(m.metadata!.content),
          createdAt: 0,
        }));

    return {
      learnings: toCards(lRes.matches),
      principles: [...DEFAULT_PRINCIPLES, ...toCards(pRes.matches)],
      logics: [...DEFAULT_LOGICS, ...toCards(loRes.matches)],
    };
  } catch (e) {
    console.error('[RAG retrieval error]', e);
    return { learnings: [], principles: DEFAULT_PRINCIPLES, logics: DEFAULT_LOGICS };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { messages, learnings, principles, logics, additionMode, apiKey, uid } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 400 });
    }

    // RAG: Pineconeが設定済みかつ通常モードかつuidがある場合は関連カードを意味検索で取得
    let resolvedLearnings = learnings;
    let resolvedPrinciples = principles;
    let resolvedLogics = logics;

    if (!additionMode && uid && isPineconeEnabled()) {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
      if (lastUserMsg) {
        const retrieved = await retrieveRelevantCards(lastUserMsg.content, uid, apiKey);
        resolvedLearnings = retrieved.learnings;
        resolvedPrinciples = retrieved.principles;
        resolvedLogics = retrieved.logics;
      }
    }

    const systemPrompt = buildSystemPrompt(resolvedLearnings, resolvedPrinciples, resolvedLogics, additionMode);
    const openai = getOpenAIClient(apiKey);

    const systemMsg: ChatCompletionMessageParam = { role: 'system', content: systemPrompt };
    const apiMessages: ChatCompletionMessageParam[] = messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
    const toolMessages: ChatCompletionMessageParam[] = [];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        stream: false,
        messages: [systemMsg, ...apiMessages, ...toolMessages],
        tools: TOOLS,
        tool_choice: 'auto',
      });

      const choice = res.choices[0];

      if (choice.finish_reason !== 'tool_calls') {
        // No tool calls → respond with pseudo-stream
        return pseudoStream(choice.message.content ?? '');
      }

      // Execute tool calls
      const assistantMsg = choice.message;
      toolMessages.push({ role: 'assistant', content: assistantMsg.content ?? null, tool_calls: assistantMsg.tool_calls });

      for (const call of assistantMsg.tool_calls!) {
        if (call.type !== 'function') continue;
        const args = JSON.parse(call.function.arguments) as Record<string, unknown>;
        const result = dispatchTool(call.function.name, args);
        toolMessages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: result,
        });
      }
    }

    // MAX_TOOL_ROUNDS exceeded: final call without tools
    const finalRes = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      stream: false,
      messages: [systemMsg, ...apiMessages, ...toolMessages],
    });

    return pseudoStream(finalRes.choices[0].message.content ?? '');
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
