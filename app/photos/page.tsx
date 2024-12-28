import { Metadata } from 'next';
import { titleFont } from '@/lib/utils/fonts';
import CollectionList from '@/components/CollectionList';

export const metadata: Metadata = {
  title: '摄影集 - Zenquan\'s Blog',
  description: '记录生活中的美好瞬间',
  other: {
    'og:title': '摄影集 - Zenquan\'s Blog',
    'og:description': '记录生活中的美好瞬间',
    'og:image': '/icons/favicon.png',
    'og:url': `https://blog.u-tools.fun/photos`,
  },
};

export default function Page() {
  return (
    <>
      <div className="pt-10 pb-6 px-3">
        <h1
          className={`flex flex-col text-3xl text-black leading-normal tracking-wider ${titleFont.className}`}
        >
          摄影集
        </h1>
        <p className="mt-4 text-gray-600">
          记录生活中的美好瞬间
        </p>
      </div>
      <CollectionList username="zenquan" />
    </>
  );
} 