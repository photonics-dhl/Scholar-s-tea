import type { Metadata } from 'next';
import { Providers } from '@/components/providers/Providers';
import { FloatingChat } from '@/components/features/hermes/FloatingChat';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: "Scholar's Tea",
  description: '高校学术交流社区，在这里，不同高校、不同领域的不同课题组均可入住，交流分享自己的工作、探讨产生新的思想火花。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="scroll-smooth">
      <head>
        {/* Google Fonts - Scholar's Tea 双轨字体系统 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;0,8..60,700;1,8..60,400;1,8..60,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <FloatingChat />
        </Providers>
      </body>
    </html>
  );
}
