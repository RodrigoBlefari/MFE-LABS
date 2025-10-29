import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");
const rootDir = resolve(__dirname, "..", "dist-webcomponent");
const port = Number.parseInt(process.env.PORT ?? "9400", 10);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function toSafePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  if (decoded === "/" || decoded === "") {
    return join(rootDir, "index.html");
  }
  return resolve(rootDir, "." + decoded);
}

const server = createServer(async (req, res) => {
  try {
    const filePath = toSafePath(req.url ?? "/");
    if (!filePath.startsWith(rootDir)) {
      res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Forbidden");
      return;
    }

    const data = await readFile(filePath);
    const contentType = mimeTypes[extname(filePath)] ?? "application/octet-stream";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
      "Cross-Origin-Resource-Policy": "cross-origin",
      "Cache-Control": "no-cache",
    });
    res.end(data);
  } catch (err) {
    const status = err.code === "ENOENT" ? 404 : 500;
    const message = status === 404 ? "Not Found" : "Internal Server Error";
    res.writeHead(status, {
      "Content-Type": "text/plain; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache",
    });
    if (status === 500) {
      console.error("Erro ao servir recurso", err);
    }
    res.end(message);
  }
});

server.listen(port, () => {
  console.log(`Webcomponent Angular servido em http://localhost:${port}`);
  console.log(`Origem: ${rootDir}`);
});
