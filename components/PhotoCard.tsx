'use client';

import { useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Photo } from '@/lib/types/unsplash';

interface Props {
  photo: Photo;
  onClick: () => void;
}

export default function PhotoCard({ photo, onClick }: Props) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div 
      className="relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
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
            object-cover transition-transform duration-300 group-hover:scale-105
            ${isLoading ? 'opacity-0' : 'opacity-100'}
          `}
          loading="lazy"
          onLoadingComplete={() => setIsLoading(false)}
        />
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 via-black/40 to-transparent">
          <time className="block text-sm text-white/80" dateTime={photo.created_at}>
            {format(new Date(photo.created_at), 'yyyy-MM-dd')}
          </time>
        </div>
      </div>
    </div>
  );
} 