import { notFound } from 'next/navigation';
import { allBlogs } from 'contentlayer/generated';
import MDX from '@/components/MDX';
import TOC from '@/components/TOC';
import Tag from '@/components/Tag';

export const generateStaticParams = async () => allBlogs.map((item) => ({ slug: item.slug }));

export const generateMetadata = async props => {
  const params = await props.params;
  const blog = allBlogs.find((item) => item.slug === params.slug);
  return {
    title: `${blog.title} - Zenquan's Blog`,
    description: blog.description,
    keywords: blog.tags.join(', '),
  };
};

export default async function Page(props) {
  const params = await props.params;
  const blog = allBlogs.find((item) => item.slug === params.slug);

  if (!blog) {
    return notFound();
  }

  return (
    <div className="relative">
      <div className="flex flex-col items-center px-2 pt-12 pb-8">
        <h1 className="font-medium text-2xl text-center">{blog.title}</h1>
        <p className="mt-2 text-gray-500 text-sm font-mono">{blog.date}</p>
        {blog.tags && blog.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {blog.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col lg:flex-row justify-between gap-8">
        <article className="w-full px-2 prose max-w-none lg:max-w-[720px]">
          <MDX code={blog.body.code} />
        </article>
        <div className="hidden lg:block w-[260px] flex-shrink-0">
          <TOC />
        </div>
      </div>
      <div className="lg:hidden">
        <TOC isMobile />
      </div>
    </div>
  );
}
