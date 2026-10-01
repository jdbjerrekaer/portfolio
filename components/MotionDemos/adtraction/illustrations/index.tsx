// Vendored from @adtraction/ui-illustrations (illustrations.tsx). The lazy() helper is verbatim;
// portfolio edit: only the two illustrations the demos use, served from /public (the portfolio
// build turns *.svg imports into SVGR components, but this helper expects a URL string).
import { resolveAssetSrc } from "@/lib/utils/paths";
import { lazy as _lazy, Suspense } from "react";
import type { ImgHTMLAttributes } from "react";

type ImportFunction = () => Promise<string | { default: string }>;

function lazy(importFn: ImportFunction) {
  type DefaultStringModule = { default: string };
  function isDefaultStringModule(value: unknown): value is DefaultStringModule {
    return (
      typeof value === "object" &&
      value !== null &&
      "default" in (value as Record<string, unknown>) &&
      typeof (value as Record<string, unknown>).default === "string"
    );
  }

  const LazyComponent = _lazy(async () => {
    const m = await importFn();
    const svgUrl = typeof m === "string" ? m : isDefaultStringModule(m) ? m.default : "";
    return {
      default: (props: ImgHTMLAttributes<HTMLImageElement>) => {
        const { width, height, style, className, ...rest } = props;
        // Respect explicit width/height passed via props; inline style wins over CSS classes
        return (
          <img
            src={svgUrl}
            width={width}
            height={height}
            style={{ width, height, ...(style || {}) }}
            className={className}
            {...rest}
          />
        );
      }
    };
  });

  return function WrappedComponent(props: ImgHTMLAttributes<HTMLImageElement>) {
    const { width, height } = props;
    // Reserve exactly the requested space during suspense to avoid reflow/overlap
    const fallbackStyle: React.CSSProperties = {
      display: "inline-block",
      width: width,
      height: height
    };
    return (
      <Suspense fallback={<div style={fallbackStyle} />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Lazy loaded components with built-in Suspense
export const Illustrations = {
  Plugin: lazy(() => Promise.resolve(resolveAssetSrc("/projects/adtraction-motion/illustrations/plugin.svg"))),
  Trassel2: lazy(() => Promise.resolve(resolveAssetSrc("/projects/adtraction-motion/illustrations/trassel-2.svg")))
} as const;
