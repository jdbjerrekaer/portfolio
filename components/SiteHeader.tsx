"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SFSymbol } from "@/components/ui/SFSymbol";
import styles from "./SiteHeader.module.scss";

const navLinks = [
  { href: "/", label: "Home", icon: "house" },
  { href: "/about/", label: "About", icon: "person" },
  { href: "/projects/", label: "Projects", icon: "folder" },
];

export function SiteHeader() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" || pathname === "";
    }
    return pathname.startsWith(href);
  };

  return (
    <header className={styles.header}>
      <nav className={styles.nav} aria-label="Main navigation">
        <Link href="/" className={styles.logo}>
          Portfolio
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

