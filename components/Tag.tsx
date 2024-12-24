'use client';

import { FC } from 'react';
import Link from 'next/link';

interface TagProps {
  children: string;
  className?: string;
}

const Tag: FC<TagProps> = ({ children, className = '' }) => {
  return (
    <Link
      href={`/tags/${encodeURIComponent(children)}`}
      className={`inline-flex items-center px-2 py-1 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors ${className}`}
    >
      #{children}
    </Link>
  );
};

export default Tag;
