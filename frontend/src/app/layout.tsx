import type { Metadata } from 'next';
import Providers from './providers';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import '@/styles/globals.scss';
import 'highlight.js/styles/github.css';

export const metadata: Metadata = {
  title: '博客系统',
  description: '一个现代化的博客系统',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>
          <Header />
          <main style={{ marginTop: 64, minHeight: 'calc(100vh - 64px - 120px)' }}>
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
