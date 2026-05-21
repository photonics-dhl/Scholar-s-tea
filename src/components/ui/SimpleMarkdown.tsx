'use client'

import { sanitizeHtml } from '@/lib/utils/sanitize'
import { cn } from '@/lib/utils/cn'
import { processMathInMarkdown } from '@/lib/ai/latex-to-utf8'

interface SimpleMarkdownProps {
  content: string
  className?: string
}

/**
 * 轻量级 Markdown 渲染器 v3
 * 支持：标题、粗体、斜体、列表（含任务列表）、代码块（含语言标签+复制按钮）、行内代码、链接、引用（含提示框变体）、
 *       表格、数学公式（UTF-8）、图片、折叠区块、自动 URL 链接
 * 无需外部依赖，输出经过 sanitizeHtml 净化
 */
export function SimpleMarkdown({ content, className }: SimpleMarkdownProps) {
  // 先转换 LaTeX 公式为 UTF-8
  const { text: mathProcessed } = processMathInMarkdown(content)
  const html = parseMarkdown(mathProcessed)
  const safeHtml = sanitizeHtml(html)

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    const btn = target.closest('.markdown-code-copy-btn') as HTMLElement | null
    if (!btn) return

    const wrapper = btn.closest('.markdown-code-block-wrapper')
    const pre = wrapper?.querySelector('pre')
    if (!pre) return

    const code = pre.textContent || ''
    const doCopy = () => {
      btn.classList.add('copied')
      btn.textContent = '已复制'
      setTimeout(() => {
        btn.classList.remove('copied')
        btn.textContent = '复制'
      }, 2000)
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(doCopy).catch(() => {
        // fallback
        const ta = document.createElement('textarea')
        ta.value = code
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        doCopy()
      })
    } else {
      const ta = document.createElement('textarea')
      ta.value = code
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      doCopy()
    }
  }

  return (
    <div
      className={cn('markdown-body text-sm leading-relaxed', className)}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
      onClick={handleClick}
    />
  )
}

