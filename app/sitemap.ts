import { MetadataRoute } from 'next';
import { compareDesc } from 'date-fns';
import { allBlogs, allWeeklies } from 'contentlayer/generated';

export default function sitemap(): MetadataRoute.Sitemap {
  const allPost = [...allBlogs, ...allWeeklies]
    .sort((a, b) => compareDesc(new Date(a.date), new Date(b.date)))
    .map((item) => ({
      url: `https://blog.u-tools.fun${item.url}`,
      lastModified: new Date(),
    }));

  return [
    {
      url: 'https://blog.u-tools.fun',
      lastModified: new Date(),
    },
    ...allPost,
  ];
}
