"use client";

import React, { useEffect, useCallback, useState, useRef } from "react";
import { FloatingPortal, FloatingFocusManager, useFloating } from "@floating-ui/react";
import styles from "./ImageModal.module.scss";

export interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageAlt: string;
  description?: string;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export function ImageModal({
  isOpen,
  onClose,
  imageSrc,
  imageAlt,
  description,
  onNext,
  onPrev,
  hasNext = false,
  hasPrev = false,
}: ImageModalProps): React.ReactElement | null {
  const [isPortrait, setIsPortrait] = useState<boolean>(false);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const minSwipeDistance = 50;

  // Focus management for modal
  const { refs, context } = useFloating({
    open: isOpen,
  });

  // Handle keyboard interactions (Escape + arrow navigation)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Ensure only the image modal handles this Escape press
        e.stopImmediatePropagation();
        onClose();
        return;
      }

      if (e.key === "ArrowRight" && hasNext && onNext) {
        e.preventDefault();
        e.stopImmediatePropagation();
        onNext();
        return;
      }

      if (e.key === "ArrowLeft" && hasPrev && onPrev) {
        e.preventDefault();
        e.stopImmediatePropagation();
        onPrev();
      }
    };

    document.addEventListener("keydown", handleKeyDown, { capture: true });
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
      document.body.style.overflow = "";
    };
  }, [hasNext, hasPrev, isOpen, onClose, onNext, onPrev]);

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

  // Handle touch swipe for mobile navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    
    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0 && hasNext && onNext) {
        // Swiped left - go to next
        onNext();
      } else if (swipeDistance < 0 && hasPrev && onPrev) {
        // Swiped right - go to previous
        onPrev();
      }
    }
    
    // Reset values
    touchStartX.current = 0;
    touchEndX.current = 0;
  }, [hasNext, hasPrev, onNext, onPrev]);

  if (!isOpen) return null;

  return (
    <FloatingPortal>
      <FloatingFocusManager context={context} modal initialFocus={-1}>
        <div
          ref={refs.setFloating}
          className={styles.backdrop}
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-label="Image modal"
        >
          <div 
            className={`${styles.modalContent} ${isPortrait ? styles.portrait : ""}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
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
          {hasPrev && onPrev && (
            <button
              className={`${styles.navButton} ${styles.prevButton}`}
              onClick={onPrev}
              aria-label="View previous image"
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
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          {hasNext && onNext && (
            <button
              className={`${styles.navButton} ${styles.nextButton}`}
              onClick={onNext}
              aria-label="View next image"
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
                  d="M9 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
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
      </FloatingFocusManager>
    </FloatingPortal>
  );
}