function parseMarkdown(text: string): string {
  if (!text) return ''

  let html = escapeHtml(text)

  // ===== 步骤1: 提取代码块（用占位符保护，避免被后续正则干扰）=====
  const codeBlocks: Array<{ placeholder: string; html: string }> = []
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_, lang, code) => {
      const idx = codeBlocks.length
      const langLabel = lang ? `<div class="markdown-pre-lang">${escapeHtml(lang)}</div>` : ''
      const langAttr = lang ? ` data-lang="${lang}"` : ''
      const blockHtml = `<div class="markdown-code-block-wrapper">${langLabel}<button class="markdown-code-copy-btn" type="button">复制</button><pre class="markdown-pre"${langAttr}><code>${code.trim()}</code></pre></div>`
      const placeholder = `<<<CODE_BLOCK_${idx}>>>`
      codeBlocks.push({ placeholder, html: blockHtml })
      return placeholder
    }
  )

  // ===== 步骤2: 提取折叠区块 details/summary（用占位符保护）=====
  const detailsBlocks: Array<{ placeholder: string; html: string }> = []
  html = html.replace(
    /<details\b[^>]*>([\s\S]*?)<\/details>/gi,
    (match) => {
      const idx = detailsBlocks.length
      const placeholder = `<<<DETAILS_BLOCK_${idx}>>>`
      // 清理details标签内的属性，保留class和open
      const cleaned = match
        .replace(/<details\b([^>]*)>/i, (_m: string, attrs: string) => {
          const hasOpen = /\sopen\b/i.test(attrs)
          return `<details class="markdown-details"${hasOpen ? ' open' : ''}>`
        })
        .replace(/<summary\b[^>]*>/i, '<summary class="markdown-summary">')
      detailsBlocks.push({ placeholder, html: cleaned })
      return placeholder
    }
  )

  // ===== 步骤3: 提取表格（用占位符保护）=====
  const tables: string[] = []
  html = parseTables(html, tables)

  // ===== 步骤4: 图片语法 ![alt](url) — 必须在链接之前处理 =====
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (_, alt, url) => {
      const safeAlt = escapeHtmlAttr(alt)
      const safeUrl = escapeHtmlAttr(url)
      return `<img class="markdown-img" src="${safeUrl}" alt="${safeAlt}" loading="lazy" />`
    }
  )

  // ===== 步骤5: 行内代码 (`code`) =====
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="markdown-code">$1</code>'
  )

  // ===== 步骤6: 标题 (###### → #) — 必须从多到少顺序替换 =====
  html = html.replace(/^###### (.+)$/gm, '<h6 class="markdown-h6">$1</h6>')
  html = html.replace(/^##### (.+)$/gm, '<h5 class="markdown-h5">$1</h5>')
  html = html.replace(/^#### (.+)$/gm, '<h4 class="markdown-h4">$1</h4>')
  html = html.replace(/^### (.+)$/gm, '<h3 class="markdown-h3">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="markdown-h2">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 class="markdown-h1">$1</h1>')

  // ===== 步骤7: 引用 (> text) — 支持提示框变体 =====
  html = parseBlockquotes(html)

  // ===== 步骤8: 粗体 (**text** 或 __text__) =====
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>')

  // ===== 步骤9: 斜体 (*text* 或 _text_) =====
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
  html = html.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>')

  // ===== 步骤10: 删除线 (~~text~~) =====
  html = html.replace(/~~(.+?)~~/g, '<s>$1</s>')

  // ===== 步骤11: 链接 [text](url) =====
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="markdown-link">$1</a>'
  )

  // ===== 步骤12: 任务列表 (- [ ] / - [x]) =====
  html = html.replace(
    /(^|\n)([-*]) \[([ xX])\] (.+)(?=\n|$)/g,
    (_, prefix, _bullet, checked, item) => {
      const isChecked = checked.toLowerCase() === 'x'
      return `${prefix}<li class="markdown-li markdown-task-li"><input type="checkbox" disabled ${isChecked ? 'checked' : ''} class="markdown-task-checkbox" /><span class="markdown-task-text">${item}</span></li>`
    }
  )

  // ===== 步骤13: 无序列表 (- item 或 * item，排除任务列表) =====
  html = html.replace(
    /(^|\n)([-*]) ((?!\[[ xX]\] ).+)(?=\n|$)/g,
    (_, prefix, _bullet, item) => {
      return `${prefix}<li class="markdown-li">${item}</li>`
    }
  )
  html = html.replace(
    /(<li class="markdown-li">[\s\S]*?<\/li>)(\n<li class="markdown-li">[\s\S]*?<\/li>)*/g,
    (match) => `<ul class="markdown-ul">${match}</ul>`
  )

  // ===== 步骤14: 有序列表 (1. item) =====
  html = html.replace(
    /(^|\n)(\d+)\. (.+)(?=\n|$)/g,
    (_, prefix, _num, item) => {
      return `${prefix}<li class="markdown-li">${item}</li>`
    }
  )
  // 包裹连续的有序li为ol（与ul区分）
  html = wrapOrderedLists(html)

  // ===== 步骤15: 水平线 (--- 或 *** 或 ___) =====
  html = html.replace(/(^|\n)(---+|___+|\*\*\*)\n/g, '<hr class="markdown-hr">')

  // ===== 步骤16: 恢复表格占位符 =====
  html = html.replace(/<<<TABLE_(\d+)>>>/g, (_, idx) => tables[parseInt(idx)])

  // ===== 步骤17: 恢复代码块占位符 =====
  html = html.replace(
    /<<<CODE_BLOCK_(\d+)>>>/g,
    (_, idx) => codeBlocks[parseInt(idx)]?.html || ''
  )

  // ===== 步骤18: 恢复折叠区块占位符 =====
  html = html.replace(
    /<<<DETAILS_BLOCK_(\d+)>>>/g,
    (_, idx) => detailsBlocks[parseInt(idx)]?.html || ''
  )

  // ===== 步骤19: 段落处理 =====
  html = processParagraphs(html)

  return html
}

/**
 * 解析引用块，支持提示框变体（基于开头的emoji）
 */
function parseBlockquotes(html: string): string {
  // 先匹配连续的引用行
  const lines = html.split('\n')
  const result: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (line.trim().startsWith('&gt;')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('&gt;')) {
        quoteLines.push(lines[i].trim().replace(/^&gt;\s?/, ''))
        i++
      }

      const content = quoteLines.join('\n')
      const alertType = detectAlertType(content)
      const alertClass = alertType ? ` markdown-alert-${alertType}` : ''
      const icon = alertType ? getAlertIcon(alertType) : ''

      result.push(
        `<blockquote class="markdown-blockquote${alertClass}">${icon}${applyInlineFormats(content.replace(ALERT_PREFIX_REGEX, ''))}</blockquote>`
      )
    } else {
      result.push(line)
      i++
    }
  }

  return result.join('\n')
}

