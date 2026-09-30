import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  async redirects() {
    return [
      // The regex keeps every other one-segment path — /robots.txt, /favicon.ico — from
      // being rewritten into a lookup.
      {
        source: "/:cnpj([0-9A-Za-z]{14})",
        destination: "/cnpj/:cnpj",
        permanent: true,
      },
      // Anchored, because the host is matched as an unanchored regex.
      {
        source: "/:path*",
        has: [{ type: "host", value: "^www\\.fichapj\\.com\\.br$" }],
        destination: "https://fichapj.com.br/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
