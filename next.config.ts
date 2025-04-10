import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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