import { Metadata } from 'next';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import Menu from '../components/Menu';
import './globals.css';
import Footer from '../components/Footer';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Zenquan',
  description: 'Zenquan 的个人站点，关于前端、JavaScript 等',
  authors: [{ name: 'Zenquan', url: 'https://blog.u-tools.fun' }],
  other: {
    'baidu-site-verification': '',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body>
        <Menu />
        <div className="max-w-3xl mx-auto px-2">{children}</div>
        <Footer/>
      </body>
      <Script src="https://cdn.splitbee.io/sb.js" strategy="afterInteractive" />
    </html>
  );
}
