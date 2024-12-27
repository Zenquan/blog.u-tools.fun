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
  swcMinify: false,
  compiler: {
    removeConsole: false,
  },
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  reactStrictMode: true,
  webpack: (config, { dev, isServer }) => {
    if (!isServer) {
      config.devtool = dev ? 'eval-source-map' : 'source-map';
      
      config.module.rules.push({
        test: /mermaid/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-transform-runtime'],
            sourceType: 'unambiguous'
          }
        }
      });

      config.optimization = {
        ...config.optimization,
        minimize: dev ? false : true,
        minimizer: config.optimization.minimizer.map(minimizer => {
          if (minimizer.constructor.name === 'TerserPlugin') {
            return {
              ...minimizer,
              options: {
                ...minimizer.options,
                exclude: /mermaid/,
                terserOptions: {
                  ...minimizer.options.terserOptions,
                  mangle: false,
                  compress: {
                    ...minimizer.options.terserOptions?.compress,
                    defaults: false,
                    dead_code: true,
                    unused: true,
                  },
                  output: {
                    ...minimizer.options.terserOptions?.output,
                    beautify: true,
                  },
                },
              },
            };
          }
          return minimizer;
        }),
      };
    }
    return config;
  },
};

module.exports = withContentlayer(nextConfig);
