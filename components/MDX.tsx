'use client';

import { FC, useEffect, useRef, useState } from 'react';
import { useMDXComponent } from 'next-contentlayer2/hooks';
import Image from 'next/image';
import MusicPlayer from './MusicPlayer';
import mermaid from 'mermaid';
import ImagePreview from './ImagePreview';
import ArticleFooter from './ArticleFooter';

const slugifyWithCounter = () => {
  const slugs = new Map<string, number>();

  return (str: string) => {
    const base = str
      ?.toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');

    const count = slugs.get(base) ?? 0;
    slugs.set(base, count + 1);

    return count === 0 ? base : `${base}-${count}`;
  };
};

interface MDXProps {
  code: string;
  date: string;
  update_at?: string;
}

// Mermaid 组件
const Mermaid: FC<{ code: string }> = ({ code }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [svgString, setSvgString] = useState<string>('');

  useEffect(() => {
    if (ref.current) {
      mermaid.initialize({
        startOnLoad: true,
        theme: 'default',
        securityLevel: 'loose',
      });
      
      mermaid.run({
        nodes: [ref.current],
      }).then(() => {
        if (ref.current) {
          const svg = ref.current.querySelector('svg');
          if (svg) {
            // 添加白色背景
            svg.style.backgroundColor = 'white';
            // 获取 SVG 字符串
            const svgStr = svg.outerHTML;
            setSvgString(svgStr);
          }
        }
      });
    }
  }, [code]);

  const handleClick = () => {
    setShowPreview(true);
  };

  // 创建一个模拟的 Photo 对象
  const mockPhoto = {
    id: 'mermaid-diagram',
    urls: {
      regular: `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`,
      full: `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`,
      thumb: `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`,
    },
    width: 1200,
    height: 800,
    alt_description: 'Mermaid Diagram',
    user: {
      name: 'Mermaid',
      username: 'mermaid',
    }
  };

  return (
    <>
      <div 
        className="my-4 cursor-pointer hover:opacity-80 transition-opacity bg-white" 
        onClick={handleClick} 
        ref={ref}
      >
        {code}
      </div>
      
      {showPreview && svgString && (
        <ImagePreview photo={mockPhoto} onClose={() => setShowPreview(false)}/>
      )}
    </>
  );
};

const extractTextContent = (node: any): string => {
  if (typeof node === 'string') return node;
  if (!node) return '';
  
  // 处理 props.children 是字符串的情况
  if (node.props?.children && typeof node.props.children === 'string') {
    return node.props.children;
  }
  
  // 处理 props.children 是数组的情况
  if (Array.isArray(node.props?.children)) {
    return node.props.children.map(extractTextContent).join('');
  }
  
  // 处理 props.children 是对象的情况
  if (node.props?.children?.props?.children) {
    return extractTextContent(node.props.children);
  }
  
  return '';
};

const MDX: FC<MDXProps> = ({ code, date, update_at }) => {
  try {
    const Component = useMDXComponent(code);
    const slugify = slugifyWithCounter();

    return (
      <div className="mdx-content">
        <Component
          components={{
            img: ({ alt, ...props }: any) => (
              <span className="block my-4">
                <Image alt={alt || ''} {...props} />
              </span>
            ),
            h1: (props: any) => (
              <h1 {...props} id={slugify(props.children)} />
            ),
            h2: (props: any) => (
              <h2 {...props} id={slugify(props.children)} />
            ),
            h3: (props: any) => (
              <h3 {...props} id={slugify(props.children)} />
            ),
            MusicPlayer,
            pre: ({ children, ...props }: any) => {
              const language = children?.props?.['data-language'];
              
              if (language === 'mermaid') {
                const mermaidCode = extractTextContent(children);
                return <Mermaid code={mermaidCode} />;
              }
              
              return <pre {...props}>{children}</pre>;
            },
            ArticleFooter: () => <ArticleFooter date={date} update_at={update_at}/>,
          }}
        />
      </div>
    );
  } catch (error) {
    console.error('MDX rendering error:', error);
    return (
      <div className="text-red-500">
        内容加载失败，请刷新页面重试。
      </div>
    );
  }
};

export default MDX;
