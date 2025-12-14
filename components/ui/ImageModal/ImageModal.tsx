"use client";

import React, { useEffect, useCallback, useState } from "react";
import { FloatingPortal } from "@floating-ui/react";
import styles from "./ImageModal.module.scss";

export interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageAlt: string;
  description?: string;
}

export function ImageModal({
  isOpen,
  onClose,
  imageSrc,
  imageAlt,
  description,
}: ImageModalProps): React.ReactElement | null {
  const [isPortrait, setIsPortrait] = useState<boolean>(false);
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

  // Detect portrait orientation by loading image and checking dimensions
  useEffect(() => {
    if (!isOpen || !imageSrc) {
      setIsPortrait(false);
      return;
    }

    const img = new Image();
    img.onload = () => {
      // Portrait: height > width
      setIsPortrait(img.naturalHeight > img.naturalWidth);
    };
    img.onerror = () => {
      setIsPortrait(false);
    };
    img.src = imageSrc;
  }, [isOpen, imageSrc]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <FloatingPortal>
      <div
        className={styles.backdrop}
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-label="Image modal"
      >
        <div className={`${styles.modalContent} ${isPortrait ? styles.portrait : ""}`}>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
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
          <div className={styles.imageWrapper}>
            <img
              src={imageSrc}
              alt={imageAlt}
              className={styles.image}
              draggable={false}
            />
          </div>
          {description && (
            <div className={styles.caption}>
              {description}
            </div>
          )}
        </div>
      </div>
    </FloatingPortal>
  );
}
