/**
 * LaTeX 数学公式 → UTF-8 可读文本转换器
 *
 * 目标：将 AI 输出的 LaTeX 公式（$...$ / $$...$$）转换为人类易读的 Unicode 数学符号。
 * 不是完整的 LaTeX 解析器，而是覆盖学术论文中最常见的模式。
 */

// =============================================================================
// 希腊字母映射
// =============================================================================

const GREEK_MAP: Record<string, string> = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', zeta: 'ζ',
  eta: 'η', theta: 'θ', iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ',
  nu: 'ν', xi: 'ξ', omicron: 'ο', pi: 'π', rho: 'ρ', sigma: 'σ',
  tau: 'τ', upsilon: 'υ', phi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
  varepsilon: 'ε', vartheta: 'ϑ', varpi: 'ϖ', varrho: 'ϱ', varsigma: 'ς',
  varphi: 'φ',
  // 大写
  Alpha: 'Α', Beta: 'Β', Gamma: 'Γ', Delta: 'Δ', Epsilon: 'Ε', Zeta: 'Ζ',
  Eta: 'Η', Theta: 'Θ', Iota: 'Ι', Kappa: 'Κ', Lambda: 'Λ', Mu: 'Μ',
  Nu: 'Ν', Xi: 'Ξ', Omicron: 'Ο', Pi: 'Π', Rho: 'Ρ', Sigma: 'Σ',
  Tau: 'Τ', Upsilon: 'Υ', Phi: 'Φ', Chi: 'Χ', Psi: 'Ψ', Omega: 'Ω',
}

// =============================================================================
// 数学符号映射
// =============================================================================

const MATH_SYMBOLS: Record<string, string> = {
  // 运算符
  sum: 'Σ', prod: 'Π', int: '∫', iint: '∬', iiint: '∭',
  oint: '∮', nabla: '∇', partial: '∂', infty: '∞',
  // 关系
  in: '∈', notin: '∉', subset: '⊂', supset: '⊃',
  subseteq: '⊆', supseteq: '⊇', cup: '∪', cap: '∩',
  emptyset: '∅', forall: '∀', exists: '∃', neg: '¬',
  land: '∧', lor: '∨', equiv: '≡', sim: '~',
  approx: '≈', propto: '∝', perp: '⊥', parallel: '∥',
  // 比较
  leq: '≤', geq: '≥', neq: '≠', ll: '≪', gg: '≫',
  pm: '±', mp: '∓', times: '×', cdot: '·', div: '÷',
  // 箭头
  rightarrow: '→', leftarrow: '←',Rightarrow: '⇒', Leftarrow: '⇐',
  leftrightarrow: '↔',Leftrightarrow: '⇔', mapsto: '↦', to: '→',
  // 其他
  dots: '...', ldots: '...', cdots: '...', vdots: '⋮', ddots: '⋱',
  sqrt: '√', checkmark: '✓', star: '★', bullet: '•',
  prime: '′', dagger: '†', ell: 'ℓ', wp: '℘', Re: 'ℜ', Im: 'ℑ',
  aleph: 'ℵ', hbar: 'ℏ',
}

// =============================================================================
// 上下标数字映射（有限支持常用数字和字母）
// =============================================================================

const SUPERSCRIPT_MAP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵',
  '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ', 'f': 'ᶠ',
  'g': 'ᵍ', 'h': 'ʰ', 'i': 'ⁱ', 'j': 'ʲ', 'k': 'ᵏ', 'l': 'ˡ',
  'm': 'ᵐ', 'n': 'ⁿ', 'o': 'ᵒ', 'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ',
  't': 'ᵗ', 'u': 'ᵘ', 'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ',
  'A': 'ᴬ', 'B': 'ᴮ', 'D': 'ᴰ', 'E': 'ᴱ', 'G': 'ᴳ', 'H': 'ᴴ',
  'I': 'ᴵ', 'J': 'ᴶ', 'K': 'ᴷ', 'L': 'ᴸ', 'M': 'ᴹ', 'N': 'ᴺ',
  'O': 'ᴼ', 'P': 'ᴾ', 'R': 'ᴿ', 'T': 'ᵀ', 'U': 'ᵁ', 'V': 'ⱽ', 'W': 'ᵂ',
}

const SUBSCRIPT_MAP: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅',
  '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
  'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ', 'k': 'ₖ',
  'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ', 'p': 'ₚ', 'r': 'ᵣ',
  's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ', 'v': 'ᵥ', 'x': 'ₓ', 'y': 'ᵧ',
  'z': '₂',
  'β': 'ᵦ', 'γ': 'ᵧ', 'ρ': 'ᵨ', 'φ': 'ᵩ', 'χ': 'ᵪ',
}

// =============================================================================
// 集合符号
// =============================================================================

const BB_MAP: Record<string, string> = {
  R: 'ℝ', N: 'ℕ', Z: 'ℤ', Q: 'ℚ', C: 'ℂ', H: 'ℍ', P: 'ℙ',
}

