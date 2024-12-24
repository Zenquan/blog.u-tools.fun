'use client';

import { useSearchParams } from 'next/navigation';
import { Lato } from 'next/font/google';
import { allBlogs, allWeeklies } from 'contentlayer/generated';
import List from '@/components/List';
import Search from '@/components/Search';

const font = Lato({
  weight: '700',
  subsets: ['latin'],
});

export default function Page() {
  const searchParams = useSearchParams();
  const keyword = searchParams.get('q') || '';

  // 合并博客和周刊数据
  const allPosts = [
    ...allBlogs.map(post => ({ ...post, type: '博客' })),
    ...allWeeklies.map(post => ({ ...post, type: '周刊' })),
  ].sort((a, b) => (a.date > b.date ? -1 : 1));

  // 搜索逻辑
  const searchResults = keyword
    ? allPosts.filter(
        post =>
          post.title.toLowerCase().includes(keyword.toLowerCase()) ||
          post.description.toLowerCase().includes(keyword.toLowerCase()) ||
          post.type.toLowerCase().includes(keyword.toLowerCase())
      )
    : allPosts;

  return (
    <>
      <div className="pt-10 pb-6 px-3">
        <h1
          className={`flex flex-col text-3xl text-black leading-normal tracking-wider ${font.className}`}
        >
          搜索
        </h1>
        <div className="mt-6">
          <Search />
        </div>
        <div className="mt-4 text-sm text-gray-500">
          {keyword ? (
            <p>
              找到 {searchResults.length} 篇与 &quot;{keyword}&quot; 相关的文章
            </p>
          ) : (
            <p>共 {searchResults.length} 篇文章</p>
          )}
        </div>
      </div>
      <List
        data={searchResults.map(post => ({
          ...post,
          title: `${post.title} · ${post.type}`,
        }))}
      />
    </>
  );
}
