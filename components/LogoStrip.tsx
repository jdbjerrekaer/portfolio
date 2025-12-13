"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { ClientLogo } from "@/lib/content/clientLogos";
import styles from "./LogoStrip.module.scss";

interface LogoStripProps {
  logos: ClientLogo[];
  title?: string;
  className?: string;
}

export function LogoStrip({ logos, title, className }: LogoStripProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const offsetRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isManuallyScrolling, setIsManuallyScrolling] = useState(false);
  const [halfWidth, setHalfWidth] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const currentSpeedRef = useRef<number>(20); // pixels per second
  const manualScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartXRef = useRef<number>(0);
  const touchStartOffsetRef = useRef<number>(0);
  const mouseStartXRef = useRef<number>(0);
  const mouseStartOffsetRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const dragThresholdRef = useRef<number>(5); // Minimum pixels to move before considering it a drag
  const hasMovedRef = useRef<boolean>(false);
  const baseSpeed = 20;
  const crawlSpeed = baseSpeed * 0.1; // 10% of base speed when hovered

  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Measure half width for seamless loop
  useEffect(() => {
    if (!trackRef.current) return;

    const measureWidth = () => {
      if (trackRef.current) {
        const width = trackRef.current.scrollWidth / 2;
        setHalfWidth(width);
      }
    };

    measureWidth();
    window.addEventListener("resize", measureWidth);
    return () => window.removeEventListener("resize", measureWidth);
  }, [logos]);

  // Handle manual scroll timeout - resume auto-scroll after user stops
  const handleManualScrollEnd = () => {
    if (manualScrollTimeoutRef.current) {
      clearTimeout(manualScrollTimeoutRef.current);
    }
    setIsManuallyScrolling(true);
    manualScrollTimeoutRef.current = setTimeout(() => {
      setIsManuallyScrolling(false);
    }, 1500); // Resume auto-scroll after 1.5 seconds of inactivity
  };

  // Mouse wheel scroll handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Only handle horizontal scrolling
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        handleManualScrollEnd();
        
        const scrollAmount = e.deltaX * 0.5; // Adjust sensitivity
        offsetRef.current -= scrollAmount;
        
        // Wrap around for seamless loop
        if (offsetRef.current <= -halfWidth && halfWidth > 0) {
          offsetRef.current += halfWidth;
        } else if (offsetRef.current > 0) {
          offsetRef.current -= halfWidth;
        }
        
        if (trackRef.current) {
          trackRef.current.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
        }
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [halfWidth]);

  // Mouse drag handlers
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      // Only start drag on left mouse button
      if (e.button !== 0) return;
      
      isDraggingRef.current = true;
      hasMovedRef.current = false;
      mouseStartXRef.current = e.clientX;
      mouseStartOffsetRef.current = offsetRef.current;
      setIsManuallyScrolling(true);
      
      // Change cursor to grabbing
      container.style.cursor = "grabbing";
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      
      const deltaX = Math.abs(mouseStartXRef.current - e.clientX);
      
      // Only start dragging if moved beyond threshold
      if (deltaX > dragThresholdRef.current) {
        hasMovedRef.current = true;
        e.preventDefault();
        
        const scrollDeltaX = mouseStartXRef.current - e.clientX;
        offsetRef.current = mouseStartOffsetRef.current - scrollDeltaX;
        
        // Wrap around for seamless loop
        if (offsetRef.current <= -halfWidth && halfWidth > 0) {
          offsetRef.current += halfWidth;
        } else if (offsetRef.current > 0) {
          offsetRef.current -= halfWidth;
        }
        
        if (trackRef.current) {
          trackRef.current.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        // If we moved beyond threshold, prevent default to stop link clicks
        if (hasMovedRef.current) {
          e.preventDefault();
        }
        
        isDraggingRef.current = false;
        hasMovedRef.current = false;
        container.style.cursor = "grab";
        handleManualScrollEnd();
      }
    };

    const handleMouseLeave = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        container.style.cursor = "grab";
        handleManualScrollEnd();
      }
    };

    container.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [halfWidth]);

  // Touch scroll handlers
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartOffsetRef.current = offsetRef.current;
      setIsManuallyScrolling(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartXRef.current) return;
      
      const deltaX = touchStartXRef.current - e.touches[0].clientX;
      offsetRef.current = touchStartOffsetRef.current - deltaX;
      
      // Wrap around for seamless loop
      if (offsetRef.current <= -halfWidth && halfWidth > 0) {
        offsetRef.current += halfWidth;
      } else if (offsetRef.current > 0) {
        offsetRef.current -= halfWidth;
      }
      
      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
      }
    };

    const handleTouchEnd = () => {
      touchStartXRef.current = 0;
      handleManualScrollEnd();
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [halfWidth]);

  // Animation loop
  useEffect(() => {
    if (prefersReducedMotion || isManuallyScrolling) {
      return;
    }

    lastTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      const targetSpeed = isHovered ? crawlSpeed : baseSpeed;
      currentSpeedRef.current += (targetSpeed - currentSpeedRef.current) * 0.1;

      offsetRef.current -= currentSpeedRef.current * deltaTime;

      if (offsetRef.current <= -halfWidth && halfWidth > 0) {
        offsetRef.current += halfWidth;
      }

      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (manualScrollTimeoutRef.current) {
        clearTimeout(manualScrollTimeoutRef.current);
      }
    };
  }, [halfWidth, isHovered, prefersReducedMotion, isManuallyScrolling, baseSpeed, crawlSpeed]);

  // Duplicate logos for seamless loop
  const duplicatedLogos = [...logos, ...logos];

  return (
    <section
      className={`${styles.strip} ${className || ""}`}
      aria-label={title || "Client logos"}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {title && <h3 className={styles.title}>{title}</h3>}
      <div ref={containerRef} className={styles.container}>
        <div ref={trackRef} className={styles.track}>
          {duplicatedLogos.map((logo, index) => {
            const LogoContent = (
              <div className={styles.logoItem} key={`${logo.name}-${index}`}>
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={120}
                  height={60}
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
              LogoContent
            );
          })}
        </div>
      </div>
    </section>
  );
}

