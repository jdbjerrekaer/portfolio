"use client";

import { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { ImageModal } from "@/components/ui";
import { withBasePath } from "@/lib/utils/paths";
import styles from "./ProjectImageGrid.module.scss";

interface ProjectImageGridProps {
  images: Array<{
    src: string;
    alt: string;
  }>;
}

export function ProjectImageGrid({ images }: ProjectImageGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Pre-compute image sources with base path
  const processedImages = useMemo(() => {
    return images.map((image) => ({
      src: image.src.startsWith("data:") || image.src.startsWith("http")
        ? image.src
        : withBasePath(image.src),
      alt: image.alt,
    }));
  }, [images]);

  const handleImageClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleModalClose = () => {
    setSelectedIndex(null);
  };

  const handleNext = useCallback(() => {
    if (selectedIndex !== null && selectedIndex < processedImages.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  }, [selectedIndex, processedImages.length]);

  const handlePrev = useCallback(() => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  }, [selectedIndex]);

  if (!images || images.length === 0) {
    return null;
  }

  const selectedImage = selectedIndex !== null ? processedImages[selectedIndex] : null;
  const hasNext = selectedIndex !== null && selectedIndex < processedImages.length - 1;
  const hasPrev = selectedIndex !== null && selectedIndex > 0;

  return (
    <>
      <div className={styles.grid}>
        {processedImages.map((image, index) => {
          // Only apply positional class for items 1–5 (defined in SCSS); others get base gridItem only
          const positionalClass = index < 5 ? styles[`item${index + 1}`] : "";
          
          return (
            <div
              key={index}
              className={`${styles.gridItem} ${positionalClass}`.trim()}
              onClick={() => handleImageClick(index)}
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
            </div>
          </div>
          );
        })}
      </div>
      {selectedImage && (
        <ImageModal
          isOpen={!!selectedImage}
          onClose={handleModalClose}
          imageSrc={selectedImage.src}
          imageAlt={selectedImage.alt}
          description={selectedImage.alt}
          onNext={handleNext}
          onPrev={handlePrev}
          hasNext={hasNext}
          hasPrev={hasPrev}
        />
      )}
    </>
  );
}
