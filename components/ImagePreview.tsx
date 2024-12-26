'use client';

import { FC, useState } from 'react';
import { X } from 'lucide-react';

interface ImagePreviewProps {
  src: string;
  alt: string;
  onClose: () => void;
}

const ImagePreview: FC<ImagePreviewProps> = ({ src, alt, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors"
        aria-label="关闭预览"
      >
        <X size={24} />
      </button>
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 backdrop-blur-lg bg-white/10 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <img
          src={src}
          alt={alt}
          className="max-w-[90vw] max-h-[90vh] object-contain"
          onClick={(e) => e.stopPropagation()}
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
};

export default ImagePreview; 