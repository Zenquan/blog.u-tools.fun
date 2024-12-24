'use client';

import { FC } from 'react';
import { usePathname } from 'next/navigation';

const ARTICLE_PATHS = ['/blog/', '/weekly/'] as const;

const Footer: FC = () => {
  const pathname = usePathname() || '';
  
  const isArticlePage = ARTICLE_PATHS.some(
    path => pathname.startsWith(path) && pathname !== path
  );

  return (
    <footer 
      className={`
        px-3 py-4 border-t border-gray-100
        ${!isArticlePage ? 'fixed bottom-0 left-0 right-0 bg-white' : ''}
      `}
    >
      <div className="max-w-3xl mx-auto px-2 flex items-center space-x-2 text-xs text-gray-500">
        <p>Zenquan &copy; {new Date().getFullYear()}</p>
        <span className="font-bold">·</span>
        <a href="https://beian.miit.gov.cn" target="_blank" rel="noreferrer">
          粤ICP备2024252469号
        </a>
      </div>
    </footer>
  );
};

export default Footer;
