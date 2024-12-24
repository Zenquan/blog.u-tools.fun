'use client';

import { FC, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search as SearchIcon } from 'lucide-react';

const Search: FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('q') || '');

  const handleSearch = useCallback((value: string) => {
    setKeyword(value);
    if (value) {
      router.push(`/search?q=${encodeURIComponent(value)}`);
    } else {
      router.push('/search');
    }
  }, [router]);

  return (
    <div className="relative">
      <input
        type="text"
        value={keyword}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="搜索文章..."
        className="w-full px-4 py-2 pl-10 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white transition-colors"
      />
      <SearchIcon size={18} className="absolute left-3 top-2.5 text-gray-400" />
    </div>
  );
};

export default Search;
