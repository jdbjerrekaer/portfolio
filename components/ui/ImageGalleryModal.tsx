"use client";

import React, { useEffect, useCallback } from "react";
import { FloatingPortal } from "@floating-ui/react";
import Image from "next/image";
import { withBasePath } from "@/lib/utils/paths";
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
      <div
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
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className={styles.galleryGrid}>
            {images.map((image, index) => {
              const imageSrc = image.src.startsWith("data:") || image.src.startsWith("http")
                ? image.src
                : withBasePath(image.src);

              return (
                <div
                  key={index}
                  className={styles.galleryItem}
                  onClick={() => handleImageClick(image)}
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
        </div>
      </div>
    </FloatingPortal>
  );
}
