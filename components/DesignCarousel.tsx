"use client";

import { useEffect, useRef, useState } from "react";
import Tippy from "@tippyjs/react";
import { followCursor } from "tippy.js";
import "tippy.js/dist/tippy.css";
import styles from "./DesignCarousel.module.scss";

type TippyPlacement = 
  | "top" 
  | "top-start" 
  | "top-end" 
  | "bottom" 
  | "bottom-start" 
  | "bottom-end" 
  | "left" 
  | "left-start" 
  | "left-end" 
  | "right" 
  | "right-start" 
  | "right-end";

export interface CarouselItem {
  kind: "desktop" | "iphone";
  label: string;
  tooltip?: string;
}

interface DesignCarouselProps {
  items: CarouselItem[];
}

export function DesignCarousel({ items }: DesignCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const offsetRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPlacements, setTooltipPlacements] = useState<Record<number, TippyPlacement>>({});
  const [halfWidth, setHalfWidth] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const currentSpeedRef = useRef<number>(30); // pixels per second
  const baseSpeed = 30; // pixels per second
  const crawlSpeed = baseSpeed * 0.08; // 8% of base speed

  // Check for reduced motion preference (reactive)
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

  useEffect(() => {
    if (!trackRef.current) return;

    // Measure half width (width of one set of items)
    const measureWidth = () => {
      if (trackRef.current) {
        const width = trackRef.current.scrollWidth / 2;
        setHalfWidth(width);
      }
    };

    measureWidth();
    window.addEventListener("resize", measureWidth);
    return () => window.removeEventListener("resize", measureWidth);
  }, [items]);

  useEffect(() => {
    if (prefersReducedMotion) {
      // Stop auto-scroll if user prefers reduced motion
      return;
    }

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTimeRef.current) / 1000; // Convert to seconds
      lastTimeRef.current = currentTime;

      // Smoothly interpolate speed based on hover state
      const targetSpeed = isHovered ? crawlSpeed : baseSpeed;
      currentSpeedRef.current += (targetSpeed - currentSpeedRef.current) * 0.08; // Lerp factor

      // Update offset
      offsetRef.current -= currentSpeedRef.current * deltaTime;

      // Wrap around when we've scrolled past half width
      if (offsetRef.current <= -halfWidth && halfWidth > 0) {
        offsetRef.current += halfWidth;
      }

      // Apply transform
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
    };
  }, [halfWidth, isHovered, prefersReducedMotion, baseSpeed, crawlSpeed]);

  // Generate placeholder SVG data URLs
  const getPlaceholderImage = (kind: "desktop" | "iphone", index: number): string => {
    const width = kind === "desktop" ? 420 : 180;
    const height = 260;
    const bgColor = kind === "desktop" ? "#f5f5f7" : "#e5e5e7";
    const textColor = "#86868b";

    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="${bgColor}"/>
        <text x="50%" y="50%" font-family="system-ui, -apple-system" font-size="14" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">
          ${kind === "desktop" ? "Desktop" : "iPhone"} Design ${index + 1}
        </text>
      </svg>
    `.trim();

    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  };

  // Calculate tooltip placement based on mouse position relative to image
  const handleImageMouseMove = (
    event: React.MouseEvent<HTMLImageElement>,
    index: number
  ) => {
    const img = event.currentTarget;
    const rect = img.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const width = rect.width;
    const height = rect.height;
    
    // Determine which side/quadrant the mouse is in
    const horizontalCenter = width / 2;
    const verticalCenter = height / 2;
    
    let placement: TippyPlacement = "top";
    
    // Determine placement based on mouse position
    // Check vertical position first (top vs bottom)
    if (y < height * 0.4) {
      // Top 40% - tooltip comes from top
      placement = x < horizontalCenter ? "top-start" : "top-end";
    } else if (y > height * 0.6) {
      // Bottom 40% - tooltip comes from bottom
      placement = x < horizontalCenter ? "bottom-start" : "bottom-end";
    } else {
      // Middle 20% - check horizontal position
      if (x < width * 0.4) {
        // Left side
        placement = "left";
      } else if (x > width * 0.6) {
        // Right side
        placement = "right";
      } else {
        // Center - default to top
        placement = y < verticalCenter ? "top" : "bottom";
      }
    }
    
    setTooltipPlacements((prev) => ({
      ...prev,
      [index]: placement,
    }));
  };

  // Duplicate items for seamless loop
  const duplicatedItems = [...items, ...items];

  return (
    <section className={styles.carouselSection} aria-label="Design carousel">
      <div
        ref={containerRef}
        className={styles.container}
      >
        <div ref={trackRef} className={styles.track}>
          {duplicatedItems.map((item, index) => {
            const isItemHovered = hoveredIndex === index;
            const hasAnyHover = hoveredIndex !== null;
            
            return (
              <div
                key={`${item.kind}-${index}`}
                className={`${styles.item} ${styles[item.kind]} ${isItemHovered ? styles.hovered : ""} ${hasAnyHover && !isItemHovered ? styles.scaledDown : ""}`}
                onMouseEnter={() => {
                  setHoveredIndex(index);
                  setIsHovered(true);
                }}
                onMouseLeave={() => {
                  setHoveredIndex(null);
                  setIsHovered(false);
                }}
              >
                <Tippy
                  content={item.tooltip || item.label}
                  delay={[750, 500]}
                  className={styles.tooltip}
                  theme="apple"
                  arrow={false}
                  animation="shift-away-subtle"
                  placement={tooltipPlacements[index] || "top"}
                  followCursor="initial"
                  plugins={[followCursor]}
                  moveTransition="transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                >
                  <img
                    src={getPlaceholderImage(item.kind, index % items.length)}
                    alt={`${item.label} - ${item.kind === "desktop" ? "Desktop" : "iPhone"} design ${(index % items.length) + 1}`}
                    className={styles.image}
                    draggable={false}
                    onMouseMove={(e) => handleImageMouseMove(e, index)}
                  />
                </Tippy>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
