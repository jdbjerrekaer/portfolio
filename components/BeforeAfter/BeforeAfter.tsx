"use client";

import { useState } from "react";
import { ImageModal } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { resolveAssetSrc } from "@/lib/utils/paths";
import styles from "./BeforeAfter.module.scss";

interface BeforeAfterProps {
  before: string;
  after: string;
  beforeAlt: string;
  afterAlt: string;
  /** One sentence on what changed. */
  note?: string;
  /** Portrait phone screenshots stay side by side at every width. */
  variant?: "desktop" | "mobile";
}

export function BeforeAfter({ before, after, beforeAlt, afterAlt, note, variant = "desktop" }: BeforeAfterProps) {
  // Opens in the same lightbox as the rest of the portfolio; arrows flip between before and after.
  const shots = [
    { src: resolveAssetSrc(before), alt: beforeAlt, label: "Before" },
    { src: resolveAssetSrc(after), alt: afterAlt, label: "After" },
  ];
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const selected = openIndex !== null ? shots[openIndex] : null;

  return (
    <div className={`${styles.pair} ${variant === "mobile" ? styles.mobile : ""}`.trim()}>
      <div className={styles.shots}>
        {shots.map((shot, index) => (
          <figure key={shot.label} className={styles.shot}>
            <button
              type="button"
              className={styles.link}
              onClick={() => setOpenIndex(index)}
              aria-label={`Open ${shot.label.toLowerCase()} screenshot: ${shot.alt}`}>
              <img src={shot.src} alt={shot.alt} loading="lazy" decoding="async" className={styles.image} />
              {/* Same hover overlay as ProjectImageGrid, so every case study image reads as openable. */}
              <span className={styles.overlay} aria-hidden="true">
                <span className={styles.icon}>
                  <Icon name="search" size={14} />
                </span>
                <span className={styles.overlayLabel}>Open image</span>
              </span>
            </button>
            <figcaption className={styles.caption}>{shot.label}</figcaption>
          </figure>
        ))}
      </div>
      {note ? <p className={styles.note}>{note}</p> : null}
      {selected && (
        <ImageModal
          isOpen
          onClose={() => setOpenIndex(null)}
          imageSrc={selected.src}
          imageAlt={selected.alt}
          description={`${selected.label}: ${selected.alt}`}
          onNext={() => setOpenIndex(1)}
          onPrev={() => setOpenIndex(0)}
          hasNext={openIndex === 0}
          hasPrev={openIndex === 1}
        />
      )}
    </div>
  );
}
