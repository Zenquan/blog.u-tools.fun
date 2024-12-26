'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

export default function Search() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const keyword = searchParams.get('q') || '';
  const tag = searchParams.get('tag') || '';

  const onSearch = useCallback(
    (term: string) => {
      const params = new URLSearchParams();
      if (term) {
        params.set('q', term);
      }
      if (tag) {
        params.set('tag', tag);
      }
      router.push(`/search?${params.toString()}`);
    },
    [router, tag]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && inputRef.current) {
        e.preventDefault();
        inputRef.current.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="search"
        placeholder="搜索文章... 按 / 键快速搜索"
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-gray-400 text-base"
        defaultValue={keyword}
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  );
}
