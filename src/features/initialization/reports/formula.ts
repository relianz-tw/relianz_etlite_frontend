import type { ReportFieldDef } from './types';

/**
 * 算式欄位的前端試算（metadata formula.expr）。
 * 只用來在使用者還沒自己填、也沒有辨識帶入值時，先把算出來的數字顯示在欄位裡；
 * 欄位本身可編輯，有值（辨識帶入或使用者輸入）一律以該值為主，不會被算式蓋掉。
 * 語法：+ - * /、括號、比較、SUM(A:B)、IF、MIN、MAX、FLOOR。
 */

type Token = { type: 'num' | 'id' | 'op'; text: string };

const TOKEN_RE = /\s*(\d+(?:\.\d+)?|[A-Za-z_][A-Za-z0-9_]*|<=|>=|==|[-+*/(),:<>])/y;

function tokenize(expr: string): Token[] | null {
  const tokens: Token[] = [];
  TOKEN_RE.lastIndex = 0;
  while (TOKEN_RE.lastIndex < expr.length) {
    const m = TOKEN_RE.exec(expr);
    if (!m) return expr.slice(TOKEN_RE.lastIndex).trim() === '' ? tokens : null;
    const text = m[1];
    tokens.push({ type: /^\d/.test(text) ? 'num' : /^[A-Za-z_]/.test(text) ? 'id' : 'op', text });
  }
  return tokens;
}

/** 運算元取值：回傳數值與「使用者／辨識是否真的填過」 */
export interface Operand {
  value: number;
  touched: boolean;
}

interface EvalContext {
  /** 以 rowCode（依算式所在欄位的 BOOK／ADJ）或 fieldCode 取得運算元 */
  resolve: (id: string) => Operand | null;
  /** SUM(A:B)：fields 回傳順序中 A 到 B（含）的運算元 */
  range: (from: string, to: string) => Operand[] | null;
}

class Parser {
  private pos = 0;
  touched = false;

  constructor(
    private tokens: Token[],
    private ctx: EvalContext
  ) {}

  parse(): number {
    const value = this.comparison();
    if (this.pos < this.tokens.length) throw new Error('unexpected token');
    return value;
  }

  private peek = () => this.tokens[this.pos];
  private take = () => this.tokens[this.pos++];
  private eat(text: string) {
    if (this.peek()?.text !== text) throw new Error(`expected ${text}`);
    this.pos++;
  }

  private comparison(): number {
    const left = this.additive();
    const op = this.peek()?.text;
    if (op === '<' || op === '<=' || op === '>' || op === '>=' || op === '==') {
      this.pos++;
      const right = this.additive();
      const result = op === '<' ? left < right : op === '<=' ? left <= right : op === '>' ? left > right : op === '>=' ? left >= right : left === right;
      return result ? 1 : 0;
    }
    return left;
  }

  private additive(): number {
    let value = this.term();
    while (this.peek()?.text === '+' || this.peek()?.text === '-') {
      value = this.take().text === '+' ? value + this.term() : value - this.term();
    }
    return value;
  }

  private term(): number {
    let value = this.unary();
    while (this.peek()?.text === '*' || this.peek()?.text === '/') {
      value = this.take().text === '*' ? value * this.unary() : value / this.unary();
    }
    return value;
  }

  private unary(): number {
    if (this.peek()?.text === '-') {
      this.pos++;
      return -this.unary();
    }
    return this.primary();
  }

  private operand(o: Operand | null): number {
    if (!o) return 0;
    if (o.touched) this.touched = true;
    return o.value;
  }

  private primary(): number {
    const token = this.take();
    if (!token) throw new Error('unexpected end');
    if (token.type === 'num') return Number(token.text);
    if (token.text === '(') {
      const value = this.comparison();
      this.eat(')');
      return value;
    }
    if (token.type !== 'id') throw new Error('unexpected token');
    if (this.peek()?.text !== '(') return this.operand(this.ctx.resolve(token.text));
    return this.call(token.text.toUpperCase());
  }

  private call(name: string): number {
    this.eat('(');
    if (name === 'SUM') {
      const from = this.take();
      this.eat(':');
      const to = this.take();
      this.eat(')');
      const operands = this.ctx.range(from.text, to.text);
      if (!operands) throw new Error('unsupported range');
      return operands.reduce((sum, o) => sum + this.operand(o), 0);
    }
    const args = [this.comparison()];
    while (this.peek()?.text === ',') {
      this.pos++;
      args.push(this.comparison());
    }
    this.eat(')');
    switch (name) {
      case 'IF':
        return args[0] ? args[1] : args[2];
      case 'MIN':
        return Math.min(...args);
      case 'MAX':
        return Math.max(...args);
      case 'FLOOR':
        return Math.floor(args[0]);
      default:
        throw new Error(`unknown function ${name}`);
    }
  }
}

