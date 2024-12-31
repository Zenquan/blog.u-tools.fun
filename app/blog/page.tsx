import { Metadata } from 'next';
import { allBlogs } from 'contentlayer/generated';
import List from '@/components/List';
import { titleFont } from '@/lib/utils/fonts';

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

export default function Page({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const pageSize = 10; // 每页显示的数量
  const currentPage = Number(searchParams.page) || 1; // 当前页码
  
  const sortedBlogs = allBlogs.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const totalPages = Math.ceil(sortedBlogs.length / pageSize);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const currentBlogs = sortedBlogs.slice(start, end);

  // 生成页码数组
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5; // 最多显示的页码数
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // 调整起始页码
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

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
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 py-8">
          {currentPage > 1 && (
            <a
              href={`/blog?page=${currentPage - 1}`}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              上一页
            </a>
          )}
          
          {/* 第一页 */}
          {getPageNumbers()[0] > 1 && (
            <>
              <a
                href="/blog?page=1"
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                1
              </a>
              {getPageNumbers()[0] > 2 && (
                <span className="text-gray-600">...</span>
              )}
            </>
          )}
          
          {/* 页码按钮 */}
          {getPageNumbers().map(number => (
            <a
              key={number}
              href={`/blog?page=${number}`}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                number === currentPage
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {number}
            </a>
          ))}
          
          {/* 最后一页 */}
          {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
            <>
              {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
                <span className="text-gray-600">...</span>
              )}
              <a
                href={`/blog?page=${totalPages}`}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {totalPages}
              </a>
            </>
          )}
          
          {currentPage < totalPages && (
            <a
              href={`/blog?page=${currentPage + 1}`}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              下一页
            </a>
          )}
        </div>
      )}
    </>
  );
}
