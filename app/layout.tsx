import type { Metadata } from "next";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import "@/styles/globals.scss";

export const metadata: Metadata = {
  title: {
    default: "Jonatan Designer Portfolio",
    template: "%s | Portfolio",
  },
  description: "Design Engineer & Technical UX Designer portfolio showcasing projects and work.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <SiteHeader />
          <main id="main-content">
            {children}
          </main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
