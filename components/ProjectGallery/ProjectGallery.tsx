"use client";

import { useCallback, useMemo, useState } from "react";
import { ImageModal } from "@/components/ui";
import { resolveAssetSrc } from "@/lib/utils/paths";
import { ProjectCoverImage } from "@/components/ProjectCoverImage";
import { ProjectImageGrid } from "@/components/ProjectImageGrid";

interface GalleryImage {
  src: string;
  alt: string;
}

interface ProjectGalleryProps {
  cover?: {
    src: string;
    alt: string;
    title: string;
  };
  images?: GalleryImage[];
  layout?: "mosaic" | "landscape";
}

/**
 * Owns a single lightbox for the whole case study so arrow keys / swipe
 * navigate across the cover image and all gallery images as one set.
 */
export function ProjectGallery({ cover, images = [], layout = "mosaic" }: ProjectGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Combined ordered set: cover first (when present), then gallery images.
  const lightboxImages = useMemo(() => {
    const combined: GalleryImage[] = [];
    if (cover) combined.push({ src: cover.src, alt: cover.alt });
    combined.push(...images);
    return combined.map((image) => ({ src: resolveAssetSrc(image.src), alt: image.alt }));
  }, [cover, images]);

  const coverOffset = cover ? 1 : 0;

  const close = useCallback(() => setOpenIndex(null), []);
  const next = useCallback(
    () =>
      setOpenIndex((i) =>
        i !== null && i < lightboxImages.length - 1 ? i + 1 : i
      ),
    [lightboxImages.length]
  );
  const prev = useCallback(
    () => setOpenIndex((i) => (i !== null && i > 0 ? i - 1 : i)),
    []
  );

  const selected = openIndex !== null ? lightboxImages[openIndex] : null;
  const hasNext = openIndex !== null && openIndex < lightboxImages.length - 1;
  const hasPrev = openIndex !== null && openIndex > 0;

  return (
    <>
      {cover && (
        <ProjectCoverImage
          src={cover.src}
          alt={cover.alt}
          title={cover.title}
          onOpen={() => setOpenIndex(0)}
        />
      )}
      {images.length > 0 && (
        <ProjectImageGrid
          images={images}
          layout={layout}
          onOpenImage={(index) => setOpenIndex(coverOffset + index)}
        />
      )}
      {selected && (
        <ImageModal
          isOpen={!!selected}
          onClose={close}
          imageSrc={selected.src}
          imageAlt={selected.alt}
          description={selected.alt}
          onNext={next}
          onPrev={prev}
          hasNext={hasNext}
          hasPrev={hasPrev}
        />
      )}
    </>
  );
}
