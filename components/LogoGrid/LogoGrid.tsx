"use client";

import { TransitionEvent, useLayoutEffect, useRef, useState } from "react";
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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAnimatingRef = useRef(false);
  const visibleLogos = isExpanded ? logos : logos.slice(0, maxVisible);
  const hasMore = logos.length > maxVisible;

  const handleToggle = () => {
    if (!wrapperRef.current || !containerRef.current || isAnimatingRef.current) return;

    const wrapper = wrapperRef.current;
    isAnimatingRef.current = true;
    wrapper.style.height = `${wrapper.getBoundingClientRect().height}px`;

    requestAnimationFrame(() => {
      setIsExpanded((current) => !current);
    });
  };

  useLayoutEffect(() => {
    if (!wrapperRef.current || !containerRef.current || !isAnimatingRef.current) return;
    const wrapper = wrapperRef.current;
    const nextHeight = containerRef.current.scrollHeight;

    requestAnimationFrame(() => {
      wrapper.style.height = `${nextHeight}px`;
    });
  }, [isExpanded, logos.length, maxVisible]);

  const handleHeightTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || event.propertyName !== "height" || !wrapperRef.current) {
      return;
    }

    wrapperRef.current.style.height = "auto";
    isAnimatingRef.current = false;
  };

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
        ref={wrapperRef}
        className={`${styles.logoContainerWrapper} ${isExpanded ? styles.expanded : ""}`}
        onTransitionEnd={handleHeightTransitionEnd}
      >
        <div ref={containerRef} className={styles.logoContainer}>
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
