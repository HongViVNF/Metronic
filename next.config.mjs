// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   // For local development, basePath is '/'
//   // This file will be overwritten during deployment with the appropriate basePath
//   images: {},
//   output: 'standalone',
// };

// export default nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  // For local development, basePath is '/'
  // This file will be overwritten during deployment with the appropriate basePath
  reactStrictMode: true,
  output: 'standalone',
  
  // Rewrites for routing API and frontend paths
  async rewrites() {
    return [
      // Academy API routes - phải đứng trước để ưu tiên
      {
        source: '/academy/api/:path*',
        destination: '/academy/backend/api/:path*',
      },
      {
        source: '/hiring-management/api/:path*',
        destination: '/hiring-management/backend/api/:path*',
      },
      // Academy frontend routes
      {
        source: '/academy/courses/:path*',
        destination: '/academy/frontend/courses/:path*',
      },
      {
        source: '/academy/students/:path*',
        destination: '/academy/frontend/students/:path*',
      },
      {
        source: '/academy/instructors/:path*',
        destination: '/academy/frontend/instructors/:path*',
      },
      {
        source: '/academy/settings/:path*',
        destination: '/academy/frontend/settings/:path*',
      },
      
      // Hiring Management API routes - phải đứng trước để ưu tiên
      {
        source: '/hiring-management/api/:path*',
        destination: '/hiring-management/backend/api/:path*',
      },
      // Hiring Management frontend routes
      {
        source: '/hiring-management/candidate/:path*',
        destination: '/hiring-management/frontend/candidate/:path*',
      },
      {
        source: '/hiring-management/hiring/:path*',
        destination: '/hiring-management/frontend/hiring/:path*',
      },
      {
        source: '/hiring-management/job/:path*',
        destination: '/hiring-management/frontend/job/:path*',
      },
      {
        source: '/hiring-management/pipeline/:path*',
        destination: '/hiring-management/frontend/pipeline/:path*',
      },
      {
        source: '/hiring-management/interviews/:path*',
        destination: '/hiring-management/frontend/interview/:path*',
      },
      {
        source: '/hiring-management/jobcandidates/:path*',
        destination: '/hiring-management/frontend/candidate/:path*',
      },
      {
        source: '/hiring-management/templates/:path*',
        destination: '/hiring-management/frontend/emailtemplate/:path*',
      },
    ];
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('ffmpeg-static');
    }
    if (!isServer) {
      // Ignore critical dependency warnings for fluent-ffmpeg
      config.module.rules.push({
        test: /fluent-ffmpeg/,
        use: 'null-loader',
      });
    }
    return config;
  },
};

export default nextConfig;
