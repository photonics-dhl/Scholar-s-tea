'use client'

import { useState } from 'react'
import {
  FileText,
  Globe,
  BookOpen,
  Search,
  ExternalLink,
  Code,
  Users,
  Library,
  Languages,
  Newspaper,
  Share2,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Wrench,
} from 'lucide-react'

interface QuickLink {
  name: string
  url: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
}

interface LinkCategory {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  links: QuickLink[]
}

const LINK_CATEGORIES: LinkCategory[] = [
  {
    id: 'search',
    label: 'Literature Search',
    icon: Search,
    links: [
      {
        name: 'arXiv',
        url: 'https://arxiv.org',
        description: 'Preprint server for physics, CS, math',
        icon: FileText,
        color: 'text-amber-700',
        bgColor: 'bg-amber-50',
      },
      {
        name: "Anna's Archive",
        url: 'https://annas-archive.se',
        description: 'Open-source academic mirror & books',
        icon: Library,
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-50',
      },
      {
        name: 'Google Scholar',
        url: 'https://scholar.google.com',
        description: 'Academic search engine',
        icon: GraduationCap,
        color: 'text-blue-700',
        bgColor: 'bg-blue-50',
      },
      {
        name: 'Semantic Scholar',
        url: 'https://www.semanticscholar.org',
        description: 'AI-powered literature search',
        icon: BookOpen,
        color: 'text-indigo-700',
        bgColor: 'bg-indigo-50',
      },
      {
        name: 'Web of Science',
        url: 'https://www.webofscience.com',
        description: 'Authoritative citation index',
        icon: Globe,
        color: 'text-sky-700',
        bgColor: 'bg-sky-50',
      },
    ],
  },
  {
    id: 'tools',
    label: 'Research Tools',
    icon: Wrench,
    links: [
      {
        name: 'Connected Papers',
        url: 'https://www.connectedpapers.com',
        description: 'Visual paper relation graphs',
        icon: Share2,
        color: 'text-violet-700',
        bgColor: 'bg-violet-50',
      },
      {
        name: 'Overleaf',
        url: 'https://www.overleaf.com',
        description: 'Online LaTeX editor',
        icon: Code,
        color: 'text-teal-700',
        bgColor: 'bg-teal-50',
      },
      {
        name: 'Zotero Bib',
        url: 'https://zbib.org',
        description: 'Quick citation formatter',
        icon: BookOpen,
        color: 'text-rose-700',
        bgColor: 'bg-rose-50',
      },
      {
        name: 'ResearchGate',
        url: 'https://www.researchgate.net',
        description: 'Academic social network',
        icon: Users,
        color: 'text-cyan-700',
        bgColor: 'bg-cyan-50',
      },
    ],
  },
  {
    id: 'utility',
    label: 'Utilities',
    icon: Wrench,
    links: [
      {
        name: 'Sci-Hub',
        url: 'https://sci-hub.se',
        description: 'Free access to paywalled papers',
        icon: Library,
        color: 'text-red-700',
        bgColor: 'bg-red-50',
      },
      {
        name: 'DeepL Translate',
        url: 'https://www.deepl.com/translator',
        description: 'Academic-grade translation',
        icon: Languages,
        color: 'text-blue-700',
        bgColor: 'bg-blue-50',
      },
      {
        name: 'LetPub Journal Query',
        url: 'http://www.letpub.com.cn/index.php?page=journalapp',
        description: 'CAS journal分区 & IF查询',
        icon: Newspaper,
        color: 'text-orange-700',
        bgColor: 'bg-orange-50',
      },
      {
        name: 'GitHub',
        url: 'https://github.com',
        description: 'Code & open-source projects',
        icon: Code,
        color: 'text-slate-700',
        bgColor: 'bg-slate-50',
      },
    ],
  },
]

export function QuickLinksPanel() {
  const [expandedCats, setExpandedCats] = useState<Set<string>>(
    new Set(['search', 'tools'])
  )

  const toggleCategory = (id: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
        Quick Links
      </h3>
      {LINK_CATEGORIES.map((cat) => {
        const isExpanded = expandedCats.has(cat.id)
        const CatIcon = cat.icon
        return (
          <div key={cat.id} className="rounded-lg border border-journal-border/30 overflow-hidden">
            <button
              onClick={() => toggleCategory(cat.id)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/40 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <CatIcon className="h-3.5 w-3.5 text-muted-foreground" />
                {cat.label}
              </span>
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
            {isExpanded && (
              <div className="px-2 pb-2 space-y-0.5">
                {cat.links.map((link) => {
                  const LinkIcon = link.icon
                  return (
                    <a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 px-2 py-1.5 rounded-md text-xs hover:bg-muted/60 transition-colors group"
                      title={link.description}
                    >
                      <div
                        className={`flex-shrink-0 w-6 h-6 rounded-md ${link.bgColor} flex items-center justify-center mt-0.5`}
                      >
                        <LinkIcon className={`h-3 w-3 ${link.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-foreground truncate">
                            {link.name}
                          </span>
                          <ExternalLink className="h-2.5 w-2.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">
                          {link.description}
                        </p>
                      </div>
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
