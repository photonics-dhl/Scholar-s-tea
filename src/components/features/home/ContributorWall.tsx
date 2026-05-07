'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils/cn'

interface Contributor {
  id: string
  name: string
  initials: string
  color: string
  href?: string
}

/**
 * 贡献者头像瀑布流
 * 展示最近活跃用户，增加社区归属感
 */
export function ContributorWall({ contributors }: { contributors: Contributor[] }) {
  const [visibleCount, setVisibleCount] = useState(12)

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 640) setVisibleCount(8)
      else if (width < 1024) setVisibleCount(12)
      else setVisibleCount(18)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const displayContributors = contributors.slice(0, visibleCount)

  return (
    <div className="flex flex-wrap justify-center gap-2 md:gap-3">
      {displayContributors.map((contributor, i) => {
        const content = (
          <div
            className={cn(
              'animate-fade-in-up flex flex-col items-center gap-1.5 transition-transform duration-200 hover:scale-110',
              i % 2 === 0 ? 'mt-0' : 'mt-3'
            )}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <Avatar
              className={cn(
                'h-10 w-10 md:h-12 md:w-12 border-2 border-background shadow-md',
                contributor.color
              )}
            >
              <AvatarFallback
                className={cn(
                  'text-xs md:text-sm font-medium',
                  contributor.color
                )}
              >
                {contributor.initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-[10px] md:text-xs text-muted-foreground max-w-[60px] truncate">
              {contributor.name}
            </span>
          </div>
        )

        if (contributor.href) {
          return (
            <Link key={contributor.id} href={contributor.href}>
              {content}
            </Link>
          )
        }
        return <div key={contributor.id}>{content}</div>
      })}
    </div>
  )
}
