"use client";

import { useRef } from "react";
import { useCenteredWide } from "../useCenteredWide";
import styles from "./CramerDemoFrame.module.scss";

interface CramerDemoFrameProps {
  /** Relative to the case study page, so it works with and without the /portfolio base path. */
  src?: string;
  title?: string;
  height?: number;
  note?: string;
}

export function CramerDemoFrame({
  src = "../../demos/cramer/?v=20261005b", // bump with every demo rebuild so browsers drop the cached shell
  title = "Cramer, running on fake data",
  height = 720,
  note = "Mock data · scripted answers",
}: CramerDemoFrameProps) {
  const ref = useRef<HTMLElement>(null);
  useCenteredWide(ref, 1200);

  return (
    <figure ref={ref} id="live-demo" className={styles.frame}>
      <iframe
        className={styles.iframe}
        src={src}
        title={title}
        style={{ height }}
        loading="lazy"
      />
      <figcaption className={styles.caption}>
        <span>{note}</span>
        <a href={src} target="_blank" rel="noreferrer" className={styles.open}>
          Open full screen
        </a>
      </figcaption>
    </figure>
  );
}
