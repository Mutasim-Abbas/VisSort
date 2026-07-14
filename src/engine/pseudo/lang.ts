import type { Step } from '../types';

/**
 * A tiny pseudocode language, written so a student can type the algorithm they
 * were taught and *watch their own code sort the bars*.
 *
 * Deliberately close to textbook notation:
 *
 *   for i ← 0 to n - 2:
 *     if A[i] > A[i+1]:
 *       swap A[i], A[i+1]
 *
 * Blocks are indentation-based. Comparing two array elements emits a `compare`
 * step, `swap` emits a `swap`, and writing to A[i] emits an `overwrite` — so a
 * user's program produces exactly the same Step stream as a built-in algorithm
 * and animates through the same engine. Every step carries its source line, so
 * the editor can highlight the line that is running.
 */

export class PseudoError extends Error {
  constructor(
    message: string,
    /** 1-indexed source line, for the editor gutter. */
    readonly line: number,
  ) {
    super(message);
    this.name = 'PseudoError';
  }
}

/* ------------------------------------------------------------------ */
/* Tokens                                                             */
/* ------------------------------------------------------------------ */

type Tok =
  | { k: 'num'; v: number }
  | { k: 'id'; v: string }
  | { k: 'kw'; v: string }
  | { k: 'op'; v: string };

const KEYWORDS = new Set([
  'for',
  'to',
  'downto',
  'while',
  'if',
  'else',
  'swap',
  'and',
  'or',
  'not',
  'true',
  'false',
]);

function tokenize(src: string, line: number): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === ' ' || c === '\t') {
      i++;
      continue;
    }
    // Comments: # … or ▹ … run to end of line.
    if (c === '#' || c === '▹') break;

    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < src.length && /[0-9]/.test(src[j])) j++;
      out.push({ k: 'num', v: Number(src.slice(i, j)) });
      i = j;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
      const word = src.slice(i, j);
      out.push(KEYWORDS.has(word) ? { k: 'kw', v: word } : { k: 'id', v: word });
      i = j;
      continue;
    }

    // Assignment arrows: ← and <-
    if (c === '←') {
      out.push({ k: 'op', v: '<-' });
      i++;
      continue;
    }
    if (c === '<' && src[i + 1] === '-') {
      out.push({ k: 'op', v: '<-' });
      i += 2;
      continue;
    }
    // Two-character comparisons.
    const two = src.slice(i, i + 2);
    if (['<=', '>=', '==', '!=', '≤', '≥', '≠'].includes(two)) {
      out.push({ k: 'op', v: two });
      i += 2;
      continue;
    }
    if (c === '≤') {
      out.push({ k: 'op', v: '<=' });
      i++;
      continue;
    }
    if (c === '≥') {
      out.push({ k: 'op', v: '>=' });
      i++;
      continue;
    }
    if (c === '≠') {
      out.push({ k: 'op', v: '!=' });
      i++;
      continue;
    }
    if ('+-*/%<>=[](),:'.includes(c)) {
      out.push({ k: 'op', v: c });
      i++;
      continue;
    }
    throw new PseudoError(`I don't understand the character "${c}"`, line);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* AST                                                                */
/* ------------------------------------------------------------------ */

type Expr =
  | { t: 'num'; v: number }
  | { t: 'bool'; v: boolean }
  | { t: 'var'; name: string }
  | { t: 'index'; index: Expr } // A[expr]
  | { t: 'bin'; op: string; l: Expr; r: Expr }
  | { t: 'un'; op: string; e: Expr };

type Stmt =
  | { t: 'assign'; name: string; e: Expr; line: number }
  | { t: 'store'; index: Expr; e: Expr; line: number }
  | { t: 'swap'; a: Expr; b: Expr; line: number }
  | { t: 'for'; name: string; from: Expr; to: Expr; down: boolean; body: Stmt[]; line: number }
  | { t: 'while'; cond: Expr; body: Stmt[]; line: number }
  | { t: 'if'; cond: Expr; then: Stmt[]; else: Stmt[]; line: number };

/* ------------------------------------------------------------------ */
/* Parser (line + indentation based)                                   */
/* ------------------------------------------------------------------ */

interface SrcLine {
  indent: number;
  toks: Tok[];
  line: number;
}

function prepare(src: string): SrcLine[] {
  const out: SrcLine[] = [];
  src.split(/\r?\n/).forEach((raw, idx) => {
    const line = idx + 1;
    const stripped = raw.replace(/\t/g, '  ');
    const trimmed = stripped.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('▹')) return;
    const toks = tokenize(stripped, line);
    if (toks.length === 0) return;
    const indent = stripped.length - stripped.trimStart().length;
    out.push({ indent, toks, line });
  });
  return out;
}

class Parser {
  private p = 0;
  constructor(private readonly lines: SrcLine[]) {}

