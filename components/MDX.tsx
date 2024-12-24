'use client';

import { FC } from 'react';
import Image from 'next/image';
import { useMDXComponent } from 'next-contentlayer2/hooks';

export interface MDXProps {
  code: string;
}

const MDX: FC<MDXProps> = ({ code }) => {
  try {
    const Component = useMDXComponent(code);

    return (
      <div className="mdx-content">
        <Component
          components={{
            img: (props: any) => (
              <div className="my-4">
                <Image {...props} />
              </div>
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
