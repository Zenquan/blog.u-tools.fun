'use client';

import { FC, useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TOCProps {
  isMobile?: boolean;
}

const TOC: FC<TOCProps> = ({ isMobile = false }) => {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 获取所有标题元素
    const articleElement = document.querySelector('article');
    if (!articleElement) return;

    const elements = articleElement.querySelectorAll('h1, h2, h3');
    const items: TOCItem[] = Array.from(elements)
      .filter(element => element.id && element.textContent) // 只处理有 id 和文本内容的标题
      .map((element) => ({
        id: element.id,
        text: element.textContent || '',
        level: Number(element.tagName.charAt(1)),
      }));

    setHeadings(items);

    // 设置 Intersection Observer 来监听标题的可见性
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '0px 0px -80% 0px',
        threshold: 0.5,
      }
    );

    elements.forEach((element) => {
      if (element.id) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // 当弹窗打开时禁止页面滚动
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (headings.length === 0) return null;

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      setIsOpen(false);
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  const renderTOCContent = () => (
    <ul className="space-y-2 text-sm">
      {headings.map((heading) => (
        <li
          key={heading.id}
          style={{
            paddingLeft: `${(heading.level - 1) * 1}rem`,
          }}
          className="min-w-0"
        >
          <a
            href={`#${heading.id}`}
            className={`block py-2 text-gray-500 hover:text-gray-900 transition-colors ${
              activeId === heading.id ? 'text-gray-900 font-medium' : ''
            }`}
            onClick={(e) => {
              e.preventDefault();
              handleClick(heading.id);
            }}
          >
            {heading.text}
          </a>
        </li>
      ))}
    </ul>
  );

  // 移动端布局
  if (isMobile) {
    return (
      <>
        {/* 移动端触发按钮 */}
        <button
          className="fixed right-4 bottom-4 z-50 p-3 bg-white rounded-full shadow-lg border"
          onClick={() => setIsOpen(true)}
          aria-label="打开目录"
        >
          <Menu size={24} className="text-gray-700" />
        </button>

        {/* 移动端弹出层 */}
        {isOpen && (
          <div className="fixed inset-0 z-50 toc-overlay">
            <div className="absolute inset-0 bg-black/20" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-[80%] max-w-[300px] bg-white shadow-lg toc-drawer">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-gray-900">目录</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="关闭目录"
                  >
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>
                {renderTOCContent()}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // 桌面端布局
  return (
    <div className="sticky top-8">
      <h2 className="text-sm font-medium text-gray-900 mb-4">目录</h2>
      {renderTOCContent()}
    </div>
  );
};

export default TOC;
