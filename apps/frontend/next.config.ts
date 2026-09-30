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
    ];
  },
};

export default nextConfig;
