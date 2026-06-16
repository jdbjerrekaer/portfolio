import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { withBasePath } from "@/lib/utils/paths";
import "@/styles/globals.scss";

const openRunde = localFont({
  src: [
    {
      path: "../public/fonts/OpenRunde-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/OpenRunde-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/OpenRunde-Semibold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/OpenRunde-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-open-runde",
});

export const metadata: Metadata = {
  title: {
    default: "Design engineer portfolio",
    template: "%s | Portfolio",
  },
  description: "Design Engineer & Technical UX Designer portfolio showcasing projects and work.",
  icons: {
    icon: withBasePath("/icon.png"),
    apple: withBasePath("/apple-icon.png"),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={openRunde.variable}>
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
