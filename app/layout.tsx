import type { Metadata } from "next";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import "@/styles/globals.scss";

// #region agent log
const basePath = process.env.BASE_PATH || process.env.NEXT_PUBLIC_BASE_PATH || "";
fetch('http://127.0.0.1:7243/ingest/198c5c55-2524-45ed-b90b-05a4e1c6069f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/layout.tsx:7',message:'BasePath check',data:{basePath,hasBasePath:!!basePath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
// #endregion

export const metadata: Metadata = {
  title: {
    default: "Jonatan Designer Portfolio",
    template: "%s | Portfolio",
  },
  description: "Design Engineer & Technical UX Designer portfolio showcasing projects and work.",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

// #region agent log
fetch('http://127.0.0.1:7243/ingest/198c5c55-2524-45ed-b90b-05a4e1c6069f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/layout.tsx:20',message:'Metadata icons config',data:{icons:metadata.icons},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7243/ingest/198c5c55-2524-45ed-b90b-05a4e1c6069f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/layout.tsx:28',message:'Client-side render - checking favicon links',data:{faviconLinks:Array.from(document.querySelectorAll('link[rel*="icon"]')).map(l=>({rel:l.getAttribute('rel'),href:l.getAttribute('href')}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  }
  // #endregion
  
  return (
    <html lang="en">
      <head>
        {/* #region agent log */}
        <script dangerouslySetInnerHTML={{__html: `
          (function() {
            function log(payload) {
              fetch('http://127.0.0.1:7243/ingest/198c5c55-2524-45ed-b90b-05a4e1c6069f', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
              }).catch(function(){});
            }
            setTimeout(function() {
              var links = Array.from(document.querySelectorAll('link[rel*="icon"]'));
              log({
                location: 'app/layout.tsx:head',
                message: 'Actual HTML favicon links',
                data: {
                  links: links.map(function(l) {
                    return {rel: l.getAttribute('rel'), href: l.getAttribute('href')};
                  }),
                  basePath: '${basePath}'
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'D'
              });
              Promise.all([
                fetch('/favicon.ico', { method: 'HEAD' }).then(function(r){ return {url: r.url, status: r.status, type: r.headers.get('content-type'), length: r.headers.get('content-length')}; }).catch(function(){ return {url: '/favicon.ico', error: true}; }),
                fetch('/favicon.ico?favicon.0b3bf435.ico', { method: 'HEAD' }).then(function(r){ return {url: r.url, status: r.status, type: r.headers.get('content-type'), length: r.headers.get('content-length')}; }).catch(function(){ return {url: '/favicon.ico?favicon.0b3bf435.ico', error: true}; }),
                fetch('/icon.png', { method: 'HEAD' }).then(function(r){ return {url: r.url, status: r.status, type: r.headers.get('content-type'), length: r.headers.get('content-length')}; }).catch(function(){ return {url: '/icon.png', error: true}; }),
                fetch('/apple-icon.png', { method: 'HEAD' }).then(function(r){ return {url: r.url, status: r.status, type: r.headers.get('content-type'), length: r.headers.get('content-length')}; }).catch(function(){ return {url: '/apple-icon.png', error: true}; })
              ]).then(function(results){
                log({
                  location: 'app/layout.tsx:head',
                  message: 'Favicon HEAD responses',
                  data: { results: results },
                  timestamp: Date.now(),
                  sessionId: 'debug-session',
                  runId: 'run1',
                  hypothesisId: 'D'
                });
              });
            }, 100);
          })();
        `}} />
        {/* #endregion */}
      </head>
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
