#!/usr/bin/env python3
"""Local preview server for npchecklist.html with auto-refresh.

Serves the file as-is and injects a tiny polling reload script only in the
HTTP response — the file on disk is never modified, so it always stays
byte-for-byte what eventually gets published to the Claude Artifact.
"""
import http.server
import os
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5555
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
TARGET_FILE = "npchecklist.html"

RELOAD_JS = b"""
<script>
(function () {
  var last = null;
  setInterval(function () {
    fetch("/__mtime", { cache: "no-store" }).then(function (r) { return r.text(); }).then(function (t) {
      if (last === null) { last = t; }
      else if (t !== last) { location.reload(); }
    }).catch(function () {});
  }, 1000);
})();
</script>
"""


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        if self.path == "/__mtime":
            try:
                mtime = os.path.getmtime(os.path.join(DIRECTORY, TARGET_FILE))
            except OSError:
                mtime = 0
            body = str(mtime).encode()
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)
            return

        if self.path in ("/", "/" + TARGET_FILE):
            filepath = os.path.join(DIRECTORY, TARGET_FILE)
            with open(filepath, "rb") as f:
                content = f.read()
            content += RELOAD_JS
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(content)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(content)
            return

        super().do_GET()

    def log_message(self, format, *args):
        pass


if __name__ == "__main__":
    with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
        print("Serving at http://127.0.0.1:%d/npchecklist.html" % PORT)
        httpd.serve_forever()
