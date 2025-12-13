import type { NextConfig } from "next";

const basePath = process.env.BASE_PATH || "";

const nextConfig: NextConfig = {
  // Static export for GitLab Pages
  output: "export",

  // Trailing slashes for proper static hosting (creates folder/index.html structure)
  trailingSlash: true,

  // Base path for GitLab Pages (empty for local dev, /<project> for Pages)
  basePath: basePath,
  assetPrefix: basePath,

  // Required for static export - disable image optimization
  images: {
    unoptimized: true,
  },

  // SCSS support is built-in with sass package installed
  sassOptions: {
    silenceDeprecations: ["legacy-js-api"],
  },
};

export default nextConfig;
