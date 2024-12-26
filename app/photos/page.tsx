import { Metadata } from 'next';
import { titleFont } from '@/lib/utils/fonts';
import PhotoList from '@/components/PhotoList';

export const metadata: Metadata = {
  title: '摄影 - Zenquan\'s Blog',
  description: '记录生活中的美好瞬间',
};

export default async function Page() {
  return (
    <>
      <div className="pt-10 pb-6 px-3">
        <h1
          className={`flex flex-col text-3xl text-black leading-normal tracking-wider ${titleFont.className}`}
        >
          摄影
        </h1>
        <p className="mt-4 text-gray-600 text-sm">
          记录生活中的美好瞬间
        </p>
      </div>
      <PhotoList />
    </>
  );
} 