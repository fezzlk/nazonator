const KEY = 'nazonator_openai_api_key';

export const getStoredApiKey = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(KEY);
};

export const setStoredApiKey = (key: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, key);
};

export const clearStoredApiKey = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
};
