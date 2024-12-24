import { Metadata } from 'next';
import { allWeeklies } from 'contentlayer/generated';
import List from '@/components/List';
import { titleFont } from '@/lib/utils/fonts';

export const metadata: Metadata = {
  title: '周刊 - Zenquan\'s Blog',
  description: '每周分享科技、编程、设计等内容',
};

export default function Page() {
  return (
    <>
      <div className="pt-10 pb-6 px-3">
        <h1
          className={`flex flex-col text-3xl text-black leading-normal tracking-wider ${titleFont.className}`}
        >
          周刊
        </h1>
        <p className="mt-4 text-gray-600 text-sm">
          共 {allWeeklies.length} 期周刊
        </p>
      </div>
      <List data={allWeeklies} />
    </>
  );
}
