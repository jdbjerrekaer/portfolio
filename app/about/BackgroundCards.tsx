"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Icon,
  ImageGalleryModal,
  ImageModal,
  InfoCard,
  InfoCardGrid,
  type GalleryImage,
} from "@/components/ui";
import { resolveAssetSrc } from "@/lib/utils/paths";
import { backgroundCards } from "./aboutData";
import styles from "./page.module.scss";

const galleryImages: GalleryImage[] = [
  {
    src: "/images/personal/cutting-board-holder.png",
    alt: "3D printed wall-mounted cutting board holder",
    caption: "3D printed wall-mounted cutting board holder",
  },
  {
    src: "/images/personal/water-bottle-drying-stand.png",
    alt: "3D printed water bottle drying stand",
    caption: "3D printed water bottle drying stand",
  },
  {
    src: "/images/personal/battery-organizers.png",
    alt: "3D printed battery organizers for AAA and AA batteries",
    caption: "3D printed battery organizers for AAA and AA batteries",
  },
  {
    src: "/images/personal/scrub-daddy-holder.png",
    alt: "3D printed Scrub Daddy holder",
    caption: "3D printed Scrub Daddy holder",
  },
  {
    src: "/images/personal/sunglasses-holders-display.png",
    alt: "3D printed sunglasses holders and personal collection display",
    caption: "3D printed sunglasses holders and personal collection display",
  },
];

const displayedImages = galleryImages.slice(0, 3);

export function BackgroundCards() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const openImageAtIndex = (index: number) => {
    const normalizedIndex = ((index % galleryImages.length) + galleryImages.length) % galleryImages.length;
    setSelectedIndex(normalizedIndex);
  };

  const handleImageClick = (image: GalleryImage) => {
    const index = galleryImages.findIndex((item) => item.src === image.src);
    openImageAtIndex(index === -1 ? 0 : index);
  };

  const handleGallerySelect = (image: GalleryImage) => {
    setIsGalleryOpen(false);
    handleImageClick(image);
  };

  const handlePrevious = () => {
    setSelectedIndex((current) => current === null
      ? null
      : (current - 1 + galleryImages.length) % galleryImages.length);
  };

  const handleNext = () => {
    setSelectedIndex((current) => current === null
      ? null
      : (current + 1) % galleryImages.length);
  };

  const selectedImage = selectedIndex === null ? null : galleryImages[selectedIndex];
  const moreImagesCount = galleryImages.length - displayedImages.length;

  return (
    <>
      <InfoCardGrid>
        {backgroundCards.map((card) => (
          <InfoCard key={card.title} title={card.title} icon={card.icon}>
            <ul>{card.items.map((item) => <li key={item}>{item}</li>)}</ul>
          </InfoCard>
        ))}
        <InfoCard title="Personal interests" icon="images" variant="media">
          <div className={styles.personalImagesGrid}>
            {displayedImages.map((image) => (
              <button
                key={image.src}
                type="button"
                className={styles.personalImageItem}
                onClick={() => handleImageClick(image)}
                aria-label={`Open image: ${image.alt}`}
              >
                <Image
                  src={resolveAssetSrc(image.src)}
                  alt={image.alt}
                  fill
                  className={styles.personalImage}
                  sizes="(max-width: 768px) 50vw, 20vw"
                />
                <span className={styles.personalImageOverlay} aria-hidden="true">
                  <span className={styles.personalImageIcon}><Icon name="search" size={14} /></span>
                </span>
              </button>
            ))}
            <button
              type="button"
              className={`${styles.personalImageItem} ${styles.personalMoreTile}`}
              onClick={() => setIsGalleryOpen(true)}
              aria-label={`Open gallery with ${moreImagesCount} more images`}
            >
              <span className={styles.personalMorePreviewGrid} aria-hidden="true">
                {galleryImages.slice(displayedImages.length, displayedImages.length + 4).map((image) => (
                  <span key={image.src} className={styles.personalMorePreviewItem}>
                    <Image
                      src={resolveAssetSrc(image.src)}
                      alt=""
                      fill
                      className={styles.personalMorePreviewImage}
                      sizes="(max-width: 768px) 25vw, 10vw"
                    />
                  </span>
                ))}
              </span>
              <span className={styles.personalMoreOverlay}>
                <span className={styles.personalMoreLabel}>+{moreImagesCount}</span>
              </span>
            </button>
          </div>
        </InfoCard>
      </InfoCardGrid>

      {selectedImage && (
        <ImageModal
          isOpen
          onClose={() => setSelectedIndex(null)}
          imageSrc={resolveAssetSrc(selectedImage.src)}
          imageAlt={selectedImage.alt}
          description={selectedImage.caption}
          onPrev={galleryImages.length > 1 ? handlePrevious : undefined}
          onNext={galleryImages.length > 1 ? handleNext : undefined}
          hasPrev={galleryImages.length > 1}
          hasNext={galleryImages.length > 1}
        />
      )}
      <ImageGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        images={galleryImages}
        onSelect={handleGallerySelect}
      />
    </>
  );
}
