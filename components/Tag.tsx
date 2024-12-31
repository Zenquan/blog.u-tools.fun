'use client';

import { FC, ReactNode } from 'react';
import Link from 'next/link';

interface TagProps {
  children: ReactNode;
  className?: string;
}

const Tag: FC<TagProps> = ({ children, className = '' }) => {
  const tag = Array.isArray(children) ? children[0]?.toString() : children?.toString() || '';
  return (
    <Link
      href={`/tags/${encodeURIComponent(tag)}`}
      className={`inline-flex items-center px-2 py-1 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors ${className}`}
    >
      #{tag}
    </Link>
  );
};

export default Tag;
