'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { createApi } from 'unsplash-js';
import { format } from 'date-fns';
import ImagePreview from './ImagePreview';

// 创建 Unsplash API 实例
const unsplash = createApi({
  accessKey: process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || '',
});

interface Photo {
  id: string;
  urls: {
    regular: string;
    full: string;
    thumb: string;
  };
  created_at: string;
  alt_description: string;
  width: number;
  height: number;
  views?: number;
  downloads?: number;
  exif?: {
    make?: string;
    model?: string;
  };
  tags?: Array<{
    type: string;
    title: string;
  }>;
  user?: {
    name: string;
    username: string;
  };
}

function PhotoCard({ photo, onClick }: { photo: Photo; onClick: () => void }) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div 
      className="relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div 
        className="relative"
        style={{
          paddingBottom: `${(photo.height / photo.width) * 100}%`,
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 z-10">
            <div className="w-full h-full backdrop-blur-lg bg-white/10">
              <Image
                src={photo.urls.thumb}
                alt={photo.alt_description || '照片'}
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
          src={photo.urls.regular}
          alt={photo.alt_description || '照片'}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={`
            object-cover hover:scale-105 transition-transform duration-300
            ${isLoading ? 'opacity-0' : 'opacity-100'}
          `}
          loading="lazy"
          onLoadingComplete={() => setIsLoading(false)}
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
        <time className="text-sm text-white/90">
          {format(new Date(photo.created_at), 'yyyy-MM-dd')}
        </time>
      </div>
    </div>
  );
}

interface Props {
  collectionId: string;
}

export default function CollectionPhotos({ collectionId }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number>(-1);

  const fetchPhotos = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const result = await unsplash.collections.getPhotos({
        collectionId,
        page,
        perPage: 12,
      });
      
      if (result.response) {
        const newPhotos = result.response.results;
        if (newPhotos.length === 0) {
          setHasMore(false);
        } else {
          // 使用 Set 来去重
          const uniquePhotos = Array.from(
            new Set([...photos, ...newPhotos].map(p => JSON.stringify(p)))
          ).map(p => JSON.parse(p));
          
          setPhotos(uniquePhotos);
          setPage(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000
      ) {
        fetchPhotos();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [photos, loading, hasMore]);

  const handlePreview = (photo: Photo) => {
    const index = photos.findIndex(p => p.id === photo.id);
    setPreviewIndex(index);
    setPreviewPhoto(photo);
  };

  const handlePrevPhoto = () => {
    if (previewIndex > 0) {
      const prevPhoto = photos[previewIndex - 1];
      setPreviewIndex(previewIndex - 1);
      setPreviewPhoto(prevPhoto);
    }
  };

  const handleNextPhoto = () => {
    if (previewIndex < photos.length - 1) {
      const nextPhoto = photos[previewIndex + 1];
      setPreviewIndex(previewIndex + 1);
      setPreviewPhoto(nextPhoto);
    }
  };

  const handleClosePreview = () => {
    setPreviewPhoto(null);
    setPreviewIndex(-1);
  };

  if (photos.length === 0 && !loading) {
    return (
      <div className="px-3 py-8 text-center text-gray-500">
        暂无照片
      </div>
    );
  }

  return (
    <div className="px-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {photos.map((photo) => (
          <PhotoCard
            key={`${photo.id}-${photo.created_at}`}
            photo={photo}
            onClick={() => handlePreview(photo)}
          />
        ))}
      </div>
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent"></div>
        </div>
      )}
      {!hasMore && photos.length > 0 && (
        <div className="text-center pt-4 pb-14 text-gray-500">
          没有更多照片了
        </div>
      )}
      {previewPhoto && (
        <ImagePreview
          src={previewPhoto.urls.full}
          alt={previewPhoto.alt_description || '照片'}
          photo={previewPhoto}
          onClose={handleClosePreview}
          onPrev={handlePrevPhoto}
          onNext={handleNextPhoto}
          hasPrev={previewIndex > 0}
          hasNext={previewIndex < photos.length - 1}
        />
      )}
    </div>
  );
} 