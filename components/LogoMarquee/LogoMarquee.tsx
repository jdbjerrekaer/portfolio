"use client";

import { useRef, type CSSProperties } from "react";
import Image from "next/image";
import type { ClientLogo } from "@/lib/content/clientLogos";
import { Section, SectionHeader } from "@/components/ui";
import { Reveal, stagger } from "@/components/Reveal";
import styles from "./LogoMarquee.module.scss";

interface LogoMarqueeProps {
  logos: ClientLogo[];
  title: string;
}

function LogoList({ logos, hidden = false }: { logos: ClientLogo[]; hidden?: boolean }) {
  return (
    <ul className={`${styles.track} ${hidden ? styles.copy : ""}`} aria-hidden={hidden || undefined}>
      {logos.map((logo) => {
        // Eager: lazy loading misjudges images riding a transformed belt, and these are small.
        const image = (
          <Image src={logo.src} alt={hidden ? "" : logo.alt} width={140} height={70} className={styles.logo} draggable={false} loading="eager" unoptimized />
        );
        return (
          <li key={logo.name} className={styles.item}>
            {logo.url ? (
              <a href={logo.url} className={styles.tile} target="_blank" rel="noopener noreferrer" tabIndex={hidden ? -1 : undefined} aria-label={`Visit ${logo.name} website`}>
                {image}
              </a>
            ) : (
              <span className={styles.tile}>{image}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function LogoMarquee({ logos, title }: LogoMarqueeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef(0);

  // Hover eases the belt down to a crawl instead of stopping it dead, then eases it back.
  const easeSpeed = (target: number) => {
    const animations = rootRef.current?.getAnimations({ subtree: true }).filter((a) => "animationName" in a) ?? [];
    const id = ++tweenRef.current;
    const start = performance.now();
    const from = animations.map((a) => a.playbackRate);
    const step = (now: number) => {
      if (id !== tweenRef.current) return;
      const t = Math.min(1, (now - start) / 500);
      const eased = 1 - (1 - t) ** 3;
      animations.forEach((a, i) => a.updatePlaybackRate(from[i] + (target - from[i]) * eased));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // Alternate logos between the two belts so neighbours in the data (e.g. the two Viborg clubs) never sit together.
  const rows = [logos.filter((_, i) => i % 2 === 0), logos.filter((_, i) => i % 2 === 1)];

  return (
    <Section className={styles.section}>
      <Reveal className={styles.header}>
        <div className="reveal-item">
          <SectionHeader title={title} />
        </div>
        <p className={`${styles.stat} reveal-item`} style={stagger(1)}>
          <span className={styles.statNumber}>{logos.length}</span>
          brands and organisations
        </p>
      </Reveal>

      <div
        ref={rootRef}
        className={styles.marquee}
        onPointerEnter={(event) => event.pointerType === "mouse" && easeSpeed(0.15)}
        onPointerLeave={(event) => event.pointerType === "mouse" && easeSpeed(1)}
      >
        {rows.map((row, index) => (
          <div
            key={index}
            className={`${styles.row} ${index === 1 ? styles.reverse : ""}`}
            style={{ "--duration": `${row.length * 3.2}s` } as CSSProperties}
          >
            <LogoList logos={row} />
            <LogoList logos={row} hidden />
          </div>
        ))}
      </div>
    </Section>
  );
}
