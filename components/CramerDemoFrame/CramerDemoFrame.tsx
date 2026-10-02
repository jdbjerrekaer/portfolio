"use client";

import { useRef } from "react";
import { useCenteredWide } from "../useCenteredWide";
import styles from "./CramerDemoFrame.module.scss";

interface CramerDemoFrameProps {
  /** Relative to the case study page, so it works with and without the /portfolio base path. */
  src?: string;
  title?: string;
  height?: number;
}

export function CramerDemoFrame({
  src = "../../demos/cramer/",
  title = "Cramer, running on fake data",
  height = 720,
}: CramerDemoFrameProps) {
  const ref = useRef<HTMLElement>(null);
  useCenteredWide(ref, 1200);

  return (
    <figure ref={ref} className={styles.frame}>
      <iframe
        className={styles.iframe}
        src={src}
        title={title}
        style={{ height }}
        loading="lazy"
      />
      <figcaption className={styles.caption}>
        <span>Mock data · scripted answers</span>
        <a href={src} target="_blank" rel="noreferrer" className={styles.open}>
          Open full screen
        </a>
      </figcaption>
    </figure>
  );
}
