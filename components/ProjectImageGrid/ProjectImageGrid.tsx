"use client";

import { useMemo } from "react";
import Image from "next/image";
import { withBasePath } from "@/lib/utils/paths";
import styles from "./ProjectImageGrid.module.scss";

interface ProjectImageGridProps {
  images: Array<{
    src: string;
    alt: string;
  }>;
  layout?: "mosaic" | "landscape";
  /** Called with the clicked image's index when a thumbnail is opened. */
  onOpenImage: (index: number) => void;
}

export function ProjectImageGrid({ images, layout = "mosaic", onOpenImage }: ProjectImageGridProps) {
  // Pre-compute image sources with base path
  const processedImages = useMemo(() => {
    return images.map((image) => ({
      src: image.src.startsWith("data:") || image.src.startsWith("http")
        ? image.src
        : withBasePath(image.src),
      alt: image.alt,
    }));
  }, [images]);

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.grid} ${layout === "landscape" ? styles.landscape : ""}`.trim()}>
      {processedImages.map((image, index) => {
        // Only apply positional class for items 1–5 (defined in SCSS); others get base gridItem only
        const positionalClass = index < 5 ? styles[`item${index + 1}`] : "";

        return (
          <button
            key={image.src}
            type="button"
            className={`${styles.gridItem} ${positionalClass}`.trim()}
            onClick={() => onOpenImage(index)}
            aria-label={`Open gallery image ${index + 1} of ${processedImages.length}: ${image.alt}`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className={styles.image}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
            />
            <div className={styles.overlay}>
              <div className={styles.icon}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className={styles.overlayLabel}>Open image</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
