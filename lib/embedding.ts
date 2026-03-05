import OpenAI from 'openai';

const MODEL = 'text-embedding-3-small';

export async function embedText(text: string, apiKey: string): Promise<number[]> {
  const client = new OpenAI({ apiKey });
  const res = await client.embeddings.create({
    model: MODEL,
    input: text,
  });
  return res.data[0].embedding;
}

export async function embedBatch(texts: string[], apiKey: string): Promise<number[][]> {
  const client = new OpenAI({ apiKey });
  const res = await client.embeddings.create({
    model: MODEL,
    input: texts,
  });
  return res.data.map((d) => d.embedding);
}