  parseProgram(): Stmt[] {
    if (this.lines.length === 0) return [];
    return this.parseBlock(this.lines[0].indent);
  }

  private parseBlock(indent: number): Stmt[] {
    const body: Stmt[] = [];
    while (this.p < this.lines.length && this.lines[this.p].indent >= indent) {
      if (this.lines[this.p].indent > indent) {
        throw new PseudoError('This line is indented too far.', this.lines[this.p].line);
      }
      const stmt = this.parseStmt();
      if (stmt) body.push(stmt);
    }
    return body;
  }

  /** Consume the indented block that follows a `…:` header. */
  private parseIndentedBody(headerIndent: number, headerLine: number): Stmt[] {
    if (this.p >= this.lines.length || this.lines[this.p].indent <= headerIndent) {
      throw new PseudoError(
        'This line ends with ":" so the next line must be indented underneath it.',
        headerLine,
      );
    }
    return this.parseBlock(this.lines[this.p].indent);
  }

  private parseStmt(): Stmt | null {
    const { toks, line, indent } = this.lines[this.p];
    const ex = new ExprParser(toks, line);

    // ---- for i ← a to b:
    if (toks[0].k === 'kw' && toks[0].v === 'for') {
      this.p++;
      ex.expectKw('for');
      const name = ex.expectId();
      ex.expectOp('<-');
      const from = ex.parseUntil(['to', 'downto']);
      const down = ex.matchKw('downto');
      if (!down) ex.expectKw('to');
      const to = ex.parseExpr();
      ex.expectOp(':');
      ex.end();
      const body = this.parseIndentedBody(indent, line);
      return { t: 'for', name, from, to, down, body, line };
    }

    // ---- while cond:
    if (toks[0].k === 'kw' && toks[0].v === 'while') {
      this.p++;
      ex.expectKw('while');
      const cond = ex.parseExpr();
      ex.expectOp(':');
      ex.end();
      const body = this.parseIndentedBody(indent, line);
      return { t: 'while', cond, body, line };
    }

    // ---- if cond: … else: …
    if (toks[0].k === 'kw' && toks[0].v === 'if') {
      this.p++;
      ex.expectKw('if');
      const cond = ex.parseExpr();
      ex.expectOp(':');
      ex.end();
      const then = this.parseIndentedBody(indent, line);
      let otherwise: Stmt[] = [];
      const nxt = this.lines[this.p];
      if (
        nxt &&
        nxt.indent === indent &&
        nxt.toks[0].k === 'kw' &&
        nxt.toks[0].v === 'else'
      ) {
        const elseLine = nxt.line;
        const eex = new ExprParser(nxt.toks, elseLine);
        this.p++;
        eex.expectKw('else');
        eex.expectOp(':');
        eex.end();
        otherwise = this.parseIndentedBody(indent, elseLine);
      }
      return { t: 'if', cond, then, else: otherwise, line };
    }

    // ---- swap A[i], A[j]
    if (toks[0].k === 'kw' && toks[0].v === 'swap') {
      this.p++;
      ex.expectKw('swap');
      const a = ex.parseExpr();
      ex.expectOp(',');
      const b = ex.parseExpr();
      ex.end();
      if (a.t !== 'index' || b.t !== 'index') {
        throw new PseudoError('swap needs two array slots, like: swap A[i], A[j]', line);
      }
      return { t: 'swap', a, b, line };
    }

    // ---- assignment: A[i] ← e   |   x ← e
    this.p++;
    const target = ex.parseExpr();
    ex.expectOp('<-');
    const value = ex.parseExpr();
    ex.end();
    if (target.t === 'index') return { t: 'store', index: target.index, e: value, line };
    if (target.t === 'var') return { t: 'assign', name: target.name, e: value, line };
    throw new PseudoError('The left of ← must be a variable or an array slot A[i].', line);
  }
}

/** Expression parser over one line's tokens. */
class ExprParser {
  private p = 0;
  constructor(
    private readonly toks: Tok[],
    private readonly line: number,
  ) {}

  private peek(): Tok | undefined {
    return this.toks[this.p];
  }

  matchOp(v: string): boolean {
    const t = this.peek();
    if (t && t.k === 'op' && t.v === v) {
      this.p++;
      return true;
    }
    return false;
  }
  matchKw(v: string): boolean {
    const t = this.peek();
    if (t && t.k === 'kw' && t.v === v) {
      this.p++;
      return true;
    }
    return false;
  }
  expectOp(v: string): void {
    if (!this.matchOp(v)) {
      throw new PseudoError(`I expected "${v === '<-' ? '←' : v}" here.`, this.line);
    }
  }
  expectKw(v: string): void {
    if (!this.matchKw(v)) throw new PseudoError(`I expected "${v}" here.`, this.line);
  }
  expectId(): string {
    const t = this.peek();
    if (!t || t.k !== 'id') throw new PseudoError('I expected a variable name here.', this.line);
    this.p++;
    return t.v;
  }
  end(): void {
    if (this.p < this.toks.length) {
      throw new PseudoError('There is unexpected extra code at the end of this line.', this.line);
    }
  }

