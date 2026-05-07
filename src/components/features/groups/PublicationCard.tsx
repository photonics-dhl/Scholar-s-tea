'use client'

import { FileText, Quote, Calendar, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'

interface Publication {
  id: string
  title: string
  authors: string[]
  journal?: string
  year?: number
  citationCount?: number
  doi?: string
  abstract?: string
}

interface PublicationCardProps {
  publication: Publication
  className?: string
}

/**
 * 论文卡片组件
 * 展示论文标题、作者、期刊、引用等信息
 */
export function PublicationCard({ publication, className }: PublicationCardProps) {
  return (
    <Card
      className={cn(
        'group transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-journal-border/40 hover:border-journal-primary/30',
        className
      )}
    >
      <CardContent className="p-4">
        {/* Title */}
        <h3 className="font-medium text-sm line-clamp-2 mb-2 group-hover:text-journal-primary transition-colors">
          {publication.title}
        </h3>

        {/* Authors */}
        <div className="flex items-center gap-1.5 mb-2">
          <Users className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <p className="text-xs text-muted-foreground line-clamp-1">
            {publication.authors.join(', ')}
          </p>
        </div>

        {/* Journal + Year */}
        <div className="flex items-center gap-3 mb-2">
          {publication.journal && (
            <Badge variant="outline" className="text-[10px] h-5 border-journal-primary/20 text-journal-primary">
              <FileText className="h-2.5 w-2.5 mr-1" />
              {publication.journal}
            </Badge>
          )}
          {publication.year && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Calendar className="h-2.5 w-2.5" />
              {publication.year}
            </span>
          )}
        </div>

        {/* Abstract preview */}
        {publication.abstract && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {publication.abstract}
          </p>
        )}

        {/* Footer: citations + DOI */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          {publication.citationCount !== undefined && (
            <span className="flex items-center gap-1 text-xs text-journal-gold">
              <Quote className="h-3 w-3" />
              被引 {publication.citationCount} 次
            </span>
          )}
          {publication.doi && (
            <a
              href={`https://doi.org/${publication.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-muted-foreground hover:text-journal-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              DOI: {publication.doi}
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
