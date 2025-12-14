import { NotFoundContent } from "@/components/NotFoundContent";
import { Providers } from "@/app/providers";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import "@/styles/globals.scss";

export default function Custom404() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>404 - Page Not Found | Portfolio</title>
        <meta name="description" content="The page you are looking for does not exist." />
      </head>
      <body>
        <Providers>
          <SiteHeader />
          <main id="main-content">
            <div className="container mx-auto">
              <NotFoundContent />
            </div>
          </main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
