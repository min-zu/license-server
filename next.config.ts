import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "export",
  typescript: {
    ignoreBuildErrors: true, // 타입스크립트 빌드 오류 무시
  },
  /* config options here */
  // async redirects() {
  //   return [
  //     {
  //       source: "/",
  //       destination: "/login",
  //       permanent: true,
  //     }
  //   ]
  // }

  async rewrites() {
    return [
      {
        source: "/ituindex.php",
        destination: "/api/ituindex",
      },
      {
        source: "/demoindex.php",
        destination: "/api/demoindex",
      }
    ]
  }
};

export default nextConfig;