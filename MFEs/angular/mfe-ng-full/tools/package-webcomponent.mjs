import { cp, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distBrowser = join(__dirname, "..", "dist", "browser");
const outDir = join(__dirname, "..", "dist-webcomponent");
const bridgeSource = join(__dirname, "..", "mfe-ng-full.js");

await rm(outDir, { recursive: true, force: true });
await cp(distBrowser, outDir, { recursive: true });
await cp(bridgeSource, join(outDir, "mfe-ng-full.js"));

console.log("Bundle copiado para", outDir);
console.log("Sirva com: serve -l 9400", outDir);

