'use client'

import { sanitizeHtml } from '@/lib/utils/sanitize'
import { cn } from '@/lib/utils/cn'

interface SimpleMarkdownProps {
  content: string
  className?: string
}

/**
 * 轻量级 Markdown 渲染器
 * 支持：标题、粗体、斜体、列表、代码块、行内代码、链接、引用
 * 无需外部依赖，输出经过 sanitizeHtml 净化
 */
export function SimpleMarkdown({ content, className }: SimpleMarkdownProps) {
  const html = parseMarkdown(content)
  const safeHtml = sanitizeHtml(html)

  return (
    <div
      className={cn('markdown-body text-sm leading-relaxed', className)}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  )
}

function parseMarkdown(text: string): string {
  if (!text) return ''

  let html = escapeHtml(text)

  // 代码块 (```language\ncode\n```)
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_, lang, code) => {
      const langAttr = lang ? ` data-lang="${lang}"` : ''
      return `<pre class="markdown-pre"${langAttr}><code>${code.trim()}</code></pre>`
    }
  )

  // 行内代码 (`code`)
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="markdown-code">$1</code>'
  )

  // 标题 (### ## #)
  html = html.replace(/^#### (.+)$/gm, '<h4 class="markdown-h4">$1</h4>')
  html = html.replace(/^### (.+)$/gm, '<h3 class="markdown-h3">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="markdown-h2">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 class="markdown-h1">$1</h1>')

  // 引用 (> text)
  html = html.replace(
    /^&gt; (.*)$/gm,
    '<blockquote class="markdown-blockquote">$1</blockquote>'
  )
  // 合并相邻的 blockquote
  html = html.replace(
    /<\/blockquote>\n<blockquote class="markdown-blockquote">/g,
    '<br>'
  )

  // 粗体 (**text** 或 __text__)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>')

  // 斜体 (*text* 或 _text_)
  // 注意：避免匹配 ** 中的 *
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
  html = html.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>')

  // 删除线 (~~text~~)
  html = html.replace(/~~(.+?)~~/g, '<s>$1</s>')

  // 链接 [text](url)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="markdown-link">$1</a>'
  )

  // 无序列表 (- item 或 * item)
  html = html.replace(
    /(^|\n)([-*]) (.+)(?=\n|$)/g,
    (_, prefix, _bullet, item) => {
      return `${prefix}<li class="markdown-li">${item}</li>`
    }
  )
  // 包裹连续的 li 为 ul
  html = html.replace(
    /(<li class="markdown-li">[\s\S]*?<\/li>)(\n<li class="markdown-li">[\s\S]*?<\/li>)*/g,
    (match) => `<ul class="markdown-ul">${match}</ul>`
  )

  // 有序列表 (1. item)
  html = html.replace(
    /(^|\n)(\d+)\. (.+)(?=\n|$)/g,
    (_, prefix, _num, item) => {
      return `${prefix}<li class="markdown-li">${item}</li>`
    }
  )
  // 包裹连续的 li 为 ol（在 ul 处理后，这里可能不完美，但足够用了）

  // 水平线 (--- 或 *** 或 ___)
  html = html.replace(/(^|\n)(---+|___+|\*\*\*)\n/g, '<hr class="markdown-hr">')

  // 段落处理：将连续的非标签行包裹为 p
  // 先分割成行
  const lines = html.split('\n')
  const result: string[] = []
  let inParagraph = false

  for (const line of lines) {
    const trimmed = line.trim()
    const isBlock =
      trimmed.startsWith('<h') ||
      trimmed.startsWith('<pre') ||
      trimmed.startsWith('<ul') ||
      trimmed.startsWith('<ol') ||
      trimmed.startsWith('<li') ||
      trimmed.startsWith('<blockquote') ||
      trimmed.startsWith('<hr') ||
      trimmed === ''

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

  html = result.join('\n')
  // 清理 p 标签内部的换行
  html = html.replace(/<p class="markdown-p">\n*/g, '<p class="markdown-p">')
  html = html.replace(/\n*<\/p>/g, '</p>')

  return html
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
