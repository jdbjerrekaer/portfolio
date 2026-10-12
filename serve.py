#!/usr/bin/env python3
"""Static preview server with no-store cache headers (SPA-style: .html fallback)."""
import http.server
import os
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 7100


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def send_head(self):
        path = self.translate_path(self.path)
        # Extensionless path (e.g. /about/) -> serve out/about/index.html
        if not os.path.exists(path) and not path.endswith((".css", ".js", ".json", ".png", ".jpg", ".svg", ".webp", ".ico", ".txt", ".mp4", ".woff2")):
            html = os.path.join(path, "index.html")
            if os.path.isfile(html):
                self.path = self.path.rstrip("/") + "/index.html"
        return super().send_head()

    def log_message(self, *args):
        pass


http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
