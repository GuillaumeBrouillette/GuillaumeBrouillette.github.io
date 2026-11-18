// Parser for real functions of x, y and z, used by the function fields of the
// applet. The expression is compiled to a JavaScript closure. Nothing is
// evaluated with eval.
//
// Accepted syntax
//   variables      x, y, z
//   constants      pi, e
//   numbers        2, 0.5, 1e-3 (decimal point)
//   operations     + - * / ^, parentheses, absolute value bars |x|
//   products       2x, 3xy, 2(x + 1), (x + 1)(y - 1)
//   functions      abs, sqrt, exp, ln, log, log10, sin, cos, tan, asin, acos,
//                  atan, atan2, min, max, hypot, sign, floor, ceil, round
//
// compile(text) returns { fn } on success, where fn(x, y, z) is a number, or
// { error: { code, pos, name } } with code "empty", "syntax", "unknown" or
// "arity".

const FUNCTIONS = {
  abs: [Math.abs, 1], sqrt: [Math.sqrt, 1], exp: [Math.exp, 1],
  ln: [Math.log, 1], log: [Math.log, 1], log10: [Math.log10, 1],
  sin: [Math.sin, 1], cos: [Math.cos, 1], tan: [Math.tan, 1],
  asin: [Math.asin, 1], acos: [Math.acos, 1], atan: [Math.atan, 1],
  atan2: [Math.atan2, 2], min: [Math.min, -1], max: [Math.max, -1],
  hypot: [Math.hypot, -1], sign: [Math.sign, 1],
  floor: [Math.floor, 1], ceil: [Math.ceil, 1], round: [Math.round, 1],
};
const CONSTANTS = { pi: Math.PI, e: Math.E };
const VARIABLES = { x: 0, y: 1, z: 2 };

class ExprError extends Error {
  constructor(code, pos, name) {
    super(code);
    this.code = code; this.pos = pos; this.name = name;
  }
}

function tokenize(text) {
  // Common typographic variants are accepted.
  const src = text
    .replace(/[−–]/g, "-").replace(/[×·]/g, "*").replace(/÷/g, "/")
    .replace(/²/g, "^2").replace(/³/g, "^3").replace(/π/g, "pi");
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) {
      const m = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(src.slice(i));
      if (!m) throw new ExprError("syntax", i);
      tokens.push({ type: "num", value: Number(m[0]), pos: i });
      i += m[0].length;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      const m = /^[A-Za-z_][A-Za-z_0-9]*/.exec(src.slice(i));
      tokens.push({ type: "id", value: m[0], pos: i });
      i += m[0].length;
      continue;
    }
    if ("+-*/^(),|".includes(c)) {
      tokens.push({ type: c, pos: i });
      i++;
      continue;
    }
    throw new ExprError("syntax", i);
  }
  tokens.push({ type: "end", pos: src.length });
  return tokens;
}

export function compile(text) {
  if (!text || text.trim() === "") return { error: { code: "empty", pos: 0 } };
  try {
    const tokens = tokenize(text);
    let k = 0;
    const peek = () => tokens[k];
    const next = () => tokens[k++];
    const expect = (type) => {
      if (peek().type !== type) throw new ExprError("syntax", peek().pos);
      return next();
    };

    // expression := term (("+" | "-") term)*
    const expression = () => {
      let left = term();
      while (peek().type === "+" || peek().type === "-") {
        const op = next().type;
        const a = left, b = term();
        left = op === "+" ? (v) => a(v) + b(v) : (v) => a(v) - b(v);
      }
      return left;
    };

    // term := unary (("*" | "/") unary | factor)*
    // A factor placed next to another one is multiplied by it: 2x, 3(x + 1).
    const term = () => {
      let left = unary();
      for (;;) {
        const type = peek().type;
        if (type === "*" || type === "/") {
          next();
          const a = left, b = unary();
          left = type === "*" ? (v) => a(v) * b(v) : (v) => a(v) / b(v);
        } else if (type === "num" || type === "id" || type === "(") {
          const a = left, b = power();
          left = (v) => a(v) * b(v);
        } else {
          return left;
        }
      }
    };

    // unary := ("-" | "+") unary | power
    const unary = () => {
      if (peek().type === "-") { next(); const a = unary(); return (v) => -a(v); }
      if (peek().type === "+") { next(); return unary(); }
      return power();
    };

    // power := primary ("^" unary)?     so that -x^2 = -(x^2) and 2^-x is valid
    const power = () => {
      const base = primary();
      if (peek().type === "^") {
        next();
        const exponent = unary();
        return (v) => Math.pow(base(v), exponent(v));
      }
      return base;
    };

    const primary = () => {
      const tok = next();
      if (tok.type === "num") { const c = tok.value; return () => c; }
      if (tok.type === "(") { const inner = expression(); expect(")"); return inner; }
      if (tok.type === "|") { const inner = expression(); expect("|"); return (v) => Math.abs(inner(v)); }
      if (tok.type === "id") {
        const name = tok.value;
        const lower = name.toLowerCase();
        if (peek().type === "(" && FUNCTIONS[lower]) {
          next();
          const args = [];
          if (peek().type !== ")") {
            args.push(expression());
            while (peek().type === ",") { next(); args.push(expression()); }
          }
          expect(")");
          const [fn, arity] = FUNCTIONS[lower];
          if ((arity > 0 && args.length !== arity) || (arity < 0 && args.length === 0)) {
            throw new ExprError("arity", tok.pos, name);
          }
          if (args.length === 1) { const a = args[0]; return (v) => fn(a(v)); }
          if (args.length === 2) { const a = args[0], b = args[1]; return (v) => fn(a(v), b(v)); }
          return (v) => fn(...args.map((a) => a(v)));
        }
        if (lower in VARIABLES) { const i = VARIABLES[lower]; return (v) => v[i]; }
        if (lower in CONSTANTS) { const c = CONSTANTS[lower]; return () => c; }
        // A word made of the letters x, y and z is read as a product: xy, xyz.
        if (/^[xyz]+$/.test(lower)) {
          const idx = [...lower].map((ch) => VARIABLES[ch]);
          return (v) => idx.reduce((p, i) => p * v[i], 1);
        }
        throw new ExprError("unknown", tok.pos, name);
      }
      throw new ExprError("syntax", tok.pos);
    };

    const root = expression();
    if (peek().type !== "end") throw new ExprError("syntax", peek().pos);
    return { fn: (x, y, z) => root([x, y, z]) };
  } catch (err) {
    if (err instanceof ExprError) return { error: { code: err.code, pos: err.pos, name: err.name } };
    throw err;
  }
}
