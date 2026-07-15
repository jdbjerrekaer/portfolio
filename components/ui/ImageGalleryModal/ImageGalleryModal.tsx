"use client";

import React, { useEffect, useCallback } from "react";
import { FloatingPortal, FloatingFocusManager, useFloating } from "@floating-ui/react";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { resolveAssetSrc } from "@/lib/utils/paths";
import styles from "./ImageGalleryModal.module.scss";

export interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
}

export interface ImageGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: GalleryImage[];
  onSelect: (image: GalleryImage) => void;
}

export function ImageGalleryModal({
  isOpen,
  onClose,
  images,
  onSelect,
}: ImageGalleryModalProps): React.ReactElement | null {
  // Focus management for modal
  const { refs, context } = useFloating({
    open: isOpen,
  });

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleImageClick = (image: GalleryImage) => {
    onSelect(image);
  };

  if (!isOpen) return null;

  return (
    <FloatingPortal>
      <FloatingFocusManager context={context} modal initialFocus={-1}>
        <div
          ref={(node) => {
            refs.setFloating(node);
          }}
          className={styles.backdrop}
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-label="Image gallery"
        >
          <div className={styles.modalContent}>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close gallery"
            type="button"
          >
            <Icon name="x" size={20} />
          </button>
          <div className={styles.galleryGrid}>
            {images.map((image) => {
              const imageSrc = resolveAssetSrc(image.src);

              return (
                <button
                  key={image.src}
                  type="button"
                  className={styles.galleryItem}
                  onClick={() => handleImageClick(image)}
                  aria-label={`View ${image.alt}`}
                >
                  <Image
                    src={imageSrc}
                    alt={image.alt}
                    fill
                    className={styles.galleryImage}
                    sizes="(max-width: 768px) 50vw, 20vw"
                  />
                  <div className={styles.galleryOverlay}>
                    <div className={styles.galleryIcon}>
                      <Icon name="search" size={14} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        </div>
      </FloatingFocusManager>
    </FloatingPortal>
  );
}
