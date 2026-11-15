"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./CookieBanner.module.scss";

declare global {
  interface Window {
    gtag?: (command: string, action: string, params?: Record<string, string>) => void;
  }
}

// Same keys the previous Silktide banner wrote, so earlier choices still count and Clarity keeps reading them.
const CHOICE_KEY = "silktideCookieBanner_InitialChoice";
const ANALYTICS_KEY = "silktideCookieChoice_analytics";
const NECESSARY_KEY = "silktideCookieChoice_necessary";
const OPEN_EVENT = "openCookieSettings";

type Phase = "hidden" | "open" | "accepting" | "declining";

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage: the choice still applies for this visit.
  }
};

export function CookieBanner() {
  const [phase, setPhase] = useState<Phase>("hidden");
  const acceptRef = useRef<HTMLButtonElement>(null);
  const reopened = useRef(false);

  useEffect(() => {
    // First visit: wait until the hero has settled instead of competing with it.
    const timer = read(CHOICE_KEY) ? 0 : window.setTimeout(() => setPhase("open"), 1400);
    const reopen = () => {
      reopened.current = true;
      setPhase("open");
    };
    window.addEventListener(OPEN_EVENT, reopen);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(OPEN_EVENT, reopen);
    };
  }, []);

  // Opened from the footer: move focus into the card so keyboard users land on it.
  useEffect(() => {
    if (phase === "open" && reopened.current) {
      reopened.current = false;
      acceptRef.current?.focus();
    }
  }, [phase]);

  const choose = (granted: boolean) => {
    write(CHOICE_KEY, "true");
    write(NECESSARY_KEY, "true");
    write(ANALYTICS_KEY, String(granted));
    window.gtag?.("consent", "update", { analytics_storage: granted ? "granted" : "denied" });
    window.dispatchEvent(
      new CustomEvent(granted ? "analyticsConsentGranted" : "analyticsConsentRejected", {
        detail: { cookieType: "analytics" },
      }),
    );
    setPhase(granted ? "accepting" : "declining");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Accepting plays the bite before the card leaves; declining just leaves.
    window.setTimeout(() => setPhase("hidden"), reduced ? 200 : granted ? 1050 : 320);
  };

  if (phase === "hidden") return null;

  return (
    <section className={styles.banner} data-phase={phase} aria-labelledby="cookie-banner-title">
      <svg className={styles.cookie} viewBox="0 0 56 56" aria-hidden="true">
        <g className={styles.cookieBody}>
          <circle cx="28" cy="28" r="23" className={styles.dough} />
          <circle cx="28" cy="28" r="23" className={styles.rim} />
          <circle cx="20" cy="19" r="3.2" className={styles.chip} />
          <circle cx="33" cy="16" r="2.4" className={styles.chip} />
          <circle cx="36" cy="30" r="3.4" className={styles.chip} />
          <circle cx="22" cy="34" r="2.6" className={styles.chip} />
          <circle cx="29" cy="41" r="2.2" className={styles.chip} />
          <circle cx="16" cy="27" r="1.6" className={styles.chip} />
          {/* Bites are card-coloured circles that grow over the edge. */}
          <circle cx="47" cy="13" r="8" className={styles.bite} />
          <circle cx="51" cy="25" r="6.5" className={`${styles.bite} ${styles.biteSecond}`} />
        </g>
        <circle cx="44" cy="30" r="1.6" className={styles.crumb} />
        <circle cx="48" cy="33" r="1.2" className={`${styles.crumb} ${styles.crumbTwo}`} />
        <circle cx="41" cy="35" r="1" className={`${styles.crumb} ${styles.crumbThree}`} />
      </svg>

      <div className={styles.content}>
        <h2 id="cookie-banner-title" className={styles.title}>
          Cookies, just the one kind
        </h2>
        <p className={styles.text}>
          I use Microsoft Clarity to see which pages people read and where they get stuck. It only runs if you say yes.{" "}
          <Link href="/cookie-policy/" className={styles.policy}>
            Cookie policy
          </Link>
        </p>
        <div className={styles.actions}>
          <button ref={acceptRef} type="button" className={styles.accept} onClick={() => choose(true)}>
            Sounds good
          </button>
          <button type="button" className={styles.decline} onClick={() => choose(false)}>
            No thanks
          </button>
        </div>
      </div>
    </section>
  );
}

/** Footer entry point for changing the choice later. */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}>
      Cookie settings
    </button>
  );
}
