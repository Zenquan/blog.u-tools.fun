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
      'y.gtimg.cn',
      'images.unsplash.com',
      'plus.unsplash.com',
    ],
  },
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // 优化生产环境构建
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  reactStrictMode: true,
};

module.exports = withContentlayer(nextConfig);
