"use client";

import { useState } from "react";
import Image from "next/image";
import { SFSymbol } from "@/components/ui/SFSymbol";
import { ImageModal, ImageGalleryModal, type GalleryImage } from "@/components/ui";
import { withBasePath } from "@/lib/utils/paths";
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

  const getImageSrc = (image: GalleryImage) => {
    if (image.src.startsWith("data:") || image.src.startsWith("http")) {
      return image.src;
    }

    return withBasePath(image.src);
  };

  const openImageAtIndex = (index: number) => {
    if (!galleryImages.length) return;
    const normalizedIndex = ((index % galleryImages.length) + galleryImages.length) % galleryImages.length;
    setSelectedIndex(normalizedIndex);
  };

  const handleImageClick = (image: typeof displayedImages[0]) => {
    const index = galleryImages.findIndex((img) => img.src === image.src);
    openImageAtIndex(index === -1 ? 0 : index);
  };

  const handleModalClose = () => {
    setSelectedIndex(null);
  };

  const handleGalleryOpen = () => {
    setIsGalleryOpen(true);
  };

  const handleGalleryClose = () => {
    setIsGalleryOpen(false);
  };

  const handleGallerySelect = (image: GalleryImage) => {
    const index = galleryImages.findIndex((img) => img.src === image.src);
    openImageAtIndex(index === -1 ? 0 : index);
  };

  const handlePrevious = () => {
    setSelectedIndex((current) => {
      if (current === null) return null;
      return (current - 1 + galleryImages.length) % galleryImages.length;
    });
  };

  const handleNext = () => {
    setSelectedIndex((current) => {
      if (current === null) return null;
      return (current + 1) % galleryImages.length;
    });
  };

  const selectedImage = selectedIndex !== null ? galleryImages[selectedIndex] : null;
  const selectedImageSrc = selectedImage ? getImageSrc(selectedImage) : "";
  const canNavigate = galleryImages.length > 1;
  const moreImagesCount = galleryImages.length - displayedImages.length;

  return (
    <>
      <ul className={styles.approachList}>
        <li>
          <div className={styles.approachItem}>
            <SFSymbol name="book" size={24} weight="medium" filled={false} className={styles.approachIcon} />
            <div className={styles.approachContent}>
              <strong>Education</strong>
              <ul className={styles.approachSubList}>
                <li>BSc in Technical Interaction Design</li>
                <li>Aarhus University, graduated 2021</li>
                <li>HCI, UX, and interaction design</li>
              </ul>
            </div>
          </div>
        </li>
        <li>
          <div className={styles.approachItem}>
            <SFSymbol name="sparkles" size={24} weight="medium" filled={false} className={styles.approachIcon} />
            <div className={styles.approachContent}>
              <strong>What drives me</strong>
              <ul className={styles.approachSubList}>
                <li>Building coherent, scalable interfaces</li>
                <li>Balancing user needs with business goals</li>
                <li>Validating experiences through research</li>
              </ul>
            </div>
          </div>
        </li>
        <li>
          <div className={styles.approachItem}>
            <SFSymbol name="heart" size={24} weight="medium" filled={false} className={styles.approachIcon} />
            <div className={styles.approachContent}>
              <strong>Beyond work</strong>
              <ul className={styles.approachSubList}>
                <li>3D printing side projects</li>
                <li>Bareknuckle full contact karate</li>
                <li>Staying curious about tech trends</li>
                <li>Hanging out with friends (movies, eating out)</li>
                <li>Playing paddle tennis</li>
                <li>Date nights with my girlfriend</li>
              </ul>
            </div>
          </div>
        </li>
        <li>
          <div className={styles.approachItem}>
            <SFSymbol name="images" size={24} weight="medium" filled={false} className={styles.approachIcon} />
            <div className={styles.approachContent}>
              <strong>Personal interests</strong>
              <div className={styles.personalImagesGrid}>
                {displayedImages.map((image, index) => {
                  const imageSrc = image.src.startsWith("data:") || image.src.startsWith("http")
                    ? image.src
                    : withBasePath(image.src);
                  
                  return (
                    <div
                      key={index}
                      className={styles.personalImageItem}
                      onClick={() => handleImageClick(image)}
                    >
                      <Image
                        src={imageSrc}
                        alt={image.alt}
                        fill
                        className={styles.personalImage}
                        sizes="(max-width: 768px) 50vw, 50vw"
                      />
                      <div className={styles.personalImageOverlay}>
                        <div className={styles.personalImageIcon}>
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
                {/* More images tile */}
                <div
                  className={`${styles.personalImageItem} ${styles.personalMoreTile}`}
                  onClick={handleGalleryOpen}
                >
                  <div className={styles.personalMorePreviewGrid}>
                    {galleryImages.slice(displayedImages.length, displayedImages.length + 4).map((image, index) => {
                      const imageSrc = image.src.startsWith("data:") || image.src.startsWith("http")
                        ? image.src
                        : withBasePath(image.src);
                      
                      return (
                        <div key={index} className={styles.personalMorePreviewItem}>
                          <Image
                            src={imageSrc}
                            alt={image.alt}
                            fill
                            className={styles.personalMorePreviewImage}
                            sizes="(max-width: 768px) 25vw, 12.5vw"
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className={styles.personalMoreOverlay}>
                    <span className={styles.personalMoreLabel}>+{moreImagesCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </li>
      </ul>
      {selectedImage && (
        <ImageModal
          isOpen={!!selectedImage}
          onClose={handleModalClose}
          imageSrc={selectedImageSrc}
          imageAlt={selectedImage.alt}
          description={selectedImage.caption}
          onPrev={canNavigate ? handlePrevious : undefined}
          onNext={canNavigate ? handleNext : undefined}
          hasPrev={canNavigate}
          hasNext={canNavigate}
        />
      )}
      <ImageGalleryModal
        isOpen={isGalleryOpen}
        onClose={handleGalleryClose}
        images={galleryImages}
        onSelect={handleGallerySelect}
      />
    </>
  );
}
