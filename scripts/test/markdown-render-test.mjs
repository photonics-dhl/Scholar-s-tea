/**
 * SimpleMarkdown 渲染测试
 * 验证标题、Alert、表格、列表等解析是否正确
 */

// 复制 SimpleMarkdown.tsx 的核心解析逻辑（去 React 依赖）

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function parseMarkdown(text) {
  if (!text) return ''
  let html = escapeHtml(text)

  // 代码块占位符
  const codeBlocks = []
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_, lang, code) => {
      const idx = codeBlocks.length
      const langLabel = lang ? `<div class="markdown-pre-lang">${escapeHtml(lang)}</div>` : ''
      const blockHtml = `${langLabel}<pre class="markdown-pre"${lang ? ` data-lang="${lang}"` : ''}><code>${code.trim()}</code></pre>`
      const placeholder = `<<<CODE_BLOCK_${idx}>>>`
      codeBlocks.push({ placeholder, html: blockHtml })
      return placeholder
    }
  )

  // details/summary 占位符
  const detailsBlocks = []
  html = html.replace(
    /<details\b[^>]*>([\s\S]*?)<\/details>/gi,
    (match) => {
      const idx = detailsBlocks.length
      const placeholder = `<<<DETAILS_BLOCK_${idx}>>>`
      const cleaned = match
        .replace(/<details\b([^>]*)>/i, (_m, attrs) => {
          const hasOpen = /\sopen\b/i.test(attrs)
          return `<details class="markdown-details"${hasOpen ? ' open' : ''}>`
        })
        .replace(/<summary\b[^>]*>/i, '<summary class="markdown-summary">')
      detailsBlocks.push({ placeholder, html: cleaned })
      return placeholder
    }
  )

  // 图片
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (_, alt, url) => `<img class="markdown-img" src="${url.replace(/"/g, '&quot;')}" alt="${alt.replace(/"/g, '&quot;')}" loading="lazy" />`
  )

  // 行内代码
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="markdown-code">$1</code>'
  )

  // 标题 h6→h1
  html = html.replace(/^###### (.+)$/gm, '<h6 class="markdown-h6">$1</h6>')
  html = html.replace(/^##### (.+)$/gm, '<h5 class="markdown-h5">$1</h5>')
  html = html.replace(/^#### (.+)$/gm, '<h4 class="markdown-h4">$1</h4>')
  html = html.replace(/^### (.+)$/gm, '<h3 class="markdown-h3">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="markdown-h2">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 class="markdown-h1">$1</h1>')

  // 引用块（简化版，只检测 alert）
  const lines = html.split('\n')
  const result = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.trim().startsWith('&gt;')) {
      const quoteLines = []
      while (i < lines.length && lines[i].trim().startsWith('&gt;')) {
        quoteLines.push(lines[i].trim().replace(/^&gt;\s?/, ''))
        i++
      }
      const content = quoteLines.join('\n')
      // 检测 GFM Alert
      const gfmMatch = content.match(/^\[!([A-Z]+)\]\s*(.*)/)
      if (gfmMatch) {
        const typeMap = { NOTE: 'info', TIP: 'info', IMPORTANT: 'success', WARNING: 'warning', CAUTION: 'danger' }
        const type = typeMap[gfmMatch[1]] || ''
        result.push(`<blockquote class="markdown-blockquote markdown-alert-${type}"><span class="markdown-alert-icon">${gfmMatch[1]}</span>${gfmMatch[2]}</blockquote>`)
      } else {
        result.push(`<blockquote class="markdown-blockquote">${content}</blockquote>`)
      }
    } else {
      result.push(line)
      i++
    }
  }
  html = result.join('\n')

  // 粗体
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // 斜体
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')

  // 链接
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="markdown-link">$1</a>'
  )

  // 无序列表
  html = html.replace(
    /(^|\n)([-*]) (.+)(?=\n|$)/g,
    (_, prefix, _bullet, item) => `${prefix}<li class="markdown-li">${item}</li>`
  )
  html = html.replace(
    /(<li class="markdown-li">[\s\S]*?<\/li>)(\n<li class="markdown-li">[\s\S]*?<\/li>)*/g,
    (match) => `<ul class="markdown-ul">${match}</ul>`
  )

  // 水平线
  html = html.replace(/(^|\n)(---+|___+|\*\*\*)\n/g, '<hr class="markdown-hr">')

  // 恢复代码块
  html = html.replace(
    /<<<CODE_BLOCK_(\d+)>>>/g,
    (_, idx) => codeBlocks[parseInt(idx)]?.html || ''
  )

  // 恢复 details
  html = html.replace(
    /<<<DETAILS_BLOCK_(\d+)>>>/g,
    (_, idx) => detailsBlocks[parseInt(idx)]?.html || ''
  )

  // 段落
  const plines = html.split('\n')
  const presult = []
  let inParagraph = false
  for (const line of plines) {
    const trimmed = line.trim()
    const isBlock =
      trimmed.startsWith('<h') ||
      trimmed.startsWith('<pre') ||
      trimmed.startsWith('<ul') ||
      trimmed.startsWith('<blockquote') ||
      trimmed.startsWith('<hr') ||
      trimmed.startsWith('<details') ||
      trimmed === ''

    if (isBlock) {
      if (inParagraph) { presult.push('</p>'); inParagraph = false }
      if (trimmed !== '') presult.push(line)
    } else {
      if (!inParagraph) { presult.push('<p class="markdown-p">'); inParagraph = true }
      presult.push(line)
    }
  }
  if (inParagraph) presult.push('</p>')
  html = presult.join('\n')
  html = html.replace(/<p class="markdown-p">\n*/g, '<p class="markdown-p">')
  html = html.replace(/\n*<\/p>/g, '</p>')

  return html
}

