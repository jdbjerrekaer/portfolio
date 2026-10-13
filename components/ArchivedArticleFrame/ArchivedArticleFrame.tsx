"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ArchivedArticleFrame.module.scss";

interface ArchivedArticleFrameProps {
  /** Relative to the article page, so it works with and without the /portfolio base path. */
  src: string;
  title: string;
}

/**
 * Same-origin iframe sized to its content. The archived posts are full email
 * documents with global <style> blocks; the frame keeps those off the site.
 */
export function ArchivedArticleFrame({ src, title }: ArchivedArticleFrameProps) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(800);

  useEffect(() => {
    const frame = ref.current;
    if (!frame) return;
    let observer: ResizeObserver | undefined;
    const fit = () => {
      const doc = frame.contentDocument;
      if (!doc?.body) return;
      setHeight(doc.documentElement.scrollHeight);
      observer?.disconnect();
      observer = new ResizeObserver(() => setHeight(doc.documentElement.scrollHeight));
      observer.observe(doc.body);
    };
    frame.addEventListener("load", fit);
    fit();
    return () => {
      frame.removeEventListener("load", fit);
      observer?.disconnect();
    };
  }, []);

  return <iframe ref={ref} className={styles.frame} src={src} title={title} style={{ height }} />;
}
