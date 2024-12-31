interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  queryParams?: Record<string, string>;
}

export default function Pagination({ 
  currentPage, 
  totalPages, 
  basePath,
  queryParams = {} 
}: PaginationProps) {
  // 生成页码数组
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5; // 最多显示的页码数
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // 调整起始页码
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  // 构建带查询参数的URL
  const buildUrl = (page: number) => {
    const params = new URLSearchParams({ ...queryParams, page: String(page) });
    return `${basePath}?${params.toString()}`;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-2 py-8">
      {currentPage > 1 && (
        <a
          href={buildUrl(currentPage - 1)}
          className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          上一页
        </a>
      )}
      
      {/* 第一页 */}
      {getPageNumbers()[0] > 1 && (
        <>
          <a
            href={buildUrl(1)}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            1
          </a>
          {getPageNumbers()[0] > 2 && (
            <span className="text-gray-600">...</span>
          )}
        </>
      )}
      
      {/* 页码按钮 */}
      {getPageNumbers().map(number => (
        <a
          key={number}
          href={buildUrl(number)}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${
            number === currentPage
              ? 'bg-gray-800 text-white'
              : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
          }`}
        >
          {number}
        </a>
      ))}
      
      {/* 最后一页 */}
      {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
        <>
          {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
            <span className="text-gray-600">...</span>
          )}
          <a
            href={buildUrl(totalPages)}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {totalPages}
          </a>
        </>
      )}
      
      {currentPage < totalPages && (
        <a
          href={buildUrl(currentPage + 1)}
          className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          下一页
        </a>
      )}
    </div>
  );
} 