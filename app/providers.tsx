"use client";

import { HeroUIProvider } from "@heroui/react";
import { useRouter } from "next/navigation";
import { Clarity } from "@/components/Clarity";
import { CookieBanner } from "@/components/CookieBanner";

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <HeroUIProvider navigate={router.push}>
      <Clarity />
      <CookieBanner />
      {children}
    </HeroUIProvider>
  );
}

