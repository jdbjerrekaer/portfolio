"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnchoredPopover, Badge, Button, Section } from "@/components/ui";
import styles from "./AvailabilityCTA.module.scss";

export function AvailabilityCTA() {
  const emailAddress = "jonatanbjerrekaer@gmail.com";
  const [isCopied, setIsCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const copyButtonRef = useRef<HTMLButtonElement>(null);
  const resetTimerRef = useRef<number | null>(null);

  const clearCopyResetTimer = useCallback(() => {
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return clearCopyResetTimer;
  }, [clearCopyResetTimer]);

  const handleCopyEmail = async () => {
    clearCopyResetTimer();

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
    <Section className={styles.availability} innerClassName={styles.content}>
        <Badge tone="success" dot label="Available for Product Design Engineer roles" />
        <h2 className={styles.title}>Looking for a Product Design Engineer?</h2>
        <p className={styles.description}>
          I bridge product strategy, UX, design systems, and engineering feasibility so teams can move from messy problems to shipped product quality.
        </p>
        <p className={styles.email}>{emailAddress}</p>
        <div className={styles.actions}>
          <Button
            ref={copyButtonRef}
            variant="primary"
            size="lg"
            onClick={handleCopyEmail}
            icon="copy"
            successIcon="check-circle"
            isSuccess={isCopied}
          >
            Copy email
          </Button>
          <Button
            href={`mailto:${emailAddress}`}
            variant="secondary"
            size="lg"
            icon="arrow-up-right"
          >
            Email me
          </Button>
          <Button
            href="https://www.linkedin.com/in/jonatandbjerrek%C3%A6r"
            target="_blank"
            rel="noopener noreferrer"
            variant="secondary"
            size="lg"
            icon="arrow-up-right"
          >
            LinkedIn
          </Button>
        </div>
        <AnchoredPopover anchorRef={copyButtonRef} isOpen={isCopied || copyFailed}>
          {isCopied ? "Email copied" : "Opening your email app"}
        </AnchoredPopover>
    </Section>
  );
}