  /** Parse an expression, stopping before any of these keywords. */
  parseUntil(stops: string[]): Expr {
    const save = this.stops;
    this.stops = stops;
    const e = this.parseExpr();
    this.stops = save;
    return e;
  }
  private stops: string[] = [];

  parseExpr(): Expr {
    return this.parseOr();
  }
  private atStop(): boolean {
    const t = this.peek();
    return !!t && t.k === 'kw' && this.stops.includes(t.v);
  }
  private parseOr(): Expr {
    let l = this.parseAnd();
    while (!this.atStop() && this.matchKw('or')) {
      l = { t: 'bin', op: 'or', l, r: this.parseAnd() };
    }
    return l;
  }
  private parseAnd(): Expr {
    let l = this.parseCmp();
    while (!this.atStop() && this.matchKw('and')) {
      l = { t: 'bin', op: 'and', l, r: this.parseCmp() };
    }
    return l;
  }
  private parseCmp(): Expr {
    const l = this.parseAdd();
    for (const op of ['<=', '>=', '==', '!=', '<', '>', '=']) {
      if (this.atStop()) break;
      if (this.matchOp(op)) {
        const norm = op === '=' ? '==' : op;
        return { t: 'bin', op: norm, l, r: this.parseAdd() };
      }
    }
    return l;
  }
  private parseAdd(): Expr {
    let l = this.parseMul();
    for (;;) {
      if (this.atStop()) break;
      if (this.matchOp('+')) l = { t: 'bin', op: '+', l, r: this.parseMul() };
      else if (this.matchOp('-')) l = { t: 'bin', op: '-', l, r: this.parseMul() };
      else break;
    }
    return l;
  }
  private parseMul(): Expr {
    let l = this.parseUnary();
    for (;;) {
      if (this.atStop()) break;
      if (this.matchOp('*')) l = { t: 'bin', op: '*', l, r: this.parseUnary() };
      else if (this.matchOp('/')) l = { t: 'bin', op: '/', l, r: this.parseUnary() };
      else if (this.matchOp('%')) l = { t: 'bin', op: '%', l, r: this.parseUnary() };
      else break;
    }
    return l;
  }
  private parseUnary(): Expr {
    if (this.matchOp('-')) return { t: 'un', op: '-', e: this.parseUnary() };
    if (this.matchKw('not')) return { t: 'un', op: 'not', e: this.parseUnary() };
    return this.parsePrimary();
  }
  private parsePrimary(): Expr {
    const t = this.peek();
    if (!t) throw new PseudoError('This line ends too early — something is missing.', this.line);

    if (t.k === 'num') {
      this.p++;
      return { t: 'num', v: t.v };
    }
    if (t.k === 'kw' && (t.v === 'true' || t.v === 'false')) {
      this.p++;
      return { t: 'bool', v: t.v === 'true' };
    }
    if (t.k === 'id') {
      this.p++;
      // A[expr] — array access
      if (this.matchOp('[')) {
        if (t.v !== 'A') {
          throw new PseudoError(`The array is called "A", not "${t.v}".`, this.line);
        }
        const idx = this.parseExpr();
        this.expectOp(']');
        return { t: 'index', index: idx };
      }
      return { t: 'var', name: t.v };
    }
    if (t.k === 'op' && t.v === '(') {
      this.p++;
      const e = this.parseExpr();
      this.expectOp(')');
      return e;
    }
    throw new PseudoError(`I did not expect "${t.v}" here.`, this.line);
  }
}

/* ------------------------------------------------------------------ */
/* Interpreter                                                        */
/* ------------------------------------------------------------------ */

/** Runaway-loop guard: a student's `while` with no progress must not hang the tab. */
const MAX_STEPS = 200_000;
const MAX_OPS = 5_000_000;

export interface RunResult {
  steps: Step[];
  /** The array after running their program. */
  result: number[];
  sorted: boolean;
  error?: PseudoError;
}

