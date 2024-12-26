export default function CollectionSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-lg shadow-md bg-gray-100 animate-pulse">
      <div className="relative aspect-[3/2]">
        <div className="absolute inset-0 grid grid-cols-2 gap-0.5">
          <div className="relative bg-gray-200" />
          <div className="grid grid-rows-2 gap-0.5">
            <div className="relative bg-gray-200" />
            <div className="relative bg-gray-200" />
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-gray-200/60 via-gray-200/40 to-transparent">
        <div className="h-6 w-2/3 bg-gray-300 rounded mb-2" />
        <div className="flex gap-2 mb-2">
          <div className="h-4 w-16 bg-gray-300 rounded" />
          <div className="h-4 w-16 bg-gray-300 rounded" />
          <div className="h-4 w-16 bg-gray-300 rounded" />
        </div>
        <div className="flex justify-between">
          <div className="h-4 w-20 bg-gray-300 rounded" />
          <div className="h-4 w-24 bg-gray-300 rounded" />
        </div>
      </div>
      <div className="mt-2">
        <div className="h-4 w-full bg-gray-200 rounded" />
      </div>
    </div>
  );
} 