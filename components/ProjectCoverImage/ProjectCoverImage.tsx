"use client";

import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { resolveAssetSrc } from "@/lib/utils/paths";
import styles from "./ProjectCoverImage.module.scss";

interface ProjectCoverImageProps {
  src: string;
  alt: string;
  title: string;
  /** Called when the cover is clicked to open it in the shared lightbox. */
  onOpen: () => void;
}

export function ProjectCoverImage({ src, alt, title, onOpen }: ProjectCoverImageProps) {
  const imageSrc = resolveAssetSrc(src);

  return (
    <button
      type="button"
      className={styles.coverImage}
      onClick={onOpen}
      aria-label={`Open full-size cover image for ${title}`}
    >
      <Image
        src={imageSrc}
        alt={alt}
        fill
        priority
        className={styles.image}
        sizes="(max-width: 1200px) 100vw, 1200px"
      />
      <div className={styles.overlay}>
        <div className={styles.icon}>
          <Icon name="search" size={14} />
        </div>
        <span className={styles.overlayLabel}>Open full image</span>
      </div>
    </button>
  );
}
