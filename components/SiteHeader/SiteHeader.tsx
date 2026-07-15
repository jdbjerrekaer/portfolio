"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { Icon, type IconName } from "@/components/ui/Icon";
import styles from "./SiteHeader.module.scss";

const navLinks: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/projects", label: "Projects", icon: "folder" },
  { href: "/about", label: "About", icon: "user" },
  { href: "https://github.com/jdbjerrekaer", label: "GitHub", icon: "arrow-up-right" },
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
      setIsScrolled(scrollY > threshold);
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
          Jonatan <span className={styles.logoOptional}>Daugbjerg Bjerrekær</span>
        </Link>
        <ul className={styles.navList}>
          {navLinks.map((link) => {
            const isExternal = link.href.startsWith("http");
            return (
            <li key={link.href}>
              {isExternal ? (
                <AnimateIcon animateOnHover asChild>
                  <a
                    href={link.href}
                    className={styles.navLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label}
                    <Icon name={link.icon} size={16} className={styles.navIcon} />
                  </a>
                </AnimateIcon>
              ) : (
                <AnimateIcon animateOnHover asChild>
                  <Link
                    href={link.href}
                    className={`${styles.navLink} ${isActive(link.href) ? styles.active : ""}`}
                    aria-current={isActive(link.href) ? "page" : undefined}
                  >
                    {link.label}
                    <Icon name={link.icon} size={16} className={styles.navIcon} />
                  </Link>
                </AnimateIcon>
              )}
            </li>
          )})}
        </ul>
      </nav>
    </header>
  );
}
