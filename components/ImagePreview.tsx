'use client';

import { useEffect, useRef } from 'react';
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
  const { loading, photoDetails, photoStats } = usePhotoDetails(photo.id);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && hasPrev && onPrev) {
        onPrev();
      } else if (e.key === 'ArrowRight' && hasNext && onNext) {
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={(e) => {
        if (e.target === containerRef.current) {
          onClose();
        }
      }}
    >
      <button
        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors"
        onClick={onClose}
      >
        <X size={24} />
      </button>

      {hasPrev && onPrev && (
        <button
          className="absolute left-4 p-2 text-white/80 hover:text-white transition-colors"
          onClick={onPrev}
        >
          <ChevronLeft size={32} />
        </button>
      )}

      {hasNext && onNext && (
        <button
          className="absolute right-4 p-2 text-white/80 hover:text-white transition-colors"
          onClick={onNext}
        >
          <ChevronRight size={32} />
        </button>
      )}

      <div className="relative max-w-[90vw] max-h-[90vh]">
        <div className="relative">
          <Image
            src={src}
            alt={alt}
            width={1200}
            height={800}
            className="max-h-[90vh] w-auto object-contain"
            priority
          />
          
          {/* 照片信息 */}
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 via-black/40 to-transparent">
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
                      {formatNumber(photoStats.likes.total)}
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
          className="flex items-center gap-4"
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