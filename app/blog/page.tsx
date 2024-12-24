import { Metadata } from 'next';
import { allBlogs } from 'contentlayer/generated';
import List from '@/components/List';
import { titleFont } from '@/lib/utils/fonts';

export const metadata: Metadata = {
  title: '博客 - Zenquan\'s Blog',
  description: '分享前端、JavaScript 等技术文章',
};

export default function Page() {
  return (
    <>
      <div className="pt-10 pb-6 px-3">
        <h1
          className={`flex flex-col text-3xl text-black leading-normal tracking-wider ${titleFont.className}`}
        >
          博客
        </h1>
        <p className="mt-4 text-gray-600 text-sm">
          共 {allBlogs.length} 篇文章
        </p>
      </div>
      <List data={allBlogs} />
    </>
  );
}
