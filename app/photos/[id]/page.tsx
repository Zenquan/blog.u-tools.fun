import { Metadata } from 'next';
import { unsplash } from '@/lib/unsplash';
import { Collection } from '@/lib/types/unsplash';
import { titleFont } from '@/lib/utils/fonts';
import CollectionPhotos from '@/components/CollectionPhotos';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const result = await unsplash.collections.get({ collectionId: id });
    const collection = result.response;
    return {
      title: `${collection?.title || '摄影集'} - Zenquan's Blog`,
      description: collection?.description || '摄影集详情',
    };
  } catch (error) {
    return {
      title: '摄影集 - Zenquan\'s Blog',
      description: '摄影集详情',
    };
  }
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  let collection: Collection | null = null;

  try {
    const result = await unsplash.collections.get({ collectionId: id });
    if (result.response) {
      collection = result.response;
    }
  } catch (error) {
    console.error('Error fetching collection:', error);
  }

  if (!collection) {
    return (
      <div className="px-3 py-8 text-center text-gray-500">
        未找到该摄影集合
      </div>
    );
  }

  return (
    <>
      <div className="pt-10 pb-6 px-3">
        <h1
          className={`flex flex-col text-3xl text-black leading-normal tracking-wider ${titleFont.className}`}
        >
          {collection.title}
        </h1>
        {collection.description && (
          <p className="mt-4 text-gray-600">
            {collection.description}
          </p>
        )}
        <p className="mt-2 text-gray-500 text-sm">
          共 {collection.total_photos} 张照片
        </p>
      </div>
      <CollectionPhotos collectionId={collection.id} />
    </>
  );
} 