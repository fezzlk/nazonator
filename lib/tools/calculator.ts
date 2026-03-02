/**
 * Safe arithmetic expression evaluator using recursive descent parsing.
 * Supports: +, -, *, /, %, ** (exponentiation), parentheses, integers, decimals.
 * No eval / Function constructor used.
 */

const MAX_INPUT_LENGTH = 200;

class Parser {
  private pos = 0;

  constructor(private input: string) {}

  private peek(): string {
    this.skipWhitespace();
    return this.input[this.pos] ?? '';
  }

  private consume(): string {
    this.skipWhitespace();
    const ch = this.input[this.pos];
    this.pos++;
    return ch;
  }

  private skipWhitespace(): void {
    while (this.pos < this.input.length && /\s/.test(this.input[this.pos])) {
      this.pos++;
    }
  }

  private parseNumber(): number {
    this.skipWhitespace();
    const start = this.pos;
    if (this.input[this.pos] === '-') this.pos++; // handled in unary
    while (this.pos < this.input.length && /[\d.]/.test(this.input[this.pos])) {
      this.pos++;
    }
    const raw = this.input.slice(start, this.pos);
    const value = parseFloat(raw);
    if (isNaN(value)) throw new Error(`Invalid number at position ${start}`);
    return value;
  }

  private parsePrimary(): number {
    this.skipWhitespace();
    const ch = this.peek();

    if (ch === '(') {
      this.consume(); // '('
      const value = this.parseExpr();
      this.skipWhitespace();
      if (this.input[this.pos] !== ')') throw new Error('Missing closing parenthesis');
      this.pos++; // ')'
      return value;
    }

    if (/[\d.]/.test(ch)) {
      return this.parseNumber();
    }

    throw new Error(`Unexpected character '${ch}' at position ${this.pos}`);
  }

  private parseUnary(): number {
    this.skipWhitespace();
    if (this.peek() === '-') {
      this.consume();
      return -this.parsePrimary();
    }
    if (this.peek() === '+') {
      this.consume();
      return this.parsePrimary();
    }
    return this.parsePrimary();
  }

  // Right-associative exponentiation
  private parseFactor(): number {
    const base = this.parseUnary();
    this.skipWhitespace();
    if (this.input.slice(this.pos, this.pos + 2) === '**') {
      this.pos += 2;
      const exp = this.parseFactor(); // right-associative
      return Math.pow(base, exp);
    }
    return base;
  }

  private parseTerm(): number {
    let left = this.parseFactor();
    while (true) {
      this.skipWhitespace();
      const op = this.input[this.pos];
      if (op === '*' && this.input[this.pos + 1] !== '*') {
        this.pos++;
        left *= this.parseFactor();
      } else if (op === '/') {
        this.pos++;
        const divisor = this.parseFactor();
        if (divisor === 0) throw new Error('Division by zero');
        left /= divisor;
      } else if (op === '%') {
        this.pos++;
        const mod = this.parseFactor();
        if (mod === 0) throw new Error('Modulo by zero');
        left %= mod;
      } else {
        break;
      }
    }
    return left;
  }

  parseExpr(): number {
    let left = this.parseTerm();
    while (true) {
      this.skipWhitespace();
      const op = this.input[this.pos];
      if (op === '+') {
        this.pos++;
        left += this.parseTerm();
      } else if (op === '-') {
        this.pos++;
        left -= this.parseTerm();
      } else {
        break;
      }
    }
    return left;
  }

  parse(): number {
    const result = this.parseExpr();
    this.skipWhitespace();
    if (this.pos < this.input.length) {
      throw new Error(`Unexpected character '${this.input[this.pos]}' at position ${this.pos}`);
    }
    return result;
  }
}

export function calculate(expression: string): string {
  if (expression.length > MAX_INPUT_LENGTH) {
    return `Error: Expression too long (max ${MAX_INPUT_LENGTH} characters)`;
  }

  // Reject any letters/identifiers to prevent injection
  if (/[a-zA-Z_$]/.test(expression)) {
    return 'Error: Expression must contain only numbers and operators';
  }

  try {
    const parser = new Parser(expression);
    const result = parser.parse();

    if (!isFinite(result)) {
      return 'Error: Result is not finite (overflow or division by zero)';
    }

    // Return integer if result is whole, otherwise float
    return Number.isInteger(result) ? String(result) : String(result);
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : 'Invalid expression'}`;
  }
}
