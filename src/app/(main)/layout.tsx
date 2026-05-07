import { MainNav } from '@/components/layout/MainNav';
import { FloatingChat } from '@/components/features/hermes/FloatingChat';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <MainNav />
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Scholar&apos;s Tea 学者茶话会 · 高校学术交流社区</p>
        </div>
      </footer>
      <FloatingChat />
    </div>
  );
}
