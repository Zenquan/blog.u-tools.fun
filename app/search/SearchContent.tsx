'use client';

import { useSearchParams } from 'next/navigation';
import Search from '@/components/Search';
import Tag from '@/components/Tag';
import List from '@/components/List';

interface Post {
  title: string;
  date: string;
  description: string;
  type: string;
  url: string;
  slug: string;
  tags?: string[];
  body?: {
    raw: string;
  };
}

interface SearchContentProps {
  allBlogs: any[];
  allWeeklies: any[];
}

export default function SearchContent({ allBlogs, allWeeklies }: SearchContentProps) {
  const searchParams = useSearchParams();
  const keyword = searchParams.get('q') || '';
  const tag = searchParams.get('tag') || '';

  // 合并博客和周刊数据
  const allPosts: Post[] = [
    ...allBlogs.map(post => ({ ...post, type: '博客' })),
    ...allWeeklies.map(post => ({ ...post, type: '周刊' })),
  ].sort((a, b) => (a.date > b.date ? -1 : 1));

  // 获取所有标签及其文章数量
  const tagCounts = new Map<string, number>();
  allBlogs.forEach((blog) => {
    blog.tags?.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  // 转换为数组并按文章数量排序
  const allTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }));

  // 搜索逻辑
  const searchResults = allPosts.filter(post => {
    // 如果有标签过滤，先检查标签
    if (tag && (!post.tags || !post.tags.includes(tag))) {
      return false;
    }

    // 如果没有关键词，只按标签过滤
    if (!keyword) {
      return true;
    }

    const searchTerm = keyword.toLowerCase().trim();
    const searchTerms = searchTerm.split(/\s+/).filter(Boolean);

    // 如果没有有效的搜索词，返回所有结果
    if (searchTerms.length === 0) {
      return true;
    }

    // 检查标题、描述、类型和标签
    const titleMatch = searchTerms.every(term => 
      post.title.toLowerCase().includes(term)
    );
    const descriptionMatch = post.description && searchTerms.every(term => 
      post.description.toLowerCase().includes(term)
    );
    const typeMatch = searchTerms.every(term => 
      post.type.toLowerCase().includes(term)
    );
    const tagsMatch = post.tags && searchTerms.every(term =>
      post.tags.some(tag => tag.toLowerCase().includes(term))
    );
    const contentMatch = post.body && searchTerms.every(term =>
      post.body.raw.toLowerCase().includes(term)
    );

    return titleMatch || descriptionMatch || typeMatch || tagsMatch || contentMatch;
  });

  return (
    <>
      <div className="mt-6">
        <Search />
      </div>
      {!keyword && !tag && allTags.length > 0 && (
        <div className="mt-4">
          <h2 className="text-sm font-medium text-gray-900 mb-2">热门标签</h2>
          <div className="flex flex-wrap gap-2">
            {allTags.map(({ tag, count }) => (
              <Tag key={tag} className="flex items-center gap-1">
                {tag}
                <span className="text-gray-400">({count})</span>
              </Tag>
            ))}
          </div>
        </div>
      )}
      <div className="mt-4 text-sm text-gray-500">
        {keyword || tag ? (
          <p>
            找到 {searchResults.length} 篇
            {tag && <span>标签为 &quot;{tag}&quot; </span>}
            {keyword && tag && <span>且</span>}
            {keyword && <span>包含 &quot;{keyword}&quot; </span>}
            的文章
          </p>
        ) : (
          <p>共 {searchResults.length} 篇文章</p>
        )}
      </div>
      <div className="mt-6">
        <List
          data={searchResults.map(post => ({
            ...post,
            title: `${post.title} · ${post.type}`,
          }))}
        />
      </div>
    </>
  );
}
