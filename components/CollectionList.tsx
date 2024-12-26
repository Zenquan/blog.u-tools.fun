'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createApi } from 'unsplash-js';
import { format } from 'date-fns';
import { ImageIcon } from 'lucide-react';

// 创建 Unsplash API 实例
const unsplash = createApi({
  accessKey: process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || '',
});

interface Collection {
  id: string;
  title: string;
  description: string | null;
  total_photos: number;
  preview_photos: Array<{
    id: string;
    urls: {
      regular: string;
      thumb: string;
    };
  }>;
  published_at: string;
  updated_at: string;
}

function CollectionCard({ collection }: { collection: Collection }) {
  const [isLoading, setIsLoading] = useState(true);
  const previewPhoto = collection.preview_photos?.[0];

  return (
    <Link 
      href={`/photos/${collection.id}`}
      className="group block"
    >
      <div className="relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-all">
        <div className="relative aspect-[3/2]">
          {previewPhoto ? (
            <>
              {isLoading && (
                <div className="absolute inset-0 z-10">
                  <div className="w-full h-full backdrop-blur-lg bg-white/10">
                    <Image
                      src={previewPhoto.urls.thumb}
                      alt={collection.title}
                      fill
                      className="object-cover opacity-50"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  </div>
                </div>
              )}
              <Image
                src={previewPhoto.urls.regular}
                alt={collection.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className={`
                  object-cover group-hover:scale-105 transition-transform duration-300
                  ${isLoading ? 'opacity-0' : 'opacity-100'}
                `}
                loading="lazy"
                onLoadingComplete={() => setIsLoading(false)}
              />
            </>
          ) : (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <ImageIcon size={32} className="text-gray-400" />
            </div>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 via-black/40 to-transparent">
          <h3 className="text-lg font-medium text-white mb-1">
            {collection.title}
          </h3>
          <div className="flex items-center justify-between text-sm text-white/80">
            <span>{collection.total_photos} 张照片</span>
            <time>
              {format(new Date(collection.updated_at), 'yyyy-MM-dd')}
            </time>
          </div>
        </div>
      </div>
      {collection.description && (
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
          {collection.description}
        </p>
      )}
    </Link>
  );
}

export default function CollectionList() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCollections = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const result = await unsplash.users.getCollections({
        username: 'zenquan',
        page: 1,
        perPage: 30,
      });
      
      if (result.response) {
        setCollections(result.response.results);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  if (collections.length === 0 && !loading) {
    return (
      <div className="px-3 py-8 text-center text-gray-500">
        暂无摄影集
      </div>
    );
  }

  return (
    <div className="px-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((collection) => (
          <CollectionCard
            key={collection.id}
            collection={collection}
          />
        ))}
      </div>
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent"></div>
        </div>
      )}
    </div>
  );
} 