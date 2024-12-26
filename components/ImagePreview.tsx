'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Camera, ChevronLeft, ChevronRight, Download, Eye, Heart, MapPin, X } from 'lucide-react';
import { Photo } from '@/lib/types/unsplash';
import { formatNumber } from '@/lib/utils/format';
import { usePhotoDetails } from '@/lib/hooks/usePhotoDetails';

interface Props {
  src: string;
  alt: string;
  photo: Photo;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export default function ImagePreview({
  src,
  alt,
  photo,
  onClose,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { photoDetails, photoStats } = usePhotoDetails(photo.id);
  const [isLoading, setIsLoading] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          if (hasPrev && onPrev) onPrev();
          break;
        case 'ArrowRight':
          if (hasNext && onNext) onNext();
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  // 处理触摸事件
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && hasNext && onNext) {
      onNext();
    } else if (isRightSwipe && hasPrev && onPrev) {
      onPrev();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={(e) => {
        if (e.target === containerRef.current) {
          onClose();
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <button
        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors"
        onClick={onClose}
      >
        <X size={24} />
      </button>

      <div className="relative max-w-[90vw] max-h-[90vh]">
        <div className="relative">
        {isLoading && (
          <div className="inset-0 z-10">
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
          width={1200}
          height={800}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={`
            object-cover hover:scale-105 transition-transform duration-300
            ${isLoading ? 'opacity-0' : 'opacity-100'}
          `}
          onLoadingComplete={() => setIsLoading(false)}
        />
          
          {/* 照片信息 */}
          <div className="p-4 bg-gradient-to-t from-black/60 via-black/40 to-transparent">
            <div className="flex flex-wrap gap-4 text-sm text-white/90">
              {/* 统计信息 */}
              <div className="flex items-center gap-4">
                {photoStats && (
                  <>
                    <span className="inline-flex items-center">
                      <Eye size={16} className="mr-1" />
                      {formatNumber(photoStats.views.total)}
                    </span>
                    <span className="inline-flex items-center">
                      <Download size={16} className="mr-1" />
                      {formatNumber(photoStats.downloads.total)}
                    </span>
                    <span className="inline-flex items-center">
                      <Heart size={16} className="mr-1" />
                      {formatNumber(photo.likes)}
                    </span>
                  </>
                )}
              </div>

              {/* 相机信息 */}
              {photoDetails?.exif && (
                <div className="flex flex-wrap items-center gap-3">
                  {(photoDetails.exif.make || photoDetails.exif.model) && (
                    <span className="inline-flex items-center">
                      <Camera size={16} className="mr-1" />
                      {[photoDetails.exif.make, photoDetails.exif.model].filter(Boolean).join(' ')}
                    </span>
                  )}
                  {photoDetails.exif.focal_length && (
                    <span>{photoDetails.exif.focal_length}mm</span>
                  )}
                  {photoDetails.exif.aperture && (
                    <span>ƒ/{photoDetails.exif.aperture}</span>
                  )}
                  {photoDetails.exif.exposure_time && (
                    <span>{photoDetails.exif.exposure_time}s</span>
                  )}
                  {photoDetails.exif.iso && (
                    <span>ISO {photoDetails.exif.iso}</span>
                  )}
                </div>
              )}

              {/* 位置信息 */}
              {photoDetails?.location && (photoDetails.location.city || photoDetails.location.country) && (
                <div className="flex items-center">
                  <MapPin size={16} className="mr-1" />
                  <span>
                    {[photoDetails.location.city, photoDetails.location.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>

            {/* 时间信息 */}
            <time className="block mt-2 text-sm text-white/80" dateTime={photo.created_at}>
              {format(new Date(photo.created_at), 'yyyy-MM-dd')}
            </time>
          </div>

          {/* 标签 */}
          {/* {photo.tags && photo.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {photo.tags.map(tag => (
                <span 
                  key={tag.title}
                  className="px-2 py-1 text-xs bg-white/10 rounded-full hover:bg-white/20 transition-colors cursor-default"
                >
                  {tag.title}
                </span>
              ))}
            </div>
          )} */}
        </div>

        {/* 切换按钮 */}
        <div 
          className="flex items-center justify-center gap-4"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            className={`
              p-3 rounded-full transition-all duration-200
              ${hasPrev 
                ? 'bg-white/10 hover:bg-white/20 text-white' 
                : 'bg-white/5 text-white/20 cursor-not-allowed'}
            `}
            aria-label="上一张"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext}
            className={`
              p-3 rounded-full transition-all duration-200
              ${hasNext 
                ? 'bg-white/10 hover:bg-white/20 text-white' 
                : 'bg-white/5 text-white/20 cursor-not-allowed'}
            `}
            aria-label="下一张"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
} 