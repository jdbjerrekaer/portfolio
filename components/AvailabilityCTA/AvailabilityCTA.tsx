"use client";

import { useEffect, useRef, useState } from "react";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { Icon, Section } from "@/components/ui";
import { Reveal, stagger } from "@/components/Reveal";
import styles from "./AvailabilityCTA.module.scss";

const EMAIL = "jonatanbjerrekaer@gmail.com";

const links = [
  { label: "Email me", href: `mailto:${EMAIL}?subject=Hello%20Jonatan` },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/jonatandbjerrek%C3%A6r", external: true },
  { label: "GitHub", href: "https://github.com/jdbjerrekaer", external: true },
];

type CopyState = "idle" | "copied" | "failed";

// "failed" opens the mail app instead, so the pill only ever needs these two widths.
const labels = { idle: "Copy", copied: "Copied" } as const;

export function AvailabilityCTA() {
  const [state, setState] = useState<CopyState>("idle");
  const resetTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (resetTimer.current) window.clearTimeout(resetTimer.current);
  }, []);

  const copyEmail = async () => {
    if (resetTimer.current) window.clearTimeout(resetTimer.current);
    try {
      await navigator.clipboard.writeText(EMAIL);
      setState("copied");
    } catch {
      setState("failed");
      window.location.href = `mailto:${EMAIL}`;
    }
    resetTimer.current = window.setTimeout(() => setState("idle"), 1800);
  };

  return (
    <Section className={styles.availability}>
      <Reveal>
        <p className={`${styles.status} reveal-item`}>
          <span className={styles.dot} aria-hidden="true" />
          Available for Product Design Engineer roles
        </p>
        <h2 className={`${styles.title} reveal-item`} style={stagger(1)}>
          Looking for a Product Design Engineer?
        </h2>

        <div className="reveal-item" style={stagger(2)}>
          <button type="button" className={styles.email} onClick={copyEmail} data-state={state}>
            <span className={styles.address}>{EMAIL}</span>
            <span className={styles.copy} aria-hidden="true">
              <span className={styles.labels}>
                {(Object.keys(labels) as (keyof typeof labels)[]).map((key) => (
                  <span key={key} className={styles.label} data-active={key === (state === "copied" ? "copied" : "idle")}>
                    {labels[key]}
                  </span>
                ))}
              </span>
              <Icon name={state === "copied" ? "check-circle" : "copy"} size={16} />
            </span>
            <span className="sr-only">Copy email address</span>
          </button>
          <span className="sr-only" aria-live="polite">
            {state === "copied" ? "Email address copied" : ""}
          </span>
        </div>

        <div className={`${styles.footer} reveal-item`} style={stagger(3)}>
          <p className={styles.description}>
            I bridge product strategy, UX, design systems and engineering feasibility, so teams can move from messy problems to shipped product quality.
          </p>
          <ul className={styles.links}>
            {links.map((link) => (
              <li key={link.label}>
                <AnimateIcon animateOnHover asChild>
                  <a
                    href={link.href}
                    className={styles.link}
                    {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    {link.label}
                    <Icon name="arrow-up-right" size={16} />
                  </a>
                </AnimateIcon>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </Section>
  );
}
