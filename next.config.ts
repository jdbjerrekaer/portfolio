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

  // Soft cross-page transitions are handled by components/PageTransition
  // (exit/enter opacity animation) — deliberately NOT the View Transitions
  // API: Chromium drops sticky, backdrop-filtered elements from view-transition
  // snapshots, which made the nav bar blink on every navigation.

  // Required for static export - disable image optimization
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.licdn.com",
      },
    ],
  },

  // Adtraction toolkit icons import SVGs as React components (named ReactComponent export).
  turbopack: {
    rules: {
      "*.svg": { loaders: [{ loader: "@svgr/webpack", options: { exportType: "named" } }], as: "*.js" },
    },
  },

  // SCSS support is built-in with sass package installed
  sassOptions: {
    silenceDeprecations: ["legacy-js-api"],
  },
};

export default nextConfig;
