"use client";

import { useState, useRef, useEffect } from "react";
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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAnimatingRef = useRef(false);
  const pendingHeightRef = useRef<number | null>(null);
  const visibleLogos = isExpanded ? logos : logos.slice(0, maxVisible);
  const hasMore = logos.length > maxVisible;

  // Handle expand/collapse with smooth animation
  const handleToggle = () => {
    if (!wrapperRef.current || !containerRef.current || isAnimatingRef.current) return;
    
    isAnimatingRef.current = true;
    
    // Phase 1: Capture current height BEFORE state change
    const currentHeight = wrapperRef.current.scrollHeight;
    
    // Set explicit height to current value (lock it)
    wrapperRef.current.style.height = `${currentHeight}px`;
    
    // Phase 2: Use requestAnimationFrame to ensure browser has applied the height
    requestAnimationFrame(() => {
      // Phase 3: Now update the state (this will trigger content change)
      setIsExpanded((prev) => !prev);
    });
  };

  // Measure and animate when content changes
  useEffect(() => {
    if (!wrapperRef.current || !containerRef.current || !isAnimatingRef.current) return;

    // Phase 4: After content has updated, measure new height and animate
    requestAnimationFrame(() => {
      if (!wrapperRef.current || !containerRef.current) {
        isAnimatingRef.current = false;
        return;
      }
      
      // Get the current locked height (set in handleToggle)
      const currentHeight = wrapperRef.current.offsetHeight;
      
      // Temporarily set to auto to measure natural height of new content
      wrapperRef.current.style.height = "auto";
      const newHeight = containerRef.current.scrollHeight;
      
      // Set back to current height first to establish starting point for animation
      wrapperRef.current.style.height = `${currentHeight}px`;
      
      // Force a reflow to ensure the browser has applied the height
      void wrapperRef.current.offsetHeight;
      
      // Then animate to new height
      requestAnimationFrame(() => {
        if (wrapperRef.current) {
          wrapperRef.current.style.height = `${newHeight}px`;
          
          // Reset animation flag after transition completes
          setTimeout(() => {
            isAnimatingRef.current = false;
          }, 400); // Match CSS transition duration
        }
      });
    });
  }, [isExpanded, visibleLogos.length]);

  // Measure initial height on mount
  useEffect(() => {
    if (!wrapperRef.current || !containerRef.current) return;
    
    // Set initial height to ensure smooth transitions later
    requestAnimationFrame(() => {
      if (!wrapperRef.current || !containerRef.current) return;
      const height = containerRef.current.scrollHeight;
      wrapperRef.current.style.height = `${height}px`;
    });
  }, []);

  return (
    <section
      className={`${styles.grid} ${className || ""}`}
      aria-label={title || "Client logos"}
    >
      {title && <h2 className={styles.title}>{title}</h2>}
      {description && <p className={styles.description}>{description}</p>}
      <div 
        ref={wrapperRef}
        className={`${styles.logoContainerWrapper} ${isExpanded ? styles.expanded : ""}`}
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
        <button
          className={styles.expandButton}
          onClick={handleToggle}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Show fewer logos" : "Show all logos"}
        >
          {isExpanded ? "Show fewer" : `View all ${logos.length} logos`}
        </button>
      )}
    </section>
  );
}

