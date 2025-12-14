"use client";

import { useState } from "react";
import Image from "next/image";
import { SFSymbol } from "@/components/ui/SFSymbol";
import { ImageModal, ImageGalleryModal, type GalleryImage } from "@/components/ui";
import { withBasePath } from "@/lib/utils/paths";
import styles from "./page.module.scss";

const displayedImages = [
  {
    src: "/images/personal/3d-printing-1.jpg",
    alt: "3D printing project",
    caption: "3D printing project",
  },
  {
    src: "/images/personal/karate-1.jpg",
    alt: "Karate training",
    caption: "Karate training",
  },
  {
    src: "/images/personal/bouldering-1.jpg",
    alt: "Bouldering session",
    caption: "Bouldering session",
  },
];

const galleryImages: GalleryImage[] = [
  {
    src: "/images/personal/3d-printing-1.jpg",
    alt: "3D printing project",
    caption: "3D printing project",
  },
  {
    src: "/images/personal/karate-1.jpg",
    alt: "Karate training",
    caption: "Karate training",
  },
  {
    src: "/images/personal/bouldering-1.jpg",
    alt: "Bouldering session",
    caption: "Bouldering session",
  },
  {
    src: "/images/personal/gallery-01.jpg",
    alt: "Personal interest",
    caption: "Personal interest",
  },
  {
    src: "/images/personal/gallery-02.jpg",
    alt: "Personal interest",
    caption: "Personal interest",
  },
  {
    src: "/images/personal/gallery-03.jpg",
    alt: "Personal interest",
    caption: "Personal interest",
  },
  {
    src: "/images/personal/gallery-04.jpg",
    alt: "Personal interest",
    caption: "Personal interest",
  },
  {
    src: "/images/personal/gallery-05.jpg",
    alt: "Personal interest",
    caption: "Personal interest",
  },
  {
    src: "/images/personal/gallery-06.jpg",
    alt: "Personal interest",
    caption: "Personal interest",
  },
  {
    src: "/images/personal/gallery-07.jpg",
    alt: "Personal interest",
    caption: "Personal interest",
  },
  {
    src: "/images/personal/gallery-08.jpg",
    alt: "Personal interest",
    caption: "Personal interest",
  },
  {
    src: "/images/personal/gallery-09.jpg",
    alt: "Personal interest",
    caption: "Personal interest",
  },
];

export function BackgroundCards() {
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string; caption?: string } | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const handleImageClick = (image: typeof displayedImages[0]) => {
    const imageSrc = image.src.startsWith("data:") || image.src.startsWith("http")
      ? image.src
      : withBasePath(image.src);
    setSelectedImage({ src: imageSrc, alt: image.alt, caption: image.caption });
  };

  const handleModalClose = () => {
    setSelectedImage(null);
  };

  const handleGalleryOpen = () => {
    setIsGalleryOpen(true);
  };

  const handleGalleryClose = () => {
    setIsGalleryOpen(false);
  };

  const handleGallerySelect = (image: GalleryImage) => {
    const imageSrc = image.src.startsWith("data:") || image.src.startsWith("http")
      ? image.src
      : withBasePath(image.src);
    setSelectedImage({ src: imageSrc, alt: image.alt, caption: image.caption });
  };

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
          imageSrc={selectedImage.src}
          imageAlt={selectedImage.alt}
          description={selectedImage.caption}
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
