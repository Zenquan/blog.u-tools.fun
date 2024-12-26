'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { ImageIcon, TagIcon } from 'lucide-react';
import { unsplash } from '@/lib/unsplash';
import { Collection } from '@/lib/types/unsplash';
import CollectionSkeleton from '@/components/CollectionSkeleton';

function CollectionCard({ collection }: { collection: Collection }) {
  const [mounted, setMounted] = useState(false);
  const [loadingStates, setLoadingStates] = useState<boolean[]>([true, true, true]);
  const previewPhotos = collection.preview_photos?.slice(0, 3) || [];

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleImageLoad = (index: number) => {
    setLoadingStates(prev => {
      const newStates = [...prev];
      newStates[index] = false;
      return newStates;
    });
  };

  if (!mounted) {
    return <CollectionSkeleton />;
  }

  return (
    <Link 
      href={`/photos/${collection.id}`}
      className="group block"
    >
      <div className="relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-all">
        <div className="relative aspect-[3/2]">
          {previewPhotos.length > 0 ? (
            <div className="absolute inset-0 grid grid-cols-2 gap-0.5">
              <div className="relative overflow-hidden">
                {loadingStates[0] && (
                  <div className="absolute inset-0 z-10">
                    <div className="w-full h-full backdrop-blur-lg bg-white/10">
                      <Image
                        src={previewPhotos[0].urls.thumb}
                        alt={collection.title}
                        fill
                        className="object-cover opacity-50"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      </div>
                    </div>
                  </div>
                )}
                <Image
                  src={previewPhotos[0].urls.regular}
                  alt={collection.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16.67vw"
                  className={`
                    object-cover group-hover:scale-105 transition-transform duration-300
                    ${loadingStates[0] ? 'opacity-0' : 'opacity-100'}
                  `}
                  loading="lazy"
                  onLoadingComplete={() => handleImageLoad(0)}
                />
              </div>
              <div className="grid grid-rows-2 gap-0.5">
                {previewPhotos.slice(1, 3).map((photo, index) => (
                  <div key={photo.id} className="relative overflow-hidden">
                    {loadingStates[index + 1] && (
                      <div className="absolute inset-0 z-10">
                        <div className="w-full h-full backdrop-blur-lg bg-white/10">
                          <Image
                            src={photo.urls.thumb}
                            alt={collection.title}
                            fill
                            className="object-cover opacity-50"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          </div>
                        </div>
                      </div>
                    )}
                    <Image
                      src={photo.urls.regular}
                      alt={collection.title}
                      fill
                      sizes="(max-width: 640px) 25vw, (max-width: 1024px) 12.5vw, 8.33vw"
                      className={`
                        object-cover group-hover:scale-105 transition-transform duration-300
                        ${loadingStates[index + 1] ? 'opacity-0' : 'opacity-100'}
                      `}
                      loading="lazy"
                      onLoadingComplete={() => handleImageLoad(index + 1)}
                    />
                  </div>
                ))}
              </div>
            </div>
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
          {collection.tags && collection.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {collection.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.title}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-white/20 text-white/90"
                >
                  <TagIcon size={12} className="mr-1" />
                  {tag.title}
                </span>
              ))}
              {collection.tags.length > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-white/20 text-white/90">
                  +{collection.tags.length - 3}
                </span>
              )}
            </div>
          )}
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

interface Props {
  username: string;
}

export default function CollectionList({ username }: Props) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchCollections = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const result = await unsplash.users.getCollections({
        username,
        page,
        perPage: 12,
      });
      
      if (result.response) {
        const newCollections = result.response.results;
        if (newCollections.length === 0) {
          setHasMore(false);
        } else {
          // 使用 Set 来去重
          const uniqueCollections = Array.from(
            new Set([...collections, ...newCollections].map(c => JSON.stringify(c)))
          ).map(c => JSON.parse(c));
          
          setCollections(uniqueCollections);
          setPage(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000
      ) {
        fetchCollections();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [collections, loading, hasMore, mounted]);

  if (!mounted) {
    return (
      <div className="px-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CollectionSkeleton />
          <CollectionSkeleton />
          <CollectionSkeleton />
        </div>
      </div>
    );
  }

  if (collections.length === 0 && !loading) {
    return (
      <div className="px-3 py-8 text-center text-gray-500">
        暂无摄影集
      </div>
    );
  }

  return (
    <div className="px-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map((collection) => (
          <CollectionCard
            key={collection.id}
            collection={collection}
          />
        ))}
        {loading && (
          <>
            <CollectionSkeleton />
            <CollectionSkeleton />
            <CollectionSkeleton />
          </>
        )}
      </div>
      {!hasMore && collections.length > 0 && (
        <div className="text-center pt-4 pb-14 text-gray-500">
          没有更多摄影集了
        </div>
      )}
    </div>
  );
} 