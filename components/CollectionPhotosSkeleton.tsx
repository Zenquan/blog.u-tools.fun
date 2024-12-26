export default function CollectionPhotosSkeleton() {
  return (
    <div className="space-y-8">
      {/* 图片网格骨架屏 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="aspect-[3/2] bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-4 w-2/3 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-3 w-1/3 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
} 