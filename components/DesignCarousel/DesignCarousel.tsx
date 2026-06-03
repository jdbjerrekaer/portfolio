"use client";

import { useEffect, useRef, useState } from "react";
import { BlossomCarousel } from "@blossom-carousel/react";
import type { BlossomCarouselHandle } from "@blossom-carousel/react";
import { Tooltip, ImageModal } from "@/components/ui";
import styles from "./DesignCarousel.module.scss";

export interface CarouselItem {
  kind: "desktop" | "iphone";
  label: string;
  tooltip?: string;
  image?: string; // Optional image path to use instead of placeholder
  description?: string; // Optional description/caption shown in fullscreen modal
}

interface DesignCarouselProps {
  items: CarouselItem[];
}

export function DesignCarousel({ items }: DesignCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const mobileCarouselRef = useRef<BlossomCarouselHandle>(null);
  const mobileSwipeRef = useRef({ startX: 0, startY: 0, moved: false });
  const animationFrameRef = useRef<number | null>(null);
  const mobileAnimationFrameRef = useRef<number | null>(null);
  const offsetRef = useRef<number>(0);
  const mobileSetWidthRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [halfWidth, setHalfWidth] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  const [isManuallyScrolling, setIsManuallyScrolling] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileCarousel, setIsMobileCarousel] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string; description?: string } | null>(null);
  const currentSpeedRef = useRef<number>(30); // pixels per second
  const baseSpeed = 30; // pixels per second
  const crawlSpeed = baseSpeed * 0.3;
  const manualScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartXRef = useRef<number>(0);
  const touchStartOffsetRef = useRef<number>(0);
  const mouseStartXRef = useRef<number>(0);
  const mouseStartOffsetRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const dragThresholdRef = useRef<number>(5); // Minimum pixels to move before considering it a drag
  const hasMovedRef = useRef<boolean>(false);
  const lastDragEndTimeRef = useRef<number>(0);
  const hoveredImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handleChange = (event: MediaQueryList | MediaQueryListEvent) => {
      setIsMobileCarousel(event.matches);
    };

    handleChange(mediaQuery);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Check for reduced motion preference (reactive)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (isMobileCarousel || !trackRef.current) return;

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
  }, [items, isMobileCarousel]);

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

  const pauseMobileAutoScroll = () => {
    if (manualScrollTimeoutRef.current) {
      clearTimeout(manualScrollTimeoutRef.current);
    }
    setIsManuallyScrolling(true);
  };

  // Mouse wheel scroll handler
  useEffect(() => {
    if (isMobileCarousel) return;

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
  }, [halfWidth, isMobileCarousel]);

  // Mouse drag handlers
  useEffect(() => {
    if (isMobileCarousel) return;

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
          lastDragEndTimeRef.current = e.timeStamp;
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
  }, [halfWidth, isMobileCarousel]);

  // Touch scroll handlers
  useEffect(() => {
    if (isMobileCarousel) return;

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
  }, [halfWidth, isMobileCarousel]);

  useEffect(() => {
    if (isMobileCarousel || prefersReducedMotion || isManuallyScrolling || isModalOpen) {
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
  }, [halfWidth, isHovered, prefersReducedMotion, isManuallyScrolling, isModalOpen, baseSpeed, crawlSpeed, isMobileCarousel]);

  useEffect(() => {
    if (!isMobileCarousel) return;

    const scroller = mobileCarouselRef.current?.element;
    if (!scroller) return;

    const normalizeScrollPosition = () => {
      const setWidth = mobileSetWidthRef.current;
      if (setWidth <= 0) return;

      if (scroller.scrollLeft >= setWidth * 2) {
        scroller.scrollLeft -= setWidth;
      } else if (scroller.scrollLeft <= 0) {
        scroller.scrollLeft += setWidth;
      }
    };

    const measureLoop = () => {
      mobileSetWidthRef.current = scroller.scrollWidth / 3;

      if (mobileSetWidthRef.current > 0 && scroller.scrollLeft < 1) {
        scroller.scrollLeft = mobileSetWidthRef.current;
      }
    };

    const measureFrame = requestAnimationFrame(measureLoop);
    window.addEventListener("resize", measureLoop);
    scroller.addEventListener("scroll", normalizeScrollPosition, { passive: true });

    return () => {
      cancelAnimationFrame(measureFrame);
      window.removeEventListener("resize", measureLoop);
      scroller.removeEventListener("scroll", normalizeScrollPosition);
    };
  }, [items.length, isMobileCarousel]);

  useEffect(() => {
    if (!isMobileCarousel || prefersReducedMotion || isManuallyScrolling || isModalOpen) {
      return;
    }

    const scroller = mobileCarouselRef.current?.element;
    if (!scroller) return;

    lastTimeRef.current = performance.now();

    const animateMobile = (currentTime: number) => {
      const deltaTime = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      const setWidth = mobileSetWidthRef.current;
      scroller.scrollLeft += baseSpeed * deltaTime;

      if (setWidth > 0 && scroller.scrollLeft >= setWidth * 2) {
        scroller.scrollLeft -= setWidth;
      }

      mobileAnimationFrameRef.current = requestAnimationFrame(animateMobile);
    };

    mobileAnimationFrameRef.current = requestAnimationFrame(animateMobile);

    return () => {
      if (mobileAnimationFrameRef.current) {
        cancelAnimationFrame(mobileAnimationFrameRef.current);
      }
    };
  }, [baseSpeed, isManuallyScrolling, isMobileCarousel, isModalOpen, prefersReducedMotion]);

  // Generate placeholder SVG data URLs
  const getPlaceholderImage = (kind: "desktop" | "iphone", index: number): string => {
    const width = kind === "desktop" ? 580 : 165;
    const height = 360;
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

  const handleImageMouseMove = (event: React.MouseEvent<HTMLImageElement>, index: number) => {
    if (prefersReducedMotion || isManuallyScrolling) {
      return;
    }

    const img = event.currentTarget;
    const rect = img.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const width = rect.width;
    const height = rect.height;

    // Apply parallax effect
    const xPercent = (x / width - 0.5) * 2; // -1 to 1
    const yPercent = (y / height - 0.5) * 2; // -1 to 1
    
    // Keep the parallax close to the resting state so the image feels reactive, not theatrical.
    const item = items[index % items.length];
    const maxMove = item.kind === "desktop" ? 8 : 4;
    const moveX = xPercent * maxMove;
    const moveY = yPercent * maxMove;
    
    img.style.setProperty('--parallax-x', `${moveX}px`);
    img.style.setProperty('--parallax-y', `${moveY}px`);
    hoveredImageRef.current = img;
  };

  // Handle image click to open modal
  const handleImageClick = (e: React.MouseEvent<HTMLElement>, kind: "desktop" | "iphone", index: number) => {
    // Don't open modal if user was dragging (check if drag ended recently)
    const timeSinceDragEnd = e.timeStamp - lastDragEndTimeRef.current;
    if (hasMovedRef.current || timeSinceDragEnd < 100) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    const actualIndex = index % items.length;
    const item = items[actualIndex];
    const imageSrc = getImageSrc(item, actualIndex);
    const imageAlt = `${item.label} - ${kind === "desktop" ? "Desktop" : "iPhone"} design ${actualIndex + 1}`;
    
    setSelectedImage({ src: imageSrc, alt: imageAlt, description: item.description });
    setIsModalOpen(true);
  };

  const handleMobilePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    pauseMobileAutoScroll();
    mobileSwipeRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
  };

  const handleMobilePointerEnd = () => {
    handleManualScrollEnd();
  };

  const handleMobilePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const deltaX = Math.abs(event.clientX - mobileSwipeRef.current.startX);
    const deltaY = Math.abs(event.clientY - mobileSwipeRef.current.startY);

    if (deltaX > 8 || deltaY > 8) {
      mobileSwipeRef.current.moved = true;
    }
  };

  const handleMobileImageClick = (e: React.MouseEvent<HTMLElement>, kind: "desktop" | "iphone", index: number) => {
    if (mobileSwipeRef.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      mobileSwipeRef.current.moved = false;
      return;
    }

    handleImageClick(e, kind, index);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  // Duplicate items for seamless loop
  const duplicatedItems = [...items, ...items];
  const mobileLoopItems = [...items, ...items, ...items];

  if (isMobileCarousel) {
    return (
      <>
        <section className={styles.carouselSection} aria-label="Design carousel">
          <BlossomCarousel
            ref={mobileCarouselRef}
            className={styles.mobileContainer}
            load="always"
            repeat={false}
            onPointerUp={handleMobilePointerEnd}
            onPointerCancel={handleMobilePointerEnd}
            onWheel={handleManualScrollEnd}
          >
            {mobileLoopItems.map((item, index) => {
              const actualIndex = index % items.length;

              return (
                <div
                  key={`${item.kind}-${item.label}-${index}`}
                  className={`${styles.mobileItem} ${styles[item.kind]}`}
                >
                  <button
                    type="button"
                    className={styles.imageWrapper}
                    onPointerDown={handleMobilePointerDown}
                    onPointerMove={handleMobilePointerMove}
                    onClick={(e) => handleMobileImageClick(e, item.kind, actualIndex)}
                    aria-label={`Open ${item.label} ${item.kind === "desktop" ? "desktop" : "iPhone"} design ${actualIndex + 1}`}
                  >
                    <img
                      src={getImageSrc(item, actualIndex)}
                      alt={`${item.label} - ${item.kind === "desktop" ? "Desktop" : "iPhone"} design ${actualIndex + 1}`}
                      className={styles.image}
                      draggable={false}
                    />
                  </button>
                </div>
              );
            })}
          </BlossomCarousel>
        </section>
        {selectedImage && (
          <ImageModal
            isOpen={isModalOpen}
            onClose={handleModalClose}
            imageSrc={selectedImage.src}
            imageAlt={selectedImage.alt}
            description={selectedImage.description}
          />
        )}
      </>
    );
  }

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
              
              return (
                <div
                  key={`${item.kind}-${index}`}
                  className={`${styles.item} ${styles[item.kind]} ${isItemHovered ? styles.hovered : ""}`}
                  onMouseEnter={() => {
                    setHoveredIndex(index);
                    setIsHovered(true);
                  }}
                  onMouseLeave={() => {
                    setHoveredIndex(null);
                    setIsHovered(false);
                    if (hoveredImageRef.current) {
                      hoveredImageRef.current.style.setProperty('--parallax-x', '0px');
                      hoveredImageRef.current.style.setProperty('--parallax-y', '0px');
                      hoveredImageRef.current = null;
                    }
                  }}
                >
                  <Tooltip
                    content={item.tooltip || item.label}
                    delay={180}
                    className="tooltip-glass"
                    placement="top"
                  >
                    <button
                      type="button"
                      className={styles.imageWrapper}
                      onClick={(e) => handleImageClick(e, item.kind, index)}
                      aria-label={`Open ${item.label} ${item.kind === "desktop" ? "desktop" : "iPhone"} design ${(index % items.length) + 1}`}
                    >
                      <img
                        src={getImageSrc(item, index)}
                        alt={`${item.label} - ${item.kind === "desktop" ? "Desktop" : "iPhone"} design ${(index % items.length) + 1}`}
                        className={styles.image}
                        draggable={false}
                        onMouseMove={(e) => handleImageMouseMove(e, index)}
                      />
                    </button>
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
          description={selectedImage.description}
        />
      )}
    </>
  );
}
