import { Metadata } from 'next';
import { allBlogs } from 'contentlayer/generated';
import List from '@/components/List';
import { titleFont } from '@/lib/utils/fonts';
import Pagination from '@/components/Pagination';

export const metadata: Metadata = {
  title: '博客 - Zenquan\'s Blog',
  description: '分享前端、JavaScript 等技术文章',
  other: {
    'og:title': '博客 - Zenquan\'s Blog',
    'og:description': '分享前端、JavaScript 等技术文章',
    'og:image': '/icons/favicon.png',
    'og:url': `https://blog.u-tools.fun/blog`,
  },
};

type SearchParams = { [key: string]: string | string[] | undefined };

interface PageProps {
  params: { slug?: string };
  searchParams: SearchParams;
}

export default async function Page({ searchParams }: PageProps) {
  const pageSize = 10; // 每页显示的数量
  const currentPage = Number(searchParams.page) || 1; // 当前页码
  
  const sortedBlogs = allBlogs.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const totalPages = Math.ceil(sortedBlogs.length / pageSize);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const currentBlogs = sortedBlogs.slice(start, end);

  return (
    <>
      <div className="pt-10 pb-6 px-3">
        <h1
          className={`flex flex-col text-3xl text-black leading-normal tracking-wider ${titleFont.className}`}
        >
          博客
        </h1>
        <p className="mt-4 text-gray-600 text-sm">
          共 {sortedBlogs.length} 篇文章
        </p>
      </div>
      <List data={currentBlogs} />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/blog"
      />
    </>
  );
}
