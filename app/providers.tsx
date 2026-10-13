"use client";

import { HeroUIProvider } from "@heroui/react";
import { useRouter } from "next/navigation";
import { Clarity } from "@/components/Clarity";
import { CookieBanner } from "@/components/CookieBanner";

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    // next/compat/router is null under the App Router, so navigate was a no-op.
    // No useHref: internal HeroUI buttons render through next/link, which adds basePath itself.
    <HeroUIProvider navigate={(href) => router.push(href)}>
      <Clarity />
      <CookieBanner />
      {children}
    </HeroUIProvider>
  );
}

