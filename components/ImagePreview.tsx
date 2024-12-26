'use client';

import { FC } from 'react';
import { X } from 'lucide-react';

interface ImagePreviewProps {
  src: string;
  alt: string;
  onClose: () => void;
}

const ImagePreview: FC<ImagePreviewProps> = ({ src, alt, onClose }) => {
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
      <img
        src={src}
        alt={alt}
        className="max-w-[90vw] max-h-[90vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

export default ImagePreview; 