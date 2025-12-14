"use client";

import Link from "next/link";
import { useRouter } from "next/compat/router";
import { useEffect, useState } from "react";
import { SFSymbol } from "@/components/ui/SFSymbol";
import styles from "./SiteHeader.module.scss";

const navLinks = [
  { href: "/", label: "Home", icon: "house" },
  { href: "/about/", label: "About", icon: "person" },
  { href: "/projects/", label: "Projects", icon: "folder" },
];

const SCROLL_THRESHOLD_DESKTOP = 500; // pixels to scroll before background appears on desktop
const SCROLL_THRESHOLD_MOBILE = 50; // pixels to scroll before background appears on mobile

export function SiteHeader() {
  const router = useRouter();
  const pathname = router?.asPath ?? "";
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

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/") {
      return pathname === "/" || pathname === "";
    }
    return pathname.startsWith(href);
  };

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ""}`}>
      <nav className={styles.nav} aria-label="Main navigation">
        <Link href="/" className={styles.logo}>
          JonatanDB
        </Link>
        <ul className={styles.navList}>
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`${styles.navLink} ${isActive(link.href) ? styles.active : ""}`}
                aria-current={isActive(link.href) ? "page" : undefined}
              >
                <span className={styles.navIcon}>
                  <SFSymbol name={link.icon} size={16} weight="medium" filled={false} className={styles.iconOutline} />
                  <SFSymbol name={link.icon} size={16} weight="medium" filled={true} className={styles.iconFilled} />
                </span>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

