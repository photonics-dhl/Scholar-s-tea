/**
 * 公式乱码检测逻辑测试
 * 验证 hasRepeatedCharPattern 能正确区分乱码和正常文本
 */

function hasRepeatedCharPattern(text) {
  const NORMAL_PATTERNS = new Set([
    'II', 'III', 'IV', 'VI', 'VII', 'VIII', 'IX', 'XI', 'XII',
    'CC', 'BB', 'LL', 'PP', 'RR', 'SS', 'VV', 'WW', 'XX', 'YY', 'ZZ',
    'AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG',
    'BA', 'BC', 'BD', 'BE', 'BF', 'BG',
    'CA', 'CB', 'CD', 'CE', 'CF', 'CG',
    'DA', 'DB', 'DC', 'DD', 'DE', 'DF', 'DG',
    'EA', 'EB', 'EC', 'ED', 'EF', 'EG',
    'FA', 'FB', 'FC', 'FD', 'FE', 'FF', 'FG',
    'GA', 'GB', 'GC', 'GD', 'GE', 'GF', 'GG',
  ])

  // 1. 替换字符（最高优先级乱码信号）
  if (text.includes('\uFFFD')) return true

  // 2. 大写 2+ 重复，过滤正常模式
  const upperMatches = text.match(/\b([A-Z])\1{1,}\b/g)
  if (upperMatches) {
    const badMatches = upperMatches.filter((m) => !NORMAL_PATTERNS.has(m))
    if (badMatches.length > 0) return true
  }

  // 3. 连续 2+ 相同希腊字母
  if (/([\u03B1-\u03C9\u0391-\u03A9])\1{1,}/.test(text)) return true

  // 4. 连续 2+ 相同数学符号
  if (/([\u2200-\u22FF\u2A00-\u2AFF])\1{1,}/.test(text)) return true

  // 5. 等号附近的重复字母对
  if (/\b([A-Z])\1\b\s*[=+\-*/]\s*\b([A-Z])\2\b/.test(text)) return true

  // 6. 函数模式 XX(，过滤白名单
  const funcMatches = text.match(/\b([A-Z])\1\s*\(/g)
  if (funcMatches) {
    const badFuncMatches = funcMatches.filter((m) => {
      const matchResult = m.match(/([A-Z])\1/)
      if (!matchResult) return false
      return !NORMAL_PATTERNS.has(matchResult[0])
    })
    if (badFuncMatches.length > 0) return true
  }

  // 7. 小写重复在数学运算符后
  if (/[=+\-*·\u2202\u2207\u222B\u2211\u220F\u221A]\s*([a-z])\1{1,}/.test(text)) return true

  return false
}

// ========== 测试用例 ==========

const testCases = [
  // --- 应检测为乱码的用例 ---
  {
    name: '经典乱码公式：EE = UU(y,z)',
    text: 'EE = UU (yy, zz) · ee ii (ωω0 ∂∂ −ββββ) (4)',
    expect: true,
  },
  {
    name: '双字母乱码：HH(x)',
    text: 'The Hamiltonian HH(x) = pp^2/2m + VV(x)',
    expect: true,
  },
  {
    name: '双字母等号：QQ = PP',
    text: 'The charge QQ = PP/VV for the capacitor',
    expect: true,
  },
  {
    name: '重复希腊字母：ωω',
    text: 'The frequency is ωω0 = 2πf',
    expect: true,
  },
  {
    name: '重复数学符号：∂∂',
    text: 'The wave equation: ∂∂u/∂∂t = c²∇∇u',
    expect: true,
  },
  {
    name: '替换字符：�',
    text: 'The equation is E = mc� where � is unknown',
    expect: true,
  },
  {
    name: '小写数学重复：= ee',
    text: 'Complex amplitude = ee^(iθ)',
    expect: true,
  },
  {
    name: '多字母重复：NNN',
    text: 'The number of particles NNN is conserved',
    expect: true,
  },

  // --- 应检测为正常的用例 ---
  {
    name: '罗马数字：III',
    text: 'See Figure III for the phase diagram. The results show clear trends.',
    expect: false,
  },
  {
    name: 'URL中的ww：/www',
    text: 'Available at https://www.example.com/paper.pdf or /www/data',
    expect: false,
  },
  {
    name: '缩写CC：Creative Commons',
    text: 'This work is licensed under CC BY 4.0. See creativecommons.org.',
    expect: false,
  },
  {
    name: '正常数学公式：E = mc²',
    text: 'Einstein famous equation: E = mc² where E is energy.',
    expect: false,
  },
  {
    name: '正常文本：无重复',
    text: 'The quick brown fox jumps over the lazy dog.',
    expect: false,
  },
  {
    name: 'LaTeX正常公式：\\alpha + \\beta',
    text: 'The sum \\alpha + \\beta = \\gamma is well known.',
    expect: false,
  },
  {
    name: '论文引用：arXiv编号',
    text: 'See [12] and arXiv:2101.12345 for details.',
    expect: false,
  },
  {
    name: 'IP地址中的重复数字',
    text: 'Server at 192.168.1.1 and 10.0.0.1',
    expect: false,
  },
  {
    name: '论文常见词：all',
    text: 'All of the above results show that the method works well.',
    expect: false,
  },
  {
    name: '表头缩写：No.',
    text: 'Table 1: No. of samples, CC (%), and accuracy.',
    expect: false,
  },
  {
    name: '正常论文段落（含数学符号但无乱码）',
    text: 'The transformer architecture uses self-attention mechanism. Given a sequence of tokens X ∈ R^(n×d), the attention function is defined as Attention(Q, K, V) = softmax(QK^T / √d_k)V.',
    expect: false,
  },
  {
    name: '真正的乱码混合正常文本',
    text: 'In this paper we study EE = UU (yy, zz) which represents the energy. See also Section III for details.',
    expect: true,
  },
]

// 运行测试
let passed = 0
let failed = 0

for (const tc of testCases) {
  const result = hasRepeatedCharPattern(tc.text)
  const ok = result === tc.expect

  if (ok) {
    passed++
    console.log(`✅ PASS: ${tc.name}`)
  } else {
    failed++
    console.log(`❌ FAIL: ${tc.name}`)
    console.log(`   Expected: ${tc.expect}, Got: ${result}`)
    console.log(`   Text: ${tc.text.slice(0, 80)}...`)
  }
}

console.log(`\n========== 测试结果 ==========`)
console.log(`Total: ${testCases.length}`)
console.log(`Passed: ${passed}`)
console.log(`Failed: ${failed}`)

if (failed > 0) {
  process.exit(1)
}
