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
      <head>
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, touch-action: manipulation" 
        />
        <script src="https://lf9-cdn-tos.bytecdntp.com/cdn/expire-1-M/vConsole/3.12.1/vconsole.min.js"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            // 仅在非生产环境启用 vConsole
            // if (window.location.hostname !== 'blog.u-tools.fun') {
              var vConsole = new window.VConsole();
              console.log('vConsole is enabled');
            // }
          `
        }} />
      </head>
      <body>
        <Menu />
        <div className="max-w-3xl mx-auto px-2">{children}</div>
        <Footer/>
      </body>
      {/* <Script src="https://cdn.splitbee.io/sb.js" strategy="afterInteractive" /> */}
    </html>
  );
}
