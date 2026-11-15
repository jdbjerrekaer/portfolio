"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";

/** next/link whose icons animate on hover. Client-side because AnimateIcon's Slot needs the real Link type, not a server reference. */
export function AnimatedLink(props: ComponentProps<typeof Link>) {
  return (
    <AnimateIcon animateOnHover asChild>
      <Link {...props} />
    </AnimateIcon>
  );
}