const CAL_MAP: Record<string, string> = {
  A: '𝒜', B: 'ℬ', C: '𝒞', D: '𝒟', E: 'ℰ', F: 'ℱ', G: '𝒢',
  H: 'ℋ', I: 'ℐ', J: '𝒥', K: '𝒦', L: 'ℒ', M: 'ℳ', N: '𝒩',
  O: '𝒪', P: '𝒫', Q: '𝒬', R: 'ℛ', S: '𝒮', T: '𝒯', U: '𝒰',
  V: '𝒱', W: '𝒲', X: '𝒳', Y: '𝒴', Z: '𝒵',
}

const FRAK_MAP: Record<string, string> = {
  a: '𝔞', b: '𝔟', c: '𝔠', d: '𝔡', e: '𝔢', f: '𝔣', g: '𝔤',
  h: '𝔥', i: '𝔦', j: '𝔧', k: '𝔨', l: '𝔩', m: '𝔪', n: '𝔫',
  o: '𝔬', p: '𝔭', q: '𝔮', r: '𝔯', s: '𝔰', t: '𝔱', u: '𝔲',
  v: '𝔳', w: '𝔴', x: '𝔵', y: '𝔶', z: '𝔷',
  A: '𝔄', B: '𝔅', C: 'ℭ', D: '𝔇', E: '𝔈', F: '𝔉', G: '𝔊',
  H: 'ℌ', I: 'ℑ', J: '𝔍', K: '𝔎', L: '𝔏', M: '𝔐', N: '𝔑',
  O: '𝔒', P: '𝔓', Q: '𝔔', R: 'ℜ', S: '𝔖', T: '𝔗', U: '𝔘',
  V: '𝔙', W: '𝔚', X: '𝔛', Y: '𝔜', Z: 'ℨ',
}

// =============================================================================
// 核心转换函数
// =============================================================================

/**
 * 将单个 LaTeX 命令（不含反斜杠）转换为 Unicode
 */
function convertCommand(cmd: string): string {
  if (GREEK_MAP[cmd]) return GREEK_MAP[cmd]
  if (MATH_SYMBOLS[cmd]) return MATH_SYMBOLS[cmd]
  return cmd
}

/**
 * 转换上下标：x^{abc} → xᵃᵇᶜ（尽量转换），x_{i} → xᵢ
 */
function convertScripts(text: string): string {
  // 处理 ^{...} 和 _{...}（花括号包裹）
  let result = text

  // 先处理 ^{单个字符} 和 _{单个字符}
  result = result.replace(/\^\{([^{}])\}/g, (_match, char) => {
    return SUPERSCRIPT_MAP[char] || `^(${char})`
  })
  result = result.replace(/_\{([^{}])\}/g, (_match, char) => {
    return SUBSCRIPT_MAP[char] || `_(${char})`
  })

  // 处理 ^单个字符（无花括号）
  result = result.replace(/\^([0-9a-zA-Z+\-=!()])/g, (_match, char) => {
    return SUPERSCRIPT_MAP[char] || `^${char}`
  })
  result = result.replace(/_([0-9a-zA-Z+\-=!()βγρφχ])/g, (_match, char) => {
    return SUBSCRIPT_MAP[char] || `_${char}`
  })

  // 处理 ^{多字符} — 尽量逐字符转换
  result = result.replace(/\^\{([^{}]+)\}/g, (_match, content) => {
    let converted = ''
    for (const ch of content) {
      converted += SUPERSCRIPT_MAP[ch] || ch
    }
    return converted
  })
  result = result.replace(/_\{([^{}]+)\}/g, (_match, content) => {
    let converted = ''
    for (const ch of content) {
      converted += SUBSCRIPT_MAP[ch] || ch
    }
    return converted
  })

  return result
}

/**
 * 转换分数 \frac{a}{b} → (a/b)
 */
function convertFractions(text: string): string {
  // 递归处理嵌套分数
  let result = text
  let prev = ''
  // 最多处理 5 层嵌套
  for (let i = 0; i < 5; i++) {
    prev = result
    result = result.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, (_match, num, den) => {
      const n = num.trim()
      const d = den.trim()
      // 简单情况不需要括号
      if (/^[a-zA-Z0-9α-ωΑ-Ω]$/.test(n) && /^[a-zA-Z0-9α-ωΑ-Ω]$/.test(d)) {
        return `${n}/${d}`
      }
      return `(${n})/(${d})`
    })
    if (result === prev) break
  }
  return result
}

/**
 * 转换 \mathbb{}, \mathcal{}, \mathfrak{}
 */
function convertFontCommands(text: string): string {
  return text
    .replace(/\\mathbb\{([A-Z])\}/g, (_match, letter) => BB_MAP[letter] || letter)
    .replace(/\\mathcal\{([A-Z])\}/g, (_match, letter) => CAL_MAP[letter] || letter)
    .replace(/\\mathfrak\{([A-Za-z])\}/g, (_match, letter) => FRAK_MAP[letter] || letter)
}

