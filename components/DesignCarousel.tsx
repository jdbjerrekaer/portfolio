"use client";

import { useEffect, useRef, useState } from "react";
import { Tooltip, ImageModal } from "@/components/ui";
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
  image?: string; // Optional image path to use instead of placeholder
}

interface DesignCarouselProps {
  items: CarouselItem[];
}

export function DesignCarousel({ items }: DesignCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const offsetRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPlacements, setTooltipPlacements] = useState<Record<number, TippyPlacement>>({});
  const [halfWidth, setHalfWidth] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isManuallyScrolling, setIsManuallyScrolling] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null);
  const currentSpeedRef = useRef<number>(30); // pixels per second
  const baseSpeed = 30; // pixels per second
  const crawlSpeed = baseSpeed * 0.08; // 8% of base speed
  const manualScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartXRef = useRef<number>(0);
  const touchStartOffsetRef = useRef<number>(0);
  const mouseStartXRef = useRef<number>(0);
  const mouseStartOffsetRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const dragThresholdRef = useRef<number>(5); // Minimum pixels to move before considering it a drag
  const hasMovedRef = useRef<boolean>(false);
  const lastDragEndTimeRef = useRef<number>(0);

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
          lastDragEndTimeRef.current = Date.now();
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

  useEffect(() => {
    if (prefersReducedMotion || isManuallyScrolling || isModalOpen) {
      return;
    }

    lastTimeRef.current = performance.now();

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
      if (manualScrollTimeoutRef.current) {
        clearTimeout(manualScrollTimeoutRef.current);
      }
    };
  }, [halfWidth, isHovered, prefersReducedMotion, isManuallyScrolling, isModalOpen, baseSpeed, crawlSpeed]);

  // Generate placeholder SVG data URLs
  const getPlaceholderImage = (kind: "desktop" | "iphone", index: number): string => {
    const width = kind === "desktop" ? 420 : 140;
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

  // Get image source - use provided image or fallback to placeholder
  const getImageSrc = (item: CarouselItem, index: number): string => {
    if (item.image) {
      return item.image;
    }
    return getPlaceholderImage(item.kind, index % items.length);
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

  // Handle image click to open modal
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>, kind: "desktop" | "iphone", index: number) => {
    // Don't open modal if user was dragging (check if drag ended recently)
    const timeSinceDragEnd = Date.now() - lastDragEndTimeRef.current;
    if (hasMovedRef.current || timeSinceDragEnd < 100) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    const actualIndex = index % items.length;
    const item = items[actualIndex];
    const imageSrc = getImageSrc(item, actualIndex);
    const imageAlt = `${item.label} - ${kind === "desktop" ? "Desktop" : "iPhone"} design ${actualIndex + 1}`;
    
    setSelectedImage({ src: imageSrc, alt: imageAlt });
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  // Duplicate items for seamless loop
  const duplicatedItems = [...items, ...items];

  return (
    <>
      <section className={styles.carouselSection} aria-label="Design carousel">
        <div
          ref={containerRef}
          className={styles.container}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
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
                  <Tooltip
                    content={item.tooltip || item.label}
                    delay={750}
                    className="tooltip-glass"
                    placement={tooltipPlacements[index] || "top"}
                    followCursor
                  >
                    <img
                      src={getImageSrc(item, index)}
                      alt={`${item.label} - ${item.kind === "desktop" ? "Desktop" : "iPhone"} design ${(index % items.length) + 1}`}
                      className={styles.image}
                      draggable={false}
                      onMouseMove={(e) => handleImageMouseMove(e, index)}
                      onClick={(e) => handleImageClick(e, item.kind, index)}
                    />
                  </Tooltip>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {selectedImage && (
        <ImageModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          imageSrc={selectedImage.src}
          imageAlt={selectedImage.alt}
        />
      )}
    </>
  );
}

