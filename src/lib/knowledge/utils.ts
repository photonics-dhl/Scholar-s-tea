/**
 * Knowledge Base UI Utilities
 *
 * Helpers for content preview, reading time, date formatting,
 * source visual mapping, and markdown stripping.
 */

// ============================================
// Markdown Stripper (lightweight)
// ============================================

export function stripMarkdown(md: string): string {
  return (
    md
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, ' ')
      // Remove inline code
      .replace(/`([^`]+)`/g, '$1')
      // Remove headers
      .replace(/^#{1,6}\s+/gm, ' ')
      // Remove bold/italic
      .replace(/(\*\*|__|\*|_)(.*?)\1/g, '$2')
      // Remove links
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove images
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      // Remove blockquotes
      .replace(/^>\s?/gm, ' ')
      // Remove horizontal rules
      .replace(/^---+$/gm, ' ')
      // Remove unordered list markers
      .replace(/^\s*[-*+]\s+/gm, ' ')
      // Remove ordered list markers
      .replace(/^\s*\d+\.\s+/gm, ' ')
      // Collapse multiple whitespace
      .replace(/\s+/g, ' ')
      .trim()
  )
}

/** Extract a plain-text preview from markdown content */
export function extractPreview(content: string, maxLength = 160): string {
  const plain = stripMarkdown(content)
  if (plain.length <= maxLength) return plain
  // Cut at last space before maxLength
  const truncated = plain.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  return lastSpace > 0 ? truncated.slice(0, lastSpace) + '...' : truncated + '...'
}

// ============================================
// Reading Time
// ============================================

export function estimateReadingTime(content: string): number {
  const wordCount = stripMarkdown(content).split(/\s+/).filter(Boolean).length
  // Average reading speed: 200 words/min for Chinese/English academic text
  return Math.max(1, Math.ceil(wordCount / 200))
}

// ============================================
// Date Helpers
// ============================================

export function isNew(createdAt: string | Date, days = 7): boolean {
  const date = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return date >= cutoff
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// ============================================
// Source Visual Mapping
// ============================================

export interface SourceVisual {
  icon: string
  color: string
  bg: string
  border: string
}

export const SOURCE_VISUALS: Record<string, SourceVisual> = {
  paper: {
    icon: 'FileText',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  webpage: {
    icon: 'Globe',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  arxiv: {
    icon: 'FileText',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  semantic_scholar: {
    icon: 'BookOpen',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
  },
  tavily: {
    icon: 'Search',
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
  },
  post: {
    icon: 'MessageSquare',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
  },
  news: {
    icon: 'Newspaper',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
  },
  wiki: {
    icon: 'BookOpen',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
  },
  manual: {
    icon: 'BookMarked',
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
  },
  publication: {
    icon: 'ScrollText',
    color: 'text-cyan-700',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
  },
}

export function getSourceVisual(source: string | null): SourceVisual {
  return SOURCE_VISUALS[source || ''] || SOURCE_VISUALS.manual
}
