#!/usr/bin/env python3
"""Minimal static server for the MessyAction archive.

Serves static files over HTTP. The only meaningful difference from `http.server`
is cache handling: the data + manifest JSON are always served with
`Cache-Control: no-store` so that a newly released episode pages in immediately
for every visitor (no stale-episode tabs). Images can be revalidated normally.

Usage: python3 server.py [PORT]
"""
import os
import sys
import functools
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

NO_CACHE_SUFFIXES = (".json",)

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        if self.path.split("?", 1)[0].lower().endswith(NO_CACHE_SUFFIXES):
            # .json/.json?query — always fresh
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
        else:
            # immutable-ish assets: allow short revalidation, no aggressive caching
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()

def main():
    port = int(os.environ.get("PORT", sys.argv[1] if len(sys.argv) > 1 else "8080"))
    os.chdir(os.path.dirname(os.path.abspath(__file__)) or ".")
    httpd = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(f"serving on 0.0.0.0:{port}", flush=True)
    httpd.serve_forever()

if __name__ == "__main__":
    main()