/**
 * 转换常见函数名（去掉反斜杠）
 */
const FUNCTION_NAMES = new Set([
  'min', 'max', 'arg', 'lim', 'log', 'ln', 'exp', 'sin', 'cos', 'tan',
  'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh',
  'det', 'tr', 'rank', 'dim', 'ker', 'span', 'diag', 'vec', 'mat',
  'Pr', 'E', 'Var', 'Cov', 'Bias', 'MSE', 'RMSE', 'softmax', 'relu',
  'sigmoid', 'tanh',
])

function convertFunctions(text: string): string {
  // \arg\min → arg min, \arg\max → arg max
  let result = text.replace(/\\arg\\(min|max)\b/g, 'arg $1')
  // 其他函数去掉反斜杠
  for (const fn of Array.from(FUNCTION_NAMES)) {
    const regex = new RegExp(`\\\\${fn}\\b`, 'g')
    result = result.replace(regex, fn)
  }
  return result
}

/**
 * 转换 \left( \right) 等括号命令为普通括号
 */
function convertBrackets(text: string): string {
  return text
    .replace(/\\left\(/g, '(')
    .replace(/\\right\)/g, ')')
    .replace(/\\left\[/g, '[')
    .replace(/\\right\]/g, ']')
    .replace(/\\left\{/g, '{')
    .replace(/\\right\}/g, '}')
    .replace(/\\left\|/g, '|')
    .replace(/\\right\|/g, '|')
    .replace(/\\left\./g, '')
    .replace(/\\right\./g, '')
    .replace(/\\langle/g, '⟨')
    .replace(/\\rangle/g, '⟩')
}

/**
 * 转换 \text{...} 为纯文本
 */
function convertTextCommands(text: string): string {
  return text.replace(/\\text\{([^{}]*)\}/g, '$1')
}

/**
 * 转换矩阵环境为简化格式
 */
function convertMatrix(text: string): string {
  return text
    .replace(/\\begin\{bmatrix\}([\s\S]*?)\\end\{bmatrix\}/g, (_match, content) => {
      const rows = content.split('\\\\').map((r: string) => r.trim())
      return '[ ' + rows.join(' ; ') + ' ]'
    })
    .replace(/\\begin\{pmatrix\}([\s\S]*?)\\end\{pmatrix\}/g, (_match, content) => {
      const rows = content.split('\\\\').map((r: string) => r.trim())
      return '( ' + rows.join(' ; ') + ' )'
    })
    .replace(/\\begin\{matrix\}([\s\S]*?)\\end\{matrix\}/g, (_match, content) => {
      const rows = content.split('\\\\').map((r: string) => r.trim())
      return '[ ' + rows.join(' ; ') + ' ]'
    })
}

/**
 * 主转换函数：将 LaTeX 数学内容转为 UTF-8 文本
 */
export function convertLatexToUtf8(latex: string): string {
  let result = latex.trim()

  // 处理 LaTeX 换行符 \\（双反斜杠）
  result = result.replace(/\\\\\s*/g, ' ')

  // 矩阵环境
  result = convertMatrix(result)

  // 分数
  result = convertFractions(result)

  // 字体命令
  result = convertFontCommands(result)

  // 括号命令
  result = convertBrackets(result)

  // \text{}
  result = convertTextCommands(result)

  // 常见函数
  result = convertFunctions(result)

  // 上下标（在命令转换之后）
  result = convertScripts(result)

  // 通用命令转换（\alpha → α 等）
  result = result.replace(/\\([a-zA-Z]+)(?![a-zA-Z])/g, (_match, cmd) => {
    return convertCommand(cmd)
  })

  // 清理多余空格
  result = result.replace(/\s+/g, ' ').trim()

  return result
}

// =============================================================================
// Markdown 集成：处理 $...$ 和 $$...$$
// =============================================================================

/**
 * 在 Markdown 文本中查找并转换所有 LaTeX 公式块
 * 返回 { text: 转换后的文本, hasMath: 是否包含公式 }
 */
export function processMathInMarkdown(markdown: string): { text: string; hasMath: boolean } {
  let text = markdown
  let hasMath = false

  // 处理 $$...$$ 显示公式（优先处理，避免被 $ 匹配）
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_match, latex) => {
    hasMath = true
    const converted = convertLatexToUtf8(latex)
    return `<div class="math-display">${converted}</div>`
  })

  // 处理 $...$ 行内公式
  text = text.replace(/\$([^$\n]+?)\$/g, (_match, latex) => {
    hasMath = true
    const converted = convertLatexToUtf8(latex)
    return `<span class="math-inline">${converted}</span>`
  })

  return { text, hasMath }
}

/**
 * 轻量级转换：仅提取公式内容，保留原始文本结构
 * 用于 prompt 后处理
 */
export function stripLatexDelimiters(text: string): string {
  return text
    .replace(/\$\$([\s\S]*?)\$\$/g, '$1')
    .replace(/\$([^$\n]+?)\$/g, '$1')
}
