'use client'

import { useState, useEffect, useCallback } from 'react'
import { List, X } from 'lucide-react'

interface TocItem {
  id: string
  text: string
  level: number
}

function extractHeadings(content: string): TocItem[] {
  const lines = content.split('\n')
  const items: TocItem[] = []
  const seen = new Set<string>()

  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)$/)
    if (!match) continue

    const level = match[1].length
    const rawText = match[2].trim()
    // Generate slug-like ID from text
    let id = rawText
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 60)

    // Deduplicate IDs
    let uniqueId = id
    let counter = 1
    while (seen.has(uniqueId)) {
      uniqueId = `${id}-${counter}`
      counter++
    }
    seen.add(uniqueId)

    items.push({ id: uniqueId, text: rawText, level })
  }

  return items
}

export function TableOfContents({ content }: { content: string }) {
  const [items, setItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setItems(extractHeadings(content))
  }, [content])

  // Inject IDs into rendered headings for anchor scrolling
  useEffect(() => {
    if (items.length === 0) return

    const contentEl = document.querySelector('.prose')
    if (!contentEl) return

    const headings = contentEl.querySelectorAll('h2, h3')
    headings.forEach((heading, i) => {
      if (items[i]) {
        heading.id = items[i].id
      }
    })
  }, [items])

  // IntersectionObserver for active heading tracking
  useEffect(() => {
    if (items.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the heading that is currently most visible near top
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      {
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0,
      }
    )

    const contentEl = document.querySelector('.prose')
    if (contentEl) {
      const headings = contentEl.querySelectorAll('h2, h3')
      headings.forEach((h) => observer.observe(h))
    }

    return () => observer.disconnect()
  }, [items])

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100
      window.scrollTo({ top: y, behavior: 'smooth' })
      setMobileOpen(false)
    }
  }, [])

  if (items.length < 3) return null

  return (
    <>
      {/* Desktop: fixed right sidebar */}
      <aside className="hidden xl:block w-64 shrink-0">
        <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-foreground">
            <List className="h-4 w-4 text-muted-foreground" />
            Contents
          </div>
          <nav className="border-l border-border/60 ml-1">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`block w-full text-left text-xs leading-relaxed py-1 pr-2 transition-colors hover:text-journal-primary ${
                  item.level === 3 ? 'pl-5' : 'pl-3'
                } ${
                  activeId === item.id
                    ? 'text-journal-primary font-medium border-l-2 border-journal-primary -ml-[2px] bg-journal-primary/[0.04]'
                    : 'text-muted-foreground border-l-2 border-transparent'
                }`}
              >
                {item.text}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Mobile: floating button + drawer */}
      <div className="xl:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed bottom-6 right-6 z-40 h-10 w-10 rounded-full bg-journal-primary text-white shadow-lg flex items-center justify-center hover:bg-journal-primary/90 transition-colors"
          aria-label="Open table of contents"
        >
          <List className="h-5 w-5" />
        </button>

        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col">
              <div className="flex items-center justify-between px-5 py-3 border-b">
                <span className="text-sm font-medium">Contents</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="overflow-y-auto p-4 space-y-1">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollTo(item.id)}
                    className={`block w-full text-left text-sm py-2 px-3 rounded-lg transition-colors ${
                      item.level === 3 ? 'pl-6' : 'pl-3'
                    } ${
                      activeId === item.id
                        ? 'text-journal-primary font-medium bg-journal-primary/[0.06]'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {item.text}
                  </button>
                ))}
              </nav>
            </div>
          </>
        )}
      </div>
    </>
  )
}
