/**
 * 格式化数字为紧凑的显示形式
 * @param num 要格式化的数字
 * @returns 格式化后的字符串，如 1.2K, 1M 等
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
    notation: 'compact',
    compactDisplay: 'short'
  }).format(num);
} 