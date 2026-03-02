export type RegexOperation = 'match' | 'test' | 'count';

export interface RegexOpArgs {
  text: string;
  pattern: string;
  flags?: string;
  operation: RegexOperation;
}

const MAX_TEXT_LENGTH = 10000;
const ALLOWED_FLAGS = /^[gimsuy]*$/; // only safe flags

export function regexMatch(args: RegexOpArgs): string {
  const { text, pattern, flags = '', operation } = args;

  if (text.length > MAX_TEXT_LENGTH) {
    return `Error: Text too long (max ${MAX_TEXT_LENGTH} characters)`;
  }

  // Whitelist flags to prevent ReDoS or unexpected behavior
  const sanitizedFlags = flags.replace(/[^gimsuy]/g, '');
  if (sanitizedFlags !== flags && !ALLOWED_FLAGS.test(flags)) {
    return 'Error: Invalid regex flags (only g, i, m, s, u, y are allowed)';
  }

  let regex: RegExp;
  try {
    // Always add 'g' for match/count operations
    const effectiveFlags =
      operation === 'test' ? sanitizedFlags : sanitizedFlags.includes('g') ? sanitizedFlags : sanitizedFlags + 'g';
    regex = new RegExp(pattern, effectiveFlags);
  } catch {
    return 'Error: Invalid regular expression pattern';
  }

  try {
    switch (operation) {
      case 'match': {
        const matches = text.match(regex);
        return matches ? JSON.stringify(matches) : '[]';
      }

      case 'test': {
        return regex.test(text) ? 'true' : 'false';
      }

      case 'count': {
        const matches = text.match(regex);
        return String(matches ? matches.length : 0);
      }

      default: {
        return `Error: Unknown operation '${operation}'`;
      }
    }
  } catch {
    return 'Error: Regex execution failed';
  }
}
