"use client";

import { PageTransition } from "@/components/PageTransition/PageTransition";

/**
 * Remounts on every navigation. PageTransition plays a short exit fade on
 * link clicks and an enter fade + rise on the new page. The site header and
 * footer live in the layout, outside this wrapper, so they stay perfectly
 * static during page changes.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
