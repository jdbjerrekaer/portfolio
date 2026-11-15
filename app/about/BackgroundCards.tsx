"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageModal, type GalleryImage } from "@/components/ui";
import { Reveal, stagger } from "@/components/Reveal";
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

export function BackgroundCards() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const count = galleryImages.length;
  const step = (delta: number) =>
    setSelectedIndex((current) => (current === null ? null : (current + delta + count) % count));
  const selectedImage = selectedIndex === null ? null : galleryImages[selectedIndex];

  return (
    <>
      <Reveal className={styles.columns}>
        {backgroundCards.map((card, index) => (
          <div key={card.title} className={`${styles.column} reveal-item`} style={stagger(index)}>
            <h3>{card.title}</h3>
            <ul className={styles.plainList}>
              {card.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        ))}
      </Reveal>

      <Reveal className={styles.prints}>
        <div className={`${styles.subhead} reveal-item`}>
          <h3>Things I have 3D printed</h3>
        </div>
        <ul className={styles.printStrip}>
          {galleryImages.map((image, index) => (
            <li key={image.src} className="reveal-item" style={stagger(index + 1)}>
              <button
                type="button"
                className={styles.print}
                onClick={() => setSelectedIndex(index)}
                aria-label={`Open image: ${image.alt}`}
              >
                <Image
                  src={resolveAssetSrc(image.src)}
                  alt=""
                  fill
                  className={styles.printImage}
                  sizes="(max-width: 640px) 60vw, 20vw"
                />
              </button>
            </li>
          ))}
        </ul>
      </Reveal>

      {selectedImage && (
        <ImageModal
          isOpen
          onClose={() => setSelectedIndex(null)}
          imageSrc={resolveAssetSrc(selectedImage.src)}
          imageAlt={selectedImage.alt}
          description={selectedImage.caption}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
          hasPrev
          hasNext
        />
      )}
    </>
  );
}
