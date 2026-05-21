/**
 * HTML 安全净化工具
 * 用于将富文本内容安全地渲染到页面中
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'div', 'span', 'hr',
  'details', 'summary',
])

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'target', 'rel']),
  img: new Set(['src', 'alt', 'title', 'width', 'height']),
  '*': new Set(['class', 'id']),
}

const VOID_TAGS = new Set([
  'br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed',
  'param', 'source', 'track', 'wbr',
])

/**
 * 简单的 HTML 净化函数
 * 移除不允许的标签和属性，防止 XSS
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''

  // Remove script tags and their contents completely
  html = html.replace(/<script[\s\S]*?>\s*[\s\S]*?<\/script>/gi, '')
  html = html.replace(/<style[\s\S]*?>\s*[\s\S]*?<\/style>/gi, '')
  html = html.replace(/<iframe[\s\S]*?>\s*[\s\S]*?<\/iframe>/gi, '')
  html = html.replace(/<object[\s\S]*?>\s*[\s\S]*?<\/object>/gi, '')
  html = html.replace(/<embed[\s\S]*?>/gi, '')

  // Clean attributes on allowed tags
  html = html.replace(/<([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (match, tagName, attrs) => {
    const lowerTag = tagName.toLowerCase()

    if (!ALLOWED_TAGS.has(lowerTag)) {
      // For disallowed tags, just return their text content (will be handled by browser)
      return VOID_TAGS.has(lowerTag) ? '' : ''
    }

    // Clean attributes
    const cleanedAttrs = cleanAttributes(lowerTag, attrs)
    return `<${lowerTag}${cleanedAttrs}>`
  })

  // Remove closing tags for disallowed elements
  html = html.replace(/<\/[a-zA-Z][a-zA-Z0-9]*\s*>/g, (match) => {
    const tagName = match.replace(/[<\/>\s]/g, '').toLowerCase()
    return ALLOWED_TAGS.has(tagName) ? match : ''
  })

  // Sanitize href attributes (prevent javascript: protocol)
  html = html.replace(/href\s*=\s*["']([^"']*)["']/gi, (match, url) => {
    const trimmed = url.trim().toLowerCase()
    if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('vbscript:')) {
      return 'href="#"'
    }
    return match
  })

  // Sanitize src attributes
  html = html.replace(/src\s*=\s*["']([^"']*)["']/gi, (match, url) => {
    const trimmed = url.trim().toLowerCase()
    if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:')) {
      return 'src=""'
    }
    return match
  })

  return html
}

function cleanAttributes(tagName: string, attrs: string): string {
  const allowed = new Set([
    ...Array.from(ALLOWED_ATTRS[tagName] || []),
    ...Array.from(ALLOWED_ATTRS['*'] || []),
  ])

  const cleaned: string[] = []
  const attrRegex = /\s*([a-zA-Z_:][a-zA-Z0-9_:\-.]*)\s*=\s*(["'])(.*?)\2/g
  let match

  while ((match = attrRegex.exec(attrs)) !== null) {
    const attrName = match[1].toLowerCase()
    const attrValue = match[3]

    if (allowed.has(attrName)) {
      cleaned.push(` ${attrName}="${escapeHtml(attrValue)}"`)
    }
  }

  return cleaned.join('')
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * 将纯文本中的 URL 转换为可点击的链接
 */
export function linkifyText(text: string): string {
  const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g
  return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-tea-primary hover:underline">$1</a>')
}
