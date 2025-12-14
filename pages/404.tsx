import dynamic from "next/dynamic";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import "@/styles/globals.scss";

// Dynamically import NotFoundContent to handle client component in Pages Router
const NotFoundContent = dynamic(
  () => import("@/components/NotFoundContent").then((mod) => ({ default: mod.NotFoundContent })),
  { ssr: false }
);

// Dynamically import Providers to handle client component  
const Providers = dynamic(
  () => import("@/app/providers").then((mod) => ({ default: mod.Providers })),
  { ssr: false }
);

export default function Custom404() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <div className="container mx-auto">
          <Providers>
            <NotFoundContent />
          </Providers>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
