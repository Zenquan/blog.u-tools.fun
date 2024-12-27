'use client';

import { FC } from 'react';

const Footer: FC = () => {
  return (
    <footer className="px-3 py-6 border-t border-gray-100">
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
