"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AnchoredPopover } from "@/components/ui";
import styles from "./AvailabilityCTA.module.scss";

export function AvailabilityCTA() {
  const emailAddress = "jonatanbjerrekaer@gmail.com";
  const [isCopied, setIsCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
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
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
    }

    try {
      await navigator.clipboard.writeText(emailAddress);
      setCopyFailed(false);

      // Force retrigger when users click repeatedly while already in success state.
      setIsCopied(false);
      requestAnimationFrame(() => setIsCopied(true));

      resetTimerRef.current = window.setTimeout(() => {
        setIsCopied(false);
      }, 1400);
    } catch {
      setIsCopied(false);
      setCopyFailed(true);
      window.location.href = `mailto:${emailAddress}`;
    }
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
        <p className={styles.email}>{emailAddress}</p>
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
            Copy email
          </Button>
          <a href={`mailto:${emailAddress}`}>
            <Button
              variant="secondary"
              size="lg"
              hoverIcon="arrow.up.right"
            >
              Email me
            </Button>
          </a>
          <a
            href="https://www.linkedin.com/in/jonatandbjerrek%C3%A6r"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="secondary"
              size="lg"
              hoverIcon="arrow.up.right"
            >
              LinkedIn
            </Button>
          </a>
        </div>
        <AnchoredPopover anchorRef={copyButtonRef} isOpen={isCopied || copyFailed}>
          {isCopied ? "Email copied" : "Opening your email app"}
        </AnchoredPopover>
      </div>
    </section>
  );
}