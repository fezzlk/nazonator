export type StringOperation =
  | 'remove_char'
  | 'replace'
  | 'count_char'
  | 'count_substring'
  | 'reverse'
  | 'length';

export interface StringOpArgs {
  text: string;
  operation: StringOperation;
  target?: string;
  replacement?: string;
}

export function stringOperation(args: StringOpArgs): string {
  const { text, operation, target, replacement } = args;

  switch (operation) {
    case 'remove_char': {
      if (target === undefined) return 'Error: target is required for remove_char';
      return text.split(target).join('');
    }

    case 'replace': {
      if (target === undefined) return 'Error: target is required for replace';
      if (replacement === undefined) return 'Error: replacement is required for replace';
      return text.split(target).join(replacement);
    }

    case 'count_char': {
      if (target === undefined) return 'Error: target is required for count_char';
      if (target.length !== 1) return 'Error: target must be a single character for count_char';
      let count = 0;
      for (const ch of text) {
        if (ch === target) count++;
      }
      return String(count);
    }

    case 'count_substring': {
      if (target === undefined) return 'Error: target is required for count_substring';
      if (target.length === 0) return 'Error: target must not be empty';
      let count = 0;
      let idx = 0;
      while ((idx = text.indexOf(target, idx)) !== -1) {
        count++;
        idx += target.length;
      }
      return String(count);
    }

    case 'reverse': {
      // Spread to handle multi-byte Unicode correctly
      return [...text].reverse().join('');
    }

    case 'length': {
      return String([...text].length);
    }

    default: {
      return `Error: Unknown operation '${operation}'`;
    }
  }
}
