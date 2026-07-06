import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ISR로 렌더링되는 크리처 페이지가 런타임에 아티클 파일을 읽을 수 있도록 포함
  outputFileTracingIncludes: {
    "/[locale]/creatures/[id]": ["./content/articles/**/*"],
  },
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
