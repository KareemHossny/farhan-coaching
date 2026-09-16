import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Progress photos are validated at 5 MB in the server action. Leave a
      // little room for multipart/form-data overhead in the request.
      bodySizeLimit: "6mb",
    },
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
