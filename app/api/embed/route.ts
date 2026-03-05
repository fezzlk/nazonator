import { NextRequest, NextResponse } from 'next/server';
import { getPineconeIndex, isPineconeEnabled } from '@/lib/pinecone';
import { embedText, embedBatch } from '@/lib/embedding';

// POST: カードをPineconeにupsert
// Body: { uid, cards: Array<{ id, content, category }>, apiKey }
export async function POST(req: NextRequest) {
  if (!isPineconeEnabled()) {
    return NextResponse.json({ ok: false, reason: 'pinecone_not_configured' });
  }

  try {
    const { uid, cards, apiKey } = await req.json();

    if (!uid || !Array.isArray(cards) || cards.length === 0 || !apiKey) {
      return NextResponse.json({ ok: false, reason: 'invalid_params' });
    }

    const index = getPineconeIndex();
    const texts = cards.map((c: { content: string }) => c.content);
    const embeddings = await embedBatch(texts, apiKey);

    const vectors = cards.map(
      (c: { id: string; content: string; category: string }, i: number) => ({
        id: `${uid}-${c.id}`,
        values: embeddings[i],
        metadata: { uid, cardId: c.id, content: c.content, category: c.category },
      }),
    );

    await index.upsert({ records: vectors });
    return NextResponse.json({ ok: true, upserted: vectors.length });
  } catch (e) {
    console.error('[embed POST]', e);
    return NextResponse.json({ ok: false, reason: 'error' }, { status: 500 });
  }
}

// DELETE: カードをPineconeから削除
// Body: { uid, cardId }
export async function DELETE(req: NextRequest) {
  if (!isPineconeEnabled()) {
    return NextResponse.json({ ok: false, reason: 'pinecone_not_configured' });
  }

  try {
    const { uid, cardId } = await req.json();

    if (!uid || !cardId) {
      return NextResponse.json({ ok: false, reason: 'invalid_params' });
    }

    const index = getPineconeIndex();
    await index.deleteOne({ id: `${uid}-${cardId}` });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[embed DELETE]', e);
    return NextResponse.json({ ok: false, reason: 'error' }, { status: 500 });
  }
}
