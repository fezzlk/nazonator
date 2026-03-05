import { Pinecone } from '@pinecone-database/pinecone';

let client: Pinecone | null = null;

export function getPineconeClient(): Pinecone {
  if (!client) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) throw new Error('PINECONE_API_KEY is not set');
    client = new Pinecone({ apiKey });
  }
  return client;
}

export function getPineconeIndex() {
  const indexName = process.env.PINECONE_INDEX_NAME;
  if (!indexName) throw new Error('PINECONE_INDEX_NAME is not set');
  return getPineconeClient().index(indexName);
}

export function isPineconeEnabled(): boolean {
  return !!(process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_NAME);
}
