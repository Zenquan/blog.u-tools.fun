import { Metadata } from 'next';
import Link from 'next/link';
import { allBlogs } from 'contentlayer/generated';
import { titleFont } from '@/lib/utils/fonts';

export const metadata: Metadata = {
  title: '标签 - Zenquan\'s Blog',
  description: '博客文章标签列表',
  other: {
    'og:title': '标签 - Zenquan\'s Blog',
    'og:description': '博客文章标签列表',
    'og:image': '/icons/favicon.png',
    'og:url': `https://blog.u-tools.fun/tags`,
  },
};

export default async function Page() {
  // 统计每个标签的文章数量
  const tagCounts = new Map<string, number>();
  allBlogs.forEach((blog) => {
    blog.tags?.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  // 转换为数组并排序
  const tags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }));

  return (
    <>
      <div className="pt-10 pb-6 px-3">
        <h1
          className={`flex flex-col text-3xl text-black leading-normal tracking-wider ${titleFont.className}`}
        >
          标签
        </h1>
        <p className="mt-4 text-gray-600 text-sm">
          共 {tags.length} 个标签
        </p>
      </div>
      <div className="px-3 flex flex-wrap gap-3">
        {tags.map(({ tag, count }) => (
          <Link
            key={tag}
            href={`/tags/${encodeURIComponent(tag)}`}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            {tag}
            <span className="ml-1 text-gray-400">({count})</span>
          </Link>
        ))}
      </div>
    </>
  );
}
