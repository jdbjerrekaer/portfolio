"use client";

import { ViewTransition } from "react";

/**
 * Wraps every page in a React <ViewTransition> boundary.
 * Requires `experimental.viewTransition` in next.config.ts.
 * The boundary remounts on each navigation, so the outgoing page exits
 * and the incoming page enters as a cross-fade driven by the
 * ::view-transition-old(root) / ::view-transition-new(root) rules in globals.scss.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <ViewTransition>{children}</ViewTransition>;
}
