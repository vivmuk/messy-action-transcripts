#!/usr/bin/env python3
"""Minimal static server for the MessyAction archive.

Cache policy: EVERYTHING is served `no-cache` (revalidate) + `no-store` on .json,
so a newly released episode or layout change pages in immediately and there is
no stale-HTMl/stale-image window for any visitor or intermediate proxy.

Usage: python3 server.py [PORT]
"""
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        if self.path.split("?", 1)[0].lower().endswith(".json"):
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
        else:
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        super().end_headers()

def main():
    port = int(os.environ.get("PORT", sys.argv[1] if len(sys.argv) > 1 else "8080"))
    os.chdir(os.path.dirname(os.path.abspath(__file__)) or ".")
    httpd = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(f"serving on 0.0.0.0:{port}", flush=True)
    httpd.serve_forever()

if __name__ == "__main__":
    main()
