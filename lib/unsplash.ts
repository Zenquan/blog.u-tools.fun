import { createApi } from 'unsplash-js';

// 创建 Unsplash API 实例
export const unsplash = createApi({
  accessKey: process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || '',
}); 