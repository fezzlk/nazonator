import OpenAI from 'openai';

let _client: OpenAI | null = null;

export function getOpenAIClient(apiKey?: string): OpenAI {
  if (apiKey) return new OpenAI({ apiKey });
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return _client;
}