// ========== 测试用例 ==========

const tests = []

function test(name, input, checkFn) {
  const html = parseMarkdown(input)
  const pass = checkFn(html)
  tests.push({ name, pass, html: html.slice(0, 200).replace(/\n/g, '\\n') })
}

// 1. 标题测试
test('h1 标题', '# Hello', h => h.includes('<h1 class="markdown-h1">Hello</h1>'))
test('h2 标题', '## Hello', h => h.includes('<h2 class="markdown-h2">Hello</h2>'))
test('h3 标题', '### Hello', h => h.includes('<h3 class="markdown-h3">Hello</h3>'))
test('h4 标题', '#### Hello', h => h.includes('<h4 class="markdown-h4">Hello</h4>'))
test('h5 标题（修复目标）', '##### Hello', h => h.includes('<h5 class="markdown-h5">Hello</h5>'))
test('h6 标题（修复目标）', '###### Hello', h => h.includes('<h6 class="markdown-h6">Hello</h6>'))

// 2. GFM Alert 测试
test('GFM [!NOTE]', '> [!NOTE] This is a note', h => h.includes('markdown-alert-info') && h.includes('NOTE'))
test('GFM [!WARNING]', '> [!WARNING] Be careful', h => h.includes('markdown-alert-warning') && h.includes('WARNING'))
test('GFM [!CAUTION]', '> [!CAUTION] Critical', h => h.includes('markdown-alert-danger') && h.includes('CAUTION'))
test('GFM [!IMPORTANT]', '> [!IMPORTANT] Vital', h => h.includes('markdown-alert-success') && h.includes('IMPORTANT'))

// 3. 传统标记测试
test('传统 [关键]', '> [关键] 这是关键', h => h.includes('blockquote'))

// 4. 代码块
test('代码块', '```ts\nconst x = 1\n```', h => h.includes('<pre') && h.includes('const x = 1'))

// 5. 行内代码
test('行内代码', 'Use `map()` function', h => h.includes('<code class="markdown-code">map()</code>'))

// 6. 粗体
test('粗体', '**bold**', h => h.includes('<strong>bold</strong>'))

// 7. 斜体
test('斜体', '*italic*', h => h.includes('<em>italic</em>'))

// 8. 链接
test('链接', '[Google](https://google.com)', h => h.includes('<a href="https://google.com"'))

// 9. 无序列表
test('无序列表', '- Item 1\n- Item 2', h => h.includes('<ul') && h.includes('<li'))

// 10. 用户报告的案例
test('用户案例：h5 标题', '##### 3.3.3 分子生成与优化（Molecular Generation）', h =>
  !h.includes('#####') && h.includes('<h5') && h.includes('分子生成与优化')
)

// 输出结果
console.log('=== SimpleMarkdown 渲染测试 ===\n')
let passed = 0
let failed = 0
for (const t of tests) {
  if (t.pass) {
    passed++
    console.log(`  ✅ ${t.name}`)
  } else {
    failed++
    console.log(`  ❌ ${t.name}`)
    console.log(`     HTML: ${t.html}`)
  }
}
console.log(`\n总计: ${passed}/${tests.length} 通过, ${failed} 失败`)
process.exit(failed > 0 ? 1 : 0)