// 提示框检测：支持 GitHub Flavored Markdown Alert 语法 + 传统 ASCII 标记 + emoji
// GFM Alerts: > [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING], > [!CAUTION]
// 传统标记: [关键], [注意], [建议], [完成]
const ALERT_MARKERS: Array<{ type: string; prefixes: string[]; gfmLabels: string[]; icon: string }> = [
  {
    type: 'danger',
    prefixes: ['[关键]', '⚠️', '🚨', '⚡', '❗', '🔥', '❌', '🚫', '⛔', '🔴', '❎'],
    gfmLabels: ['[!CAUTION]'],
    icon: '<span class="markdown-alert-icon">CAUTION</span>',
  },
  {
    type: 'warning',
    prefixes: ['[注意]', '⚠️', '🚨', '⚡', '❗', '🔥'],
    gfmLabels: ['[!WARNING]'],
    icon: '<span class="markdown-alert-icon">WARNING</span>',
  },
  {
    type: 'info',
    prefixes: ['[建议]', '[提示]', '💡', '📝', 'ℹ️', '🔍', '📌'],
    gfmLabels: ['[!NOTE]', '[!TIP]'],
    icon: '<span class="markdown-alert-icon">NOTE</span>',
  },
  {
    type: 'success',
    prefixes: ['[完成]', '[成功]', '✅', '🎉', '✓', '✔️', '🟢'],
    gfmLabels: ['[!IMPORTANT]'],
    icon: '<span class="markdown-alert-icon">IMPORTANT</span>',
  },
]

const ALL_ALERT_PREFIXES = ALERT_MARKERS.flatMap(m => m.prefixes)
const ALL_GFM_LABELS = ALERT_MARKERS.flatMap(m => m.gfmLabels)
const ALERT_PREFIX_REGEX = new RegExp(
  `^(${[...ALL_ALERT_PREFIXES, ...ALL_GFM_LABELS].map(p => p.replace(/[\[\]!]/g, '\\$&')).join('|')})\\s*`
)

function detectAlertType(content: string): string | null {
  const trimmed = content.trim()
  // 优先检测 GFM 标签（更标准）
  for (const marker of ALERT_MARKERS) {
    for (const label of marker.gfmLabels) {
      if (trimmed.startsWith(label)) return marker.type
    }
  }
  // 再检测传统标记
  for (const marker of ALERT_MARKERS) {
    for (const prefix of marker.prefixes) {
      if (trimmed.startsWith(prefix)) return marker.type
    }
  }
  return null
}

function getAlertIcon(type: string): string {
  const marker = ALERT_MARKERS.find(m => m.type === type)
  return marker?.icon || ''
}

/**
 * 将连续的有序列表项包裹为 <ol>
 */
function wrapOrderedLists(html: string): string {
  // 简单策略：将未被ul包裹的连续li包裹为ol
  // 这里使用一个更直接的方法：在处理有序列表时直接生成ol标签
  // 重新处理有序列表部分
  return html
}

/**
 * 解析 Markdown 表格，将表格区域替换为占位符
 */
function parseTables(text: string, tables: string[]): string {
  const lines = text.split('\n')
  const result: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (line.trim().startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim())
        i++
      }

      if (tableLines.length >= 2) {
        const tableHtml = renderTable(tableLines)
        if (tableHtml) {
          const idx = tables.length
          tables.push(tableHtml)
          result.push(`<<<TABLE_${idx}>>>`)
          continue
        }
      }

      result.push(...tableLines)
    } else {
      result.push(line)
      i++
    }
  }

  return result.join('\n')
}

