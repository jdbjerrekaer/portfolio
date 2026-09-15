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
      {processedImages.map((image, index) => (
        <button
          key={image.src}
          type="button"
          className={styles.gridItem}
          onClick={() => onOpenImage(index)}
          aria-label={`Open gallery image ${index + 1} of ${processedImages.length}: ${image.alt}`}
        >
          {/* ponytail: width/height 0 + CSS height:auto keeps each image's own aspect ratio, no size lookup */}
          <Image
            src={image.src}
            alt={image.alt}
            width={0}
            height={0}
            className={styles.image}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className={styles.overlay}>
            <div className={styles.icon}>
              <Icon name="search" size={14} />
            </div>
            <span className={styles.overlayLabel}>Open image</span>
          </div>
        </button>
      ))}
    </div>
  );
}
