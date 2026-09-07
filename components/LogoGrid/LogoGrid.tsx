"use client";

import { useLayoutEffect, useState } from "react";
import Image from "next/image";
import type { ClientLogo } from "@/lib/content/clientLogos";
import { Button, SectionHeader } from "@/components/ui";
import styles from "./LogoGrid.module.scss";

interface LogoGridProps {
  logos: ClientLogo[];
  title?: string;
  description?: string;
  maxVisible?: number;
  showExpand?: boolean;
  className?: string;
  align?: "left" | "center";
}

const LOGO_SECTION_LABEL = "Clients & Collaborators";

export function LogoGrid({
  logos,
  title,
  description,
  maxVisible = 12,
  showExpand = true,
  className,
  align = "center",
}: LogoGridProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const visibleLogos = isExpanded ? logos : logos.slice(0, maxVisible);
  const hasMore = logos.length > maxVisible;

  const handleToggle = () => {
    setIsExpanded((current) => !current);
    setIsAnimating(true);
  };

  // Clear the fade class once it is done so repeated toggles retrigger it.
  useLayoutEffect(() => {
    if (!isAnimating) return;
    const timeout = window.setTimeout(() => setIsAnimating(false), 200);
    return () => window.clearTimeout(timeout);
  }, [isAnimating]);

  const alignmentClass = align === "left" ? styles.alignLeft : styles.alignCenter;

  return (
    <section
      className={`${styles.grid} ${alignmentClass} ${className || ""}`}
      aria-label={title || LOGO_SECTION_LABEL}
    >
      {title && (
        <SectionHeader
          title={title}
          description={description}
          variant={align === "center" ? "centered" : "stacked"}
        />
      )}
      <div 
        className={`${styles.logoContainerWrapper} ${isAnimating ? styles.animating : ""}`}
      >
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
      </div>
      {showExpand && hasMore && (
        <div className={styles.buttonWrapper}>
          <Button
            variant="secondary"
            size="md"
            icon={isExpanded ? "eye-off" : "eye"}
            iconPosition="right"
            onClick={handleToggle}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Show fewer logos" : "Show all logos"}
            className={isExpanded ? styles.buttonExpanded : styles.buttonCollapsed}
          >
            {isExpanded ? "Show fewer" : `View all ${logos.length} logos`}
          </Button>
        </div>
      )}
    </section>
  );
}
