'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Building2, Users, FileText, Newspaper, Award, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    description: string | null;
    institution: {
      name: string;
      logo: string | null;
    };
    _count: {
      members: number;
      publications: number;
      news: number;
      patents: number;
    };
  };
  className?: string;
  animationDelay?: number;
}

export function GroupCard({ group, className, animationDelay = 0 }: GroupCardProps) {
  return (
    <Link href={`/groups/${group.slug}`} className="group">
      <div
        className={cn(
          'relative flex flex-col overflow-hidden rounded-lg border border-journal-border bg-card shadow-sm transition-all duration-300 hover:border-journal-gold hover:shadow-lg hover:-translate-y-1',
          'animate-fade-in-up',
          className
        )}
        style={{ animationDelay: `${animationDelay}ms` }}
      >
        {/* Banner with gradient overlay */}
        <div className="h-20 bg-gradient-to-br from-journal-primary/20 via-journal-primary/10 to-transparent relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-journal-gold via-journal-gold/60 to-transparent" />
        </div>

        {/* Logo */}
        <div className="absolute left-4 top-12 flex h-16 w-16 items-center justify-center rounded-full border-2 border-background bg-background shadow-md transition-transform duration-200 group-hover:scale-105">
          {group.logo ? (
            <Image
              src={group.logo}
              alt={group.name}
              width={64}
              height={64}
              className="rounded-lg object-cover"
            />
          ) : (
            <Building2 className="h-8 w-8 text-journal-primary" />
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-4 pt-16">
          <div>
            <h3 className="font-serif font-semibold text-base truncate group-hover:text-journal-primary transition-colors">
              {group.name}
            </h3>
            <p className="mt-1 flex items-center text-xs text-muted-foreground">
              {group.institution.logo && (
                <Image
                  src={group.institution.logo}
                  alt=""
                  width={12}
                  height={12}
                  className="mr-1"
                />
              )}
              <span className="truncate">{group.institution.name}</span>
            </p>
          </div>

          {group.description && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground font-source-serif leading-relaxed">
              {group.description}
            </p>
          )}

          {/* Stats */}
          <div className="mt-auto flex items-center gap-4 border-t border-journal-border/50 pt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-tea-primary" />
              <span className="font-medium text-foreground">{group._count.members}</span>
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-journal-gold" />
              <span className="font-medium text-foreground">{group._count.publications}</span>
            </span>
            <span className="flex items-center gap-1">
              <Newspaper className="h-3.5 w-3.5 text-convo-blue" />
              <span className="font-medium text-foreground">{group._count.news}</span>
            </span>
            <span className="flex items-center gap-1">
              <Award className="h-3.5 w-3.5 text-tea-accent" />
              <span className="font-medium text-foreground">{group._count.patents}</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
