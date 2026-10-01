import { useEffect, useRef, useState } from "react";

/**
 * Lazily resolves an image URL when the sentinel enters the viewport (with overscan).
 * Uses a shared cache (Set) to avoid reloading images once fetched.
 */
export function useLazyLogo({ logoUrl, cacheKey, root, overscanPx = 0, cacheRef }) {
  const [imgSrc, setImgSrc] = useState(null);
  const mountRef = useRef(null);

  useEffect(() => {
    if (!logoUrl) return;
    const key = cacheKey || logoUrl;

    // If already cached, set immediately
    if (cacheRef && cacheRef.current && cacheRef.current.has(key)) {
      setImgSrc(logoUrl);
      return;
    }

    // Fallback: if IntersectionObserver not available
    if (typeof window === "undefined" || typeof window.IntersectionObserver === "undefined") {
      setImgSrc(logoUrl);
      if (cacheRef && cacheRef.current) cacheRef.current.add(key);
      return;
    }

    const node = mountRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setImgSrc(logoUrl);
            if (cacheRef && cacheRef.current) cacheRef.current.add(key);
            observer.unobserve(entry.target);
          }
        }
      },
      {
        root: root && root.current ? root.current : root || null,
        rootMargin: `${overscanPx || 0}px 0px`,
        threshold: 0,
      }
    );

    observer.observe(node);
    return () => {
      try {
        observer.disconnect();
      } catch {}
    };
  }, [logoUrl, cacheKey, root, overscanPx, cacheRef]);

  return { imgSrc, mountRef };
}


