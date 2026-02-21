"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AnchoredPopover } from "@/components/ui";
import styles from "./AvailabilityCTA.module.scss";

export function AvailabilityCTA() {
  const [isCopied, setIsCopied] = useState(false);
  const copyButtonRef = useRef<HTMLButtonElement>(null);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const handleCopyEmail = async () => {
    await navigator.clipboard.writeText("jonatanbjerrekaer@gmail.com");

    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
    }

    // Force retrigger when users click repeatedly while already in success state.
    setIsCopied(false);
    requestAnimationFrame(() => setIsCopied(true));

    resetTimerRef.current = window.setTimeout(() => {
      setIsCopied(false);
    }, 1400);
  };

  return (
    <section className={styles.availability}>
      <div className={styles.content}>
        <div className={styles.status}>
          <span className={styles.dot}></span>
          Available for new opportunities
        </div>
        <h2 className={styles.title}>Looking for a Design Engineer?</h2>
        <p className={styles.description}>
          I am currently open for senior UX/UI or Design Engineer roles. Let us build interfaces that developers actually want to build.
        </p>
        <div className={styles.actions}>
          <Button
            ref={copyButtonRef}
            variant="premium"
            size="lg"
            onClick={handleCopyEmail}
            hoverIcon="document.on.document"
            hoverIconFilled={false}
            successIcon="checkmark.circle"
            successIconFilled={false}
            isSuccess={isCopied}
          >
            Get in touch
          </Button>
          <a href="https://www.linkedin.com/in/jonatandbjerrek%C3%A6r" target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="lg" hoverIcon="arrow.up.right">
              LinkedIn
            </Button>
          </a>
        </div>
        <AnchoredPopover anchorRef={copyButtonRef} isOpen={isCopied}>
          Email copied
        </AnchoredPopover>
      </div>
    </section>
  );
}