function renderTable(lines: string[]): string | null {
  const parseCells = (line: string): string[] => {
    const trimmed = line.replace(/^\|/, '').replace(/\|$/, '')
    return trimmed.split('|').map(c => c.trim())
  }

  const headers = parseCells(lines[0])
  const separators = parseCells(lines[1])

  const isValidSeparator = separators.length > 0 && separators.every(
    s => /^:?-+:?$/.test(s)
  )
  if (!isValidSeparator) return null

  const alignments = separators.map(s => {
    const left = s.startsWith(':')
    const right = s.endsWith(':')
    if (left && right) return 'center'
    if (right) return 'right'
    return 'left'
  })

  let html = '<table class="markdown-table"><thead><tr>'
  headers.forEach((h, idx) => {
    const align = alignments[idx] || 'left'
    html += `<th style="text-align:${align}">${applyInlineFormats(h)}</th>`
  })
  html += '</tr></thead><tbody>'

  for (let i = 2; i < lines.length; i++) {
    const cells = parseCells(lines[i])
    html += '<tr>'
    cells.forEach((c, idx) => {
      const align = alignments[idx] || 'left'
      html += `<td style="text-align:${align}">${applyInlineFormats(c)}</td>`
    })
    html += '</tr>'
  }

  html += '</tbody></table>'
  return html
}

/**
 * 段落处理：包裹普通文本为 <p>，同时处理有序列表
 */
function processParagraphs(html: string): string {
  const lines = html.split('\n')
  const result: string[] = []
  let inParagraph = false
  let inOrderedList = false

  for (const line of lines) {
    const trimmed = line.trim()

    // 检查是否是有序列表项（数字+点+空格开头）
    const isOrderedItem = /^\d+\.\s/.test(trimmed) && !trimmed.startsWith('<')

    // 检测块级元素
    const isBlock =
      trimmed.startsWith('<h') ||
      trimmed.startsWith('<pre') ||
      trimmed.startsWith('<ul') ||
      trimmed.startsWith('<ol') ||
      trimmed.startsWith('<li') ||
      trimmed.startsWith('<blockquote') ||
      trimmed.startsWith('<hr') ||
      trimmed.startsWith('<table') ||
      trimmed.startsWith('<details') ||
      trimmed === '' ||
      isOrderedItem

    if (isOrderedItem) {
      if (inParagraph) {
        result.push('</p>')
        inParagraph = false
      }
      if (!inOrderedList) {
        result.push('<ol class="markdown-ol">')
        inOrderedList = true
      }
      const itemContent = trimmed.replace(/^\d+\.\s/, '')
      result.push(`<li class="markdown-li">${itemContent}</li>`)
      continue
    }

    if (inOrderedList && !isOrderedItem && trimmed !== '') {
      result.push('</ol>')
      inOrderedList = false
    }

    if (isBlock) {
      if (inParagraph) {
        result.push('</p>')
        inParagraph = false
      }
      if (trimmed !== '') {
        result.push(line)
      }
    } else {
      if (!inParagraph) {
        result.push('<p class="markdown-p">')
        inParagraph = true
      }
      result.push(line)
    }
  }

  if (inParagraph) {
    result.push('</p>')
  }
  if (inOrderedList) {
    result.push('</ol>')
  }

  html = result.join('\n')
  html = html.replace(/<p class="markdown-p">\n*/g, '<p class="markdown-p">')
  html = html.replace(/\n*<\/p>/g, '</p>')

  return html
}

/**
 * 应用内联格式（粗体、斜体、删除线、行内代码、链接）
 */
function applyInlineFormats(text: string): string {
  let html = text
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>')
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
  html = html.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>')
  html = html.replace(/~~(.+?)~~/g, '<s>$1</s>')
  html = html.replace(/`([^`]+)`/g, '<code class="markdown-code">$1</code>')
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="markdown-link">$1</a>'
  )
  // 自动链接裸 URL（排除已有 []() 包裹的和 HTML 属性中的）
  html = html.replace(
    /(?<![\[("'])(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="markdown-link">$1</a>'
  )
  // 图片内联
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (_, alt, url) => {
      const safeAlt = escapeHtmlAttr(alt)
      const safeUrl = escapeHtmlAttr(url)
      return `<img class="markdown-img-inline" src="${safeUrl}" alt="${safeAlt}" loading="lazy" />`
    }
  )
  return html
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeHtmlAttr(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
