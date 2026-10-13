"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./PageTransition.module.scss";

const EXIT_MS = 150;
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

// router.push() adds basePath itself; a pathname read off an <a> already has it.
function stripBasePath(path: string) {
  return BASE_PATH && (path === BASE_PATH || path.startsWith(`${BASE_PATH}/`))
    ? path.slice(BASE_PATH.length) || "/"
    : path;
}

function isModified(e: MouseEvent) {
  return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
}

/**
 * Soft page transitions without the View Transitions API.
 *
 * Why not VT: Chromium reliably drops the sticky, backdrop-filtered header
 * from the old root snapshot (and paints empty named snapshots for it), so
 * every crossfade had the nav bar vanishing, doubling, or flashing.
 * A plain exit/enter opacity animation on the page content (the header lives
 * in the layout, outside this wrapper) cannot produce any header artifact.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<"enter" | "idle" | "exit">("enter");
  const pending = useRef<string | null>(null);
  const exiting = useRef(false);

  // After the exit fade completes, perform the navigation.
  useEffect(() => {
    if (phase !== "exit") return;
    const t = setTimeout(() => {
      if (pending.current) {
        const href = pending.current;
        pending.current = null;
        router.push(href);
        // Enter phase starts on pathname change; guard against a push that
        // resolves to the same URL (no pathname change would fire).
        setTimeout(() => {
          exiting.current = false;
          setPhase((p) => (p === "exit" ? "enter" : p));
        }, 80);
      }
    }, EXIT_MS);
    return () => clearTimeout(t);
  }, [phase, router]);

  // New page mounted: play the enter animation, then settle to idle.
  useEffect(() => {
    setPhase("enter");
    exiting.current = false;
    // The router does not scroll to #hash targets after these pushes (e.g. the
    // hero "full-contact" link to /about/#karate), so do it once the page is in.
    // Instant: the page is fading in anyway, and a smooth scroll can stall or land
    // short while media above the target is still loading.
    const hash = window.location.hash.slice(1);
    const toHash = hash
      ? setTimeout(() => document.getElementById(decodeURIComponent(hash))?.scrollIntoView({ block: "start", behavior: "instant" }), 0)
      : undefined;
    const t = setTimeout(() => setPhase("idle"), 420);
    return () => {
      clearTimeout(toHash);
      clearTimeout(t);
    };
  }, [pathname]);

  // Intercept clicks on internal links and route them through the exit fade.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (isModified(e) || exiting.current) return;
      const anchor = (e.target as HTMLElement).closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      // External URLs (including other origins) navigate normally.
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      // basePath-aware: compare full paths; same page + hash → let the browser handle it
      const here = window.location.pathname + window.location.search;
      const there = url.pathname + url.search;
      if (there === here) return;
      e.preventDefault();
      pending.current = stripBasePath(url.pathname) + url.search + url.hash;
      exiting.current = true;
      setPhase("exit");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  const className =
    phase === "exit" ? styles.exit : phase === "enter" ? styles.enter : undefined;

  return (
    <div className={className} style={{ "--exit-ms": `${EXIT_MS}ms` } as React.CSSProperties}>
      {children}
    </div>
  );
}
