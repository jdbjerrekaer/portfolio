"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { resolveAssetSrc } from "@/lib/utils/paths";
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
      src: resolveAssetSrc(image.src),
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
                <Icon name="search" size={14} />
              </div>
              <span className={styles.overlayLabel}>Open image</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