/** 算一條算式；語法不支援、除以 0、運算元都沒填過時回 null（欄位就維持空白，不顯示 0） */
export function evaluateFormula(expr: string, ctx: EvalContext): number | null {
  const tokens = tokenize(expr);
  if (!tokens) return null;
  try {
    const parser = new Parser(tokens, ctx);
    const value = parser.parse();
    return parser.touched && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

const MAX_DEPTH = 20;

/**
 * 取得算式欄位的試算值。
 * @param fields metadata 欄位（依後端回傳順序）
 * @param getStored 讀取某欄位目前存的值（辨識帶入或使用者輸入），空字串代表沒有
 */
export function computeFieldValue(field: ReportFieldDef, fields: ReportFieldDef[], getStored: (key: string) => string | number | undefined): number | null {
  const isFilled = (key: string) => {
    const v = getStored(key);
    return v !== undefined && v !== '';
  };

  const effective = (target: ReportFieldDef, depth: number): Operand | null => {
    if (isFilled(target.key)) return { value: Number(getStored(target.key)) || 0, touched: true };
    if (!target.formulaExpr || depth > MAX_DEPTH) return { value: 0, touched: false };
    const value = evaluateFormula(target.formulaExpr, contextFor(target, depth + 1));
    return value === null ? { value: 0, touched: false } : { value, touched: true };
  };

  const contextFor = (owner: ReportFieldDef, depth: number): EvalContext => {
    // 運算元用 rowCode：帳載欄只取帳載、調整後欄只取調整後；沒有 rowCode 就用 fieldCode
    const find = (id: string) => fields.find(f => !f.isRow && f.rowCode === id && (!owner.column || f.column === owner.column)) ?? fields.find(f => f.key === id);
    return {
      resolve: id => {
        const target = find(id);
        return target && !target.isRow ? effective(target, depth) : null;
      },
      range: (from, to) => {
        const start = fields.indexOf(find(from) as ReportFieldDef);
        const end = fields.indexOf(find(to) as ReportFieldDef);
        if (start < 0 || end < start) return null;
        const slice = fields.slice(start, end + 1);
        // 範圍內有可重複列欄位（要加總所有資料列）前端不算
        if (slice.some(f => f.isRow)) return null;
        return slice.filter(f => !owner.column || !f.column || f.column === owner.column).map(f => effective(f, depth) as Operand);
      },
    };
  };

  if (!field.formulaExpr) return null;
  const value = evaluateFormula(field.formulaExpr, contextFor(field, 0));
  if (value === null) return null;
  return field.type === 'money' || field.type === 'integer' ? Math.round(value) : Math.round(value * 100) / 100;
}

/**
 * 可重複列（投資人明細等）同一列內的算式試算，如 23＝5－22（ROW_DIST_AMT - ROW_RE_INCOME）。
 * 運算元用該列欄位的 fieldCode；規則同 computeFieldValue：有值以值為主，運算元都沒填過不試算。
 * @param columns 該表的列欄位（依後端回傳順序）
 */
export function computeRowFieldValue(field: ReportFieldDef, columns: ReportFieldDef[], row: Record<string, { value: string | number }>): number | null {
  if (!field.formulaExpr) return null;
  const isFilled = (key: string) => row[key] !== undefined && row[key].value !== '';

  const effective = (target: ReportFieldDef, depth: number): Operand => {
    if (isFilled(target.key)) return { value: Number(row[target.key].value) || 0, touched: true };
    if (!target.formulaExpr || depth > MAX_DEPTH) return { value: 0, touched: false };
    const value = evaluateFormula(target.formulaExpr, { resolve, range: () => null });
    return value === null ? { value: 0, touched: false } : { value, touched: true };
  };
  const resolve = (id: string): Operand | null => {
    const target = columns.find(c => c.key === id);
    return target ? effective(target, 1) : null;
  };

  const value = evaluateFormula(field.formulaExpr, { resolve, range: () => null });
  if (value === null) return null;
  return field.type === 'money' || field.type === 'integer' ? Math.round(value) : Math.round(value * 100) / 100;
}
