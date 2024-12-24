'use client';

import { FC } from 'react';
import Image from 'next/image';
import { useMDXComponent } from 'next-contentlayer2/hooks';

export interface MDXProps {
  code: string;
}

const slugifyWithCounter = () => {
  const slugs = new Map<string, number>();

  return (str: string) => {
    const base = str
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');

    const count = slugs.get(base) ?? 0;
    slugs.set(base, count + 1);

    return count === 0 ? base : `${base}-${count}`;
  };
};

const MDX: FC<MDXProps> = ({ code }) => {
  try {
    const Component = useMDXComponent(code);
    const slugify = slugifyWithCounter();

    return (
      <div className="mdx-content">
        <Component
          components={{
            img: (props: any) => (
              <div className="my-4">
                <Image {...props} />
              </div>
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
