import { Metadata } from 'next';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import Menu from '../components/Menu';
import './globals.css';
import Footer from '../components/Footer';
import ErrorBoundary from '@/components/ErrorBoundary';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Zenquan',
  description: 'Zenquan 的个人站点，关于前端、JavaScript 等',
  authors: [{ name: 'Zenquan', url: 'https://blog.u-tools.fun' }],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  other: {
    'baidu-site-verification': '',
    'og:title': 'Zenquan',
    'og:description': 'Zenquan 的个人站点，关于前端、JavaScript 等',
    'og:image': '/icons/favicon.png',
    'og:url': 'https://blog.u-tools.fun',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body className="flex flex-col min-h-screen">
        <ErrorBoundary>
          <Menu />
          <main className="flex-1 max-w-3xl mx-auto px-2 w-full">
            {children}
          </main>
          <Footer/>
        </ErrorBoundary>
        <Script
          id="vconsole"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var searchParams = new URLSearchParams(window.location.search);
                if (searchParams.get('devtool') === 'true') {
                  var vConsole = new window.VConsole();
                }
              })();
            `,
          }}
        />
        <Script src="https://unpkg.com/vconsole@latest/dist/vconsole.min.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
