"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SFSymbol } from "@/components/ui/SFSymbol";
import styles from "./SiteHeader.module.scss";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About", icon: "person" },
  { href: "/projects", label: "Projects", icon: "folder" },
  { href: "https://github.com/jdbjerrekaer", label: "GitHub" },
];

const SCROLL_THRESHOLD_DESKTOP = 500; // pixels to scroll before background appears on desktop
const SCROLL_THRESHOLD_MOBILE = 50; // pixels to scroll before background appears on mobile

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const getScrollThreshold = () => {
      // Check if mobile (viewport width <= 900px, matching the media query breakpoint)
      return window.innerWidth <= 900 ? SCROLL_THRESHOLD_MOBILE : SCROLL_THRESHOLD_DESKTOP;
    };

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const threshold = getScrollThreshold();
      // Background appears after threshold, but disappears immediately at top
      if (scrollY > threshold) {
        setIsScrolled(true);
      } else if (scrollY === 0) {
        setIsScrolled(false);
      }
    };

    const handleResize = () => {
      // Re-check scroll position when window resizes to apply correct threshold
      handleScroll();
    };

    // Check initial scroll position
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const normalizePath = (path: string) => {
    if (!path) return "/";
    if (path !== "/" && path.endsWith("/")) return path.slice(0, -1);
    return path;
  };

  const activePath = normalizePath(pathname);

  const isActive = (href: string) => {
    const target = normalizePath(href);
    if (target === "/") return activePath === "/";
    return activePath === target || activePath.startsWith(`${target}/`);
  };

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ""}`}>
      <nav className={styles.nav} aria-label="Main navigation">
        <Link href="/" className={styles.logo}>
          Jonatan Daugbjerg Bjerrekær
        </Link>
        <ul className={styles.navList}>
          {navLinks.map((link) => {
            const isExternal = link.href.startsWith("http");
            return (
            <li key={link.href}>
              {isExternal ? (
                <a
                  href={link.href}
                  className={styles.navLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label}
                  {link.icon && (
                    <span className={styles.navIcon}>
                      <SFSymbol name={link.icon} size={16} weight="medium" filled={false} className={styles.iconOutline} />
                      <SFSymbol name={link.icon} size={16} weight="medium" filled={true} className={styles.iconFilled} />
                    </span>
                  )}
                </a>
              ) : (
                <Link
                  href={link.href}
                  className={`${styles.navLink} ${isActive(link.href) ? styles.active : ""}`}
                  aria-current={isActive(link.href) ? "page" : undefined}
                >
                  {link.label}
                  {link.icon && (
                    <span className={styles.navIcon}>
                      <SFSymbol name={link.icon} size={16} weight="medium" filled={false} className={styles.iconOutline} />
                      <SFSymbol name={link.icon} size={16} weight="medium" filled={true} className={styles.iconFilled} />
                    </span>
                  )}
                </Link>
              )}
            </li>
          )})}
        </ul>
      </nav>
    </header>
  );
}

