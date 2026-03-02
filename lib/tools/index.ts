import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import { calculate } from './calculator';
import { stringOperation } from './stringOps';
import { regexMatch } from './regexOps';

export const TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'calculate',
      description:
        'Safely evaluates an arithmetic expression and returns the result as a string. ' +
        'Use this for any numeric calculation to ensure accuracy. ' +
        'Supports +, -, *, /, % (modulo), ** (exponentiation), and parentheses.',
      parameters: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: 'The arithmetic expression to evaluate, e.g. "123 * 456 + 789"',
          },
        },
        required: ['expression'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'string_operation',
      description:
        'Performs precise string operations. Use this whenever the puzzle requires ' +
        'character removal, replacement, counting, reversing, or measuring string length.',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'The input text to operate on',
          },
          operation: {
            type: 'string',
            enum: ['remove_char', 'replace', 'count_char', 'count_substring', 'reverse', 'length'],
            description:
              'remove_char: remove all occurrences of target character; ' +
              'replace: replace all occurrences of target with replacement; ' +
              'count_char: count occurrences of a single character; ' +
              'count_substring: count occurrences of a substring; ' +
              'reverse: reverse the string; ' +
              'length: return character count',
          },
          target: {
            type: 'string',
            description: 'Character or substring to search for (required for remove_char, replace, count_char, count_substring)',
          },
          replacement: {
            type: 'string',
            description: 'Replacement string (required for replace)',
          },
        },
        required: ['text', 'operation'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'regex_match',
      description:
        'Performs regex operations on text. Use this for pattern matching, extraction, or counting pattern occurrences.',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'The input text to operate on (max 10000 characters)',
          },
          pattern: {
            type: 'string',
            description: 'The regular expression pattern',
          },
          flags: {
            type: 'string',
            description: 'Regex flags: g (global), i (case-insensitive), m (multiline), s (dotAll). Default: ""',
          },
          operation: {
            type: 'string',
            enum: ['match', 'test', 'count'],
            description:
              'match: returns JSON array of all matches; ' +
              'test: returns "true" or "false"; ' +
              'count: returns number of matches as string',
          },
        },
        required: ['text', 'pattern', 'operation'],
      },
    },
  },
];

export function dispatchTool(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case 'calculate':
      return calculate(args.expression as string);

    case 'string_operation':
      return stringOperation({
        text: args.text as string,
        operation: args.operation as Parameters<typeof stringOperation>[0]['operation'],
        target: args.target as string | undefined,
        replacement: args.replacement as string | undefined,
      });

    case 'regex_match':
      return regexMatch({
        text: args.text as string,
        pattern: args.pattern as string,
        flags: args.flags as string | undefined,
        operation: args.operation as Parameters<typeof regexMatch>[0]['operation'],
      });

    default:
      return `Error: Unknown tool '${name}'`;
  }
}
