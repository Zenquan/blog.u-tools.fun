'use client';

import { FC, useState, useEffect, TouchEvent } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImagePreviewProps {
  src: string;
  alt: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

const ImagePreview: FC<ImagePreviewProps> = ({
  src,
  alt,
  onClose,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}) => {
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
  const handleTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
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
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors"
        aria-label="关闭预览"
      >
        <X size={24} />
      </button>

      <div className="relative flex flex-col items-center gap-4">
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 backdrop-blur-lg bg-white/10 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <img
            src={src}
            alt={alt}
            className="max-w-[90vw] max-h-[80vh] object-contain"
            onClick={(e) => e.stopPropagation()}
            onLoad={() => setIsLoading(false)}
          />
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
};

export default ImagePreview; 