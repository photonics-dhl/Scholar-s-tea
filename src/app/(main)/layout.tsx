'use client'

import { useLanguage } from '@/components/providers/LanguageProvider'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>{t.home.footer.brand} · {t.home.footer.tagline}</p>
        </div>
      </footer>
    </div>
  )
}
