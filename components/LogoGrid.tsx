"use client";

import { useState } from "react";
import Image from "next/image";
import type { ClientLogo } from "@/lib/content/clientLogos";
import styles from "./LogoGrid.module.scss";

interface LogoGridProps {
  logos: ClientLogo[];
  title?: string;
  description?: string;
  maxVisible?: number;
  showExpand?: boolean;
  className?: string;
}

export function LogoGrid({
  logos,
  title,
  description,
  maxVisible = 12,
  showExpand = true,
  className,
}: LogoGridProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleLogos = isExpanded ? logos : logos.slice(0, maxVisible);
  const hasMore = logos.length > maxVisible;

  return (
    <section
      className={`${styles.grid} ${className || ""}`}
      aria-label={title || "Client logos"}
    >
      {title && <h2 className={styles.title}>{title}</h2>}
      {description && <p className={styles.description}>{description}</p>}
      <div className={styles.logoContainer}>
        {visibleLogos.map((logo, index) => {
          const LogoContent = (
            <div className={styles.logoItem}>
              <Image
                src={logo.src}
                alt={logo.alt}
                width={140}
                height={70}
                className={styles.logoImage}
                draggable={false}
                unoptimized
              />
            </div>
          );

          return logo.url ? (
            <a
              key={`${logo.name}-${index}`}
              href={logo.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.logoLink}
              aria-label={`Visit ${logo.name} website`}
            >
              {LogoContent}
            </a>
          ) : (
            <div key={`${logo.name}-${index}`}>{LogoContent}</div>
          );
        })}
      </div>
      {showExpand && hasMore && (
        <button
          className={styles.expandButton}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Show fewer logos" : "Show all logos"}
        >
          {isExpanded ? "Show fewer" : `View all ${logos.length} logos`}
        </button>
      )}
    </section>
  );
}

