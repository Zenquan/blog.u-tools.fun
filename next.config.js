const { withContentlayer } = require('next-contentlayer2');

const needRedirectPostList = [
  'react-code-style-guide',
  'css-in-react',
  'webpack-auto-css-modules',
  'how-to-write-great-react',
  'dva.js-get-started',
  'koa2-get-started',
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      ...needRedirectPostList.map((slug) => ({
        source: `/${slug}`,
        destination: `/post/${slug}`,
        permanent: true,
      })),
      {
        source: '/post/:path*',
        destination: '/blog/:path*',
        permanent: true,
      },
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: [
      'p3-luna.douyinpic.com',
      'p6-luna.douyinpic.com',
      'p9-luna.douyinpic.com',
    ],
  },
};

module.exports = withContentlayer(nextConfig);
