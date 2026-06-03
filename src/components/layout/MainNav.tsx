'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { GraduationCap, Users, MessageCircle, Trophy, Menu, X, LogOut, Sparkles, Search, Database, Brain, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { GlobalSearch } from '@/components/features/search/GlobalSearch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/components/providers/LanguageProvider';

export function MainNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { lang, t, toggleLang } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const navItems = [
    { href: '/disciplines', label: t.nav.disciplines, icon: GraduationCap, zone: 'scholarly' as const },
    { href: '/groups', label: t.nav.groups, icon: Users, zone: 'scholarly' as const },
    { href: '/workshop', label: t.nav.workshop, icon: Sparkles, zone: 'social' as const },
    { href: '/tea-party', label: t.nav.teaParty, icon: MessageCircle, zone: 'social' as const },
    { href: '/top-questions', label: t.nav.top10, icon: Trophy, zone: 'scholarly' as const },
  ];

  const currentZone = getZone(pathname);

  // Global search shortcut: /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return
        }
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const zoneStyles = {
    scholarly: {
      logoIcon: 'text-journal-primary',
      logoBg: 'bg-journal-primary/10',
      logoBgHover: 'group-hover:bg-journal-primary/20',
      activeBg: 'bg-journal-primary/10',
      activeText: 'text-journal-primary',
      indicator: 'bg-journal-gold',
    },
    social: {
      logoIcon: 'text-tea-primary',
      logoBg: 'bg-tea-primary/10',
      logoBgHover: 'group-hover:bg-tea-primary/20',
      activeBg: 'bg-tea-primary/10',
      activeText: 'text-tea-primary',
      indicator: 'bg-tea-accent',
    },
    neutral: {
      logoIcon: 'text-primary',
      logoBg: 'bg-primary/10',
      logoBgHover: 'group-hover:bg-primary/20',
      activeBg: 'bg-primary/10',
      activeText: 'text-primary',
      indicator: 'bg-primary',
    },
  };

  const z = zoneStyles[currentZone];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg transition-colors', z.logoBg, z.logoBgHover)}>
            <GraduationCap className={cn('h-5 w-5', z.logoIcon)} />
          </div>
          <span className="hidden font-semibold sm:inline-block font-serif">
            Scholar&apos;s Tea
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            const itemZone = item.zone;
            const itemStyles = itemZone === 'scholarly' ? zoneStyles.scholarly : zoneStyles.social;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200',
                  isActive
                    ? cn(itemStyles.activeBg, itemStyles.activeText, 'font-semibold')
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {isActive && (
                  <span className={cn('absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full animate-fade-in-up', itemStyles.indicator)} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Search Button */}
        <Button
          variant="ghost"
          size="sm"
          className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="h-4 w-4" />
          <span className="text-sm">{t.nav.search}</span>
          <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            /
          </kbd>
        </Button>

        {/* Right side: Language + User */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2"
            onClick={toggleLang}
            title={t.common.switchLang}
          >
            <Globe className="h-3.5 w-3.5" />
            <span className="font-medium">{lang === 'zh' ? '中' : 'En'}</span>
          </Button>

          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col gap-1 leading-none">
                    {session.user.name && (
                      <p className="font-medium text-sm">{session.user.name}</p>
                    )}
                    {session.user.email && (
                      <p className="text-xs text-muted-foreground">{session.user.email}</p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    {t.nav.profile}
                  </Link>
                </DropdownMenuItem>
                {session.user.role === 'ADMIN' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin/knowledge" className="cursor-pointer">
                        <Database className="mr-2 h-4 w-4" />
                        {t.nav.knowledgeBase}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/research-memory" className="cursor-pointer">
                        <Brain className="mr-2 h-4 w-4" />
                        {t.nav.researchMemory}
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive"
                  onClick={() => signOut()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t.nav.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" variant="default">
              <Link href="/signin">{t.nav.login}</Link>
            </Button>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t md:hidden">
          <nav className="container mx-auto px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              const itemZone = item.zone;
              const itemStyles = itemZone === 'scholarly' ? zoneStyles.scholarly : zoneStyles.social;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? cn(itemStyles.activeBg, itemStyles.activeText)
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            {/* Mobile Language Switcher */}
            <button
              onClick={() => {
                toggleLang();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-accent w-full"
            >
              <Globe className="h-4 w-4" />
              {t.common.switchLang}: {lang === 'zh' ? t.common.langZh : t.common.langEn}
            </button>
          </nav>
        </div>
      )}

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}

function getZone(pathname: string): 'scholarly' | 'social' | 'neutral' {
  if (pathname.startsWith('/disciplines') || pathname.startsWith('/groups') || pathname.startsWith('/top-questions')) {
    return 'scholarly';
  }
  if (pathname.startsWith('/tea-party') || pathname.startsWith('/workshop')) {
    return 'social';
  }
  return 'neutral';
}
