"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./page.module.scss";

interface TocSection {
  title: string;
  id: string;
}

/** Sticky "on this page" list; the section whose heading last crossed the top third is marked current. */
export function CaseStudyToc({ sections }: { sections: TocSection[] }) {
  const [active, setActive] = useState<string | null>(null);
  const [covered, setCovered] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const headings = sections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (headings.length === 0) return;

    // Current = the last heading above the top third. Works scrolling either way, unlike enter/leave events.
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight / 3;
      const current = headings.filter((heading) => heading.getBoundingClientRect().top < line).pop();
      setActive(current?.id ?? null);

      // Wide demos are centred on the viewport and run under this column; step aside while one overlaps.
      const nav = navRef.current?.getBoundingClientRect();
      setCovered(
        !!nav &&
          Array.from(document.querySelectorAll("[data-wide]")).some((el) => {
            const box = el.getBoundingClientRect();
            return box.left < nav.right && box.top < nav.bottom && box.bottom > nav.top;
          }),
      );
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [sections]);

  return (
    <nav ref={navRef} className={styles.toc} aria-label="On this page" data-covered={covered || undefined}>
      <p className={styles.tocLabel}>On this page</p>
      <ol>
        {sections.map((section, index) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className={styles.tocLink}
              aria-current={active === section.id ? "location" : undefined}
            >
              <span className={styles.tocIndex}>{String(index + 1).padStart(2, "0")}</span>
              {section.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
