import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/creatures/:id",
        destination: "/ko/creatures/:id",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
