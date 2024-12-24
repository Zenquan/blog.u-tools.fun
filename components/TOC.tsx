'use client';

import { FC, useEffect, useState } from 'react';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TOCProps {
  className?: string;
}

const TOC: FC<TOCProps> = ({ className = '' }) => {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

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

  if (headings.length === 0) return null;

  return (
    <nav className={`hidden lg:block ${className}`}>
      <div className="sticky top-8">
        <h2 className="text-sm font-medium text-gray-900 mb-4">目录</h2>
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
                className={`block py-1 text-gray-500 hover:text-gray-900 transition-colors truncate ${
                  activeId === heading.id ? 'text-gray-900 font-medium' : ''
                }`}
                title={heading.text}
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById(heading.id);
                  if (element) {
                    element.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    });
                  }
                }}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default TOC;
