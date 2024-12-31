import { Suspense } from 'react';
import { allBlogs, allWeeklies } from 'contentlayer/generated';
import { titleFont } from '@/lib/utils/fonts';
import SearchContent from './SearchContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '搜索 - Zenquan\'s Blog',
  description: '搜索文章内容',
  other: {
    'og:title': '搜索 - Zenquan\'s Blog',
    'og:description': '搜索文章内容',
    'og:image': '/icons/favicon.png',
    'og:url': `https://blog.u-tools.fun/search`,
  },
};

export default async function Page({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  return (
    <div className="pt-10 pb-6 px-3">
      <h1
        className={`flex flex-col text-3xl text-black leading-normal tracking-wider ${titleFont.className}`}
      >
        搜索
      </h1>
      <Suspense fallback={<div>加载中...</div>}>
        <SearchContent allBlogs={allBlogs} allWeeklies={allWeeklies} />
      </Suspense>
    </div>
  );
}
