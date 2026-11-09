// Serves a static folder (the built Storybook). No dependencies.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.argv[2] ?? "storybook-static");
const port = Number(process.argv[3] ?? 6007);
const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".png": "image/png", ".ico": "image/x-icon" };

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const file = join(root, normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, ""));
  try {
    const target = file.endsWith("/") || file === root ? join(file, "index.html") : file;
    res.writeHead(200, { "content-type": types[extname(target)] ?? "application/octet-stream" });
    res.end(await readFile(target));
  } catch {
    res.writeHead(404).end("not found");
  }
}).listen(port, "127.0.0.1");
