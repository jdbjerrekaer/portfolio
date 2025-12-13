"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SFSymbol } from "@/components/ui/SFSymbol";
import styles from "./SiteHeader.module.scss";

const navLinks = [
  { href: "/", label: "Home", icon: "house" },
  { href: "/about/", label: "About", icon: "person" },
  { href: "/projects/", label: "Projects", icon: "folder" },
];

const SCROLL_THRESHOLD = 1000; // pixels to scroll before background appears

export function SiteHeader() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Background appears after threshold, but disappears immediately at top
      if (scrollY > SCROLL_THRESHOLD) {
        setIsScrolled(true);
      } else if (scrollY === 0) {
        setIsScrolled(false);
      }
    };

    // Check initial scroll position
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) => {
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

