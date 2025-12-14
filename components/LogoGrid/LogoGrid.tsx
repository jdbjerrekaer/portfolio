"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import type { ClientLogo } from "@/lib/content/clientLogos";
import { Button } from "@/components/ui/Button";
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
  const [isAnimatingLogos, setIsAnimatingLogos] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAnimatingRef = useRef(false);
  const pendingHeightRef = useRef<number | null>(null);
  // When collapsing, show all logos during fade-out animation
  const visibleLogos = (isExpanded || isCollapsing) ? logos : logos.slice(0, maxVisible);
  const hasMore = logos.length > maxVisible;

  // Handle expand/collapse with smooth animation
  const handleToggle = () => {
    if (!wrapperRef.current || !containerRef.current || isAnimatingRef.current) return;
    
    isAnimatingRef.current = true;
    
    if (isExpanded) {
      // Collapsing: measure collapsed height BEFORE starting fade-out
      const currentExpandedHeight = wrapperRef.current.scrollHeight;
      
      // Temporarily hide logos beyond maxVisible to measure collapsed height
      const logoElements = containerRef.current.children;
      const hiddenElements: HTMLElement[] = [];
      
      // Hide elements beyond maxVisible
      for (let i = maxVisible; i < logoElements.length; i++) {
        const element = logoElements[i] as HTMLElement;
        if (element.style.display !== 'none') {
          element.style.display = 'none';
          hiddenElements.push(element);
        }
      }
      
      // Measure collapsed height
      wrapperRef.current.style.height = "auto";
      const collapsedHeight = containerRef.current.scrollHeight;
      
      // Restore hidden elements
      hiddenElements.forEach(element => {
        element.style.display = '';
      });
      
      // Lock current expanded height
      wrapperRef.current.style.height = `${currentExpandedHeight}px`;
      
      // Now start fade-out animation
      setIsCollapsing(true);
      setIsAnimatingLogos(false);
      
      // After fade-out animation completes, animate height down
      const fadeOutDuration = 300; // Quick fade-out
      
      setTimeout(() => {
        // Update state to collapse
        setIsExpanded(false);
        
        // Animate height down using pre-measured collapsed height
        requestAnimationFrame(() => {
          if (!wrapperRef.current) {
            setIsCollapsing(false);
            isAnimatingRef.current = false;
            return;
          }
          
          // Force a reflow to ensure the browser has applied the current height
          void wrapperRef.current.offsetHeight;
          
          // Animate to collapsed height
          requestAnimationFrame(() => {
            if (wrapperRef.current) {
              wrapperRef.current.style.height = `${collapsedHeight}px`;
              
              setTimeout(() => {
                setIsCollapsing(false);
                isAnimatingRef.current = false;
              }, 400);
            }
          });
        });
      }, fadeOutDuration);
    } else {
      // Expanding: set animation state immediately so logos start hidden
      setIsAnimatingLogos(true);
      
      // Phase 1: Capture current height BEFORE state change
      const currentHeight = wrapperRef.current.scrollHeight;
      
      // Set explicit height to current value (lock it)
      wrapperRef.current.style.height = `${currentHeight}px`;
      
      // Phase 2: Use requestAnimationFrame to ensure browser has applied the height
      requestAnimationFrame(() => {
        // Phase 3: Now update the state (this will trigger content change)
        setIsExpanded(true);
      });
    }
  };

  // Measure and animate when content changes (only when expanding)
  useEffect(() => {
    if (!wrapperRef.current || !containerRef.current || !isAnimatingRef.current) return;
    if (isCollapsing) return; // Don't animate height when collapsing, handleToggle does it
    
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
            // Reset logo animation flag after all logos have animated (only when expanded)
            if (isExpanded && !isCollapsing) {
              const newlyVisibleCount = logos.length - maxVisible;
              const totalAnimationTime = newlyVisibleCount * 30 + 600; // stagger delay + animation duration
              setTimeout(() => {
                setIsAnimatingLogos(false);
              }, totalAnimationTime);
            }
          }, 400); // Match CSS transition duration
        }
      });
    });
  }, [isExpanded, visibleLogos.length, isCollapsing]);


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

  const alignmentClass = align === "left" ? styles.alignLeft : styles.alignCenter;

  return (
    <section
      className={`${styles.grid} ${alignmentClass} ${className || ""}`}
      aria-label={title || LOGO_SECTION_LABEL}
    >
      {title && <h2 className={styles.title}>{title}</h2>}
      {description && <p className={styles.description}>{description}</p>}
      <div 
        ref={wrapperRef}
        className={`${styles.logoContainerWrapper} ${isExpanded ? styles.expanded : ""}`}
      >
        <div ref={containerRef} className={styles.logoContainer}>
        {visibleLogos.map((logo, index) => {
          // Determine if this logo is newly visible (only when expanding)
          const isNewlyVisible = isExpanded && !isCollapsing && index >= maxVisible && isAnimatingLogos;
          // Determine if this logo should fade out (when collapsing)
          const shouldFadeOut = isCollapsing && index >= maxVisible;
          const animationDelay = isNewlyVisible ? (index - maxVisible) * 30 : 0; // 30ms stagger
          
          const LogoContent = (
            <div 
              className={`${styles.logoItem} ${
                isNewlyVisible ? styles.logoItemAnimate : ""
              } ${
                shouldFadeOut ? styles.logoItemFadeOut : ""
              }`}
              style={
                isNewlyVisible 
                  ? { animationDelay: `${animationDelay}ms` }
                  : undefined
              }
            >
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
            icon={isExpanded ? "eye.slash" : "eye"}
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