export function runPseudocode(source: string, input: readonly number[]): RunResult {
  const a = input.slice();
  const steps: Step[] = [];
  const env = new Map<string, number>();
  let ops = 0;

  const guard = (line: number) => {
    if (++ops > MAX_OPS || steps.length > MAX_STEPS) {
      throw new PseudoError(
        'This program ran for too long — is a loop missing its way out? (An infinite loop, perhaps.)',
        line,
      );
    }
  };

  const readIndex = (e: Expr, line: number): number => {
    const idx = Math.trunc(evalExpr(e, line));
    if (!Number.isFinite(idx) || idx < 0 || idx >= a.length) {
      throw new PseudoError(
        `Index ${idx} is outside the array (valid: 0 to ${a.length - 1}).`,
        line,
      );
    }
    return idx;
  };

  /** Does this expression read an array slot? Used to emit `compare` steps. */
  const indexOf = (e: Expr, line: number): number | null =>
    e.t === 'index' ? readIndex(e.index, line) : null;

  function evalExpr(e: Expr, line: number): number {
    guard(line);
    switch (e.t) {
      case 'num':
        return e.v;
      case 'bool':
        return e.v ? 1 : 0;
      case 'var': {
        if (e.name === 'n') return a.length;
        const v = env.get(e.name);
        if (v === undefined) {
          throw new PseudoError(`The variable "${e.name}" has no value yet.`, line);
        }
        return v;
      }
      case 'index':
        return a[readIndex(e.index, line)];
      case 'un':
        return e.op === '-' ? -evalExpr(e.e, line) : evalExpr(e.e, line) ? 0 : 1;
      case 'bin': {
        // Comparing two array slots is the teaching moment — emit a compare step.
        if (['<', '>', '<=', '>=', '==', '!='].includes(e.op)) {
          const li = indexOf(e.l, line);
          const ri = indexOf(e.r, line);
          if (li !== null && ri !== null) {
            steps.push({ type: 'compare', i: li, j: ri, line });
          }
        }
        const l = evalExpr(e.l, line);
        // Short-circuit the logical operators.
        if (e.op === 'and') return l && evalExpr(e.r, line) ? 1 : 0;
        if (e.op === 'or') return l || evalExpr(e.r, line) ? 1 : 0;
        const r = evalExpr(e.r, line);
        switch (e.op) {
          case '+':
            return l + r;
          case '-':
            return l - r;
          case '*':
            return l * r;
          case '/':
            return r === 0 ? 0 : Math.trunc(l / r);
          case '%':
            return r === 0 ? 0 : l % r;
          case '<':
            return l < r ? 1 : 0;
          case '>':
            return l > r ? 1 : 0;
          case '<=':
            return l <= r ? 1 : 0;
          case '>=':
            return l >= r ? 1 : 0;
          case '==':
            return l === r ? 1 : 0;
          case '!=':
            return l !== r ? 1 : 0;
          default:
            throw new PseudoError(`Unknown operator "${e.op}".`, line);
        }
      }
    }
  }

  function exec(body: Stmt[]): void {
    for (const s of body) {
      guard(s.line);
      switch (s.t) {
        case 'assign':
          env.set(s.name, evalExpr(s.e, s.line));
          break;
        case 'store': {
          const idx = readIndex(s.index, s.line);
          const v = evalExpr(s.e, s.line);
          steps.push({ type: 'overwrite', index: idx, value: v, line: s.line });
          a[idx] = v;
          break;
        }
        case 'swap': {
          const i = readIndex((s.a as { t: 'index'; index: Expr }).index, s.line);
          const j = readIndex((s.b as { t: 'index'; index: Expr }).index, s.line);
          steps.push({ type: 'swap', i, j, line: s.line });
          const tmp = a[i];
          a[i] = a[j];
          a[j] = tmp;
          break;
        }
        case 'for': {
          const from = Math.trunc(evalExpr(s.from, s.line));
          const to = Math.trunc(evalExpr(s.to, s.line));
          if (s.down) {
            for (let v = from; v >= to; v--) {
              env.set(s.name, v);
              guard(s.line);
              exec(s.body);
            }
          } else {
            for (let v = from; v <= to; v++) {
              env.set(s.name, v);
              guard(s.line);
              exec(s.body);
            }
          }
          break;
        }
        case 'while':
          while (evalExpr(s.cond, s.line)) {
            guard(s.line);
            exec(s.body);
          }
          break;
        case 'if':
          if (evalExpr(s.cond, s.line)) exec(s.then);
          else exec(s.else);
          break;
      }
    }
  }

  try {
    const program = new Parser(prepare(source)).parseProgram();
    if (program.length === 0) {
      return { steps: [], result: a, sorted: false, error: new PseudoError('Write some code first.', 1) };
    }
    exec(program);
  } catch (err) {
    const e =
      err instanceof PseudoError
        ? err
        : new PseudoError(err instanceof Error ? err.message : 'Something went wrong.', 1);
    return { steps, result: a, sorted: false, error: e };
  }

  const sorted = a.every((v, i) => i === 0 || a[i - 1] <= v);
  if (sorted) {
    steps.push({ type: 'markSorted', indices: a.map((_, i) => i) });
  }
  return { steps, result: a, sorted };
}
