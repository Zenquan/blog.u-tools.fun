import { Metadata } from 'next';
import Link from 'next/link';
import { Lato } from 'next/font/google';
import { allBlogs } from 'contentlayer/generated';
import { notFound } from 'next/navigation';
import { formatDate } from '@/lib/utils/formatDate';

const font = Lato({
  weight: '700',
  subsets: ['latin'],
});

interface Props {
  params: {
    tag: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tag = decodeURIComponent(params.tag);
  return {
    title: `${tag} - 标签 - Zenquan's Blog`,
    description: `标签 ${tag} 下的所有文章`,
  };
}

export async function generateStaticParams() {
  const tags = new Set<string>();
  allBlogs.forEach((blog) => {
    blog.tags?.forEach((tag) => {
      tags.add(tag);
    });
  });
  return Array.from(tags).map((tag) => ({
    tag: encodeURIComponent(tag),
  }));
}

export default async function Page({ params }: Props) {
  const tag = decodeURIComponent(params.tag);
  const blogs = allBlogs
    .filter((blog) => blog.tags?.includes(tag))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (blogs.length === 0) {
    notFound();
  }

  return (
    <>
      <div className="pt-10 pb-6 px-3">
        <h1
          className={`flex flex-col text-3xl text-black leading-normal tracking-wider ${font.className}`}
        >
          标签：{tag}
        </h1>
        <p className="mt-4 text-gray-600 text-sm">
          共 {blogs.length} 篇文章
        </p>
      </div>
      <div className="px-3">
        {blogs.map((blog) => (
          <Link
            key={blog._id}
            href={`/blog/${blog.slug}`}
            className="block py-3 group"
          >
            <article>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <time className="block text-sm text-gray-500">
                    {formatDate(blog.date)}
                  </time>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 group-hover:text-gray-400">
                  {blog.title}
                </h2>
                {blog.description && (
                  <p className="text-gray-600">{blog.description}</p>
                )}
              </div>
            </article>
          </Link>
        ))}
      </div>
    </>
  );
}