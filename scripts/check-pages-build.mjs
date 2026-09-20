import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectDir = fileURLToPath(new URL("../", import.meta.url));
const outputDir = path.join(projectDir, "dist-pages");
const indexFile = path.join(outputDir, "index.html");
const html = await readFile(indexFile, "utf8");

// Resolve URLs the same way a browser does, including a GitHub project subpath.
async function checkAsset(reference, sourceFile) {
  if (reference.startsWith("data:") || reference.startsWith("#")) return;
  assert(!reference.startsWith("/"), `Root-relative asset: ${reference}`);
  assert(!/^[a-z][a-z\d+.-]*:/i.test(reference), `External asset: ${reference}`);

  const sourceRelative = path.relative(outputDir, sourceFile).split(path.sep).join("/");
  for (const mount of ["/", "/GoldFishBreeder/", "/another-project/"]) {
    const mountedBase = new URL(mount, "https://example.test");
    const sourceUrl = new URL(sourceRelative, mountedBase);
    const assetUrl = new URL(reference, sourceUrl);
    assert(assetUrl.pathname.startsWith(mount), `Asset escapes ${mount}: ${reference}`);
    const assetRelative = decodeURIComponent(assetUrl.pathname.slice(mount.length));
    const assetFile = path.resolve(outputDir, assetRelative);
    assert(!path.relative(outputDir, assetFile).startsWith(".."), `Asset escapes output: ${reference}`);
    assert((await stat(assetFile)).isFile(), `Missing asset: ${reference}`);
  }
}

const htmlAssets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
assert(htmlAssets.some((asset) => /\.js$/.test(asset)), "Missing compiled JavaScript");
assert(htmlAssets.some((asset) => /\.css$/.test(asset)), "Missing compiled CSS");
assert(htmlAssets.includes("./favicon.svg"), "Missing relative favicon");
assert(!html.includes(".tsx") && !html.includes("/@vite/client"), "Development entry in output");
await Promise.all(htmlAssets.map((asset) => checkAsset(asset, indexFile)));

const assetDir = path.join(outputDir, "assets");
const cssFiles = (await readdir(assetDir)).filter((file) => file.endsWith(".css"));
let aquariumReferences = 0;
for (const filename of cssFiles) {
  const cssFile = path.join(assetDir, filename);
  const css = await readFile(cssFile, "utf8");
  for (const match of css.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/g)) {
    const reference = match[2];
    if (reference.endsWith("aquarium-bg.png")) aquariumReferences += 1;
    await checkAsset(reference, cssFile);
  }
}
assert(aquariumReferences >= 2, "Missing aquarium and tank-thumbnail backgrounds");

for (const filename of ["aquarium-bg.png", "favicon.svg"]) {
  const original = await readFile(path.join(projectDir, "public", filename));
  const copied = await readFile(path.join(outputDir, filename));
  assert(original.equals(copied), `Public asset was not copied correctly: ${filename}`);
}

const outputEntries = await readdir(outputDir);
for (const serverArtifact of ["server", "_worker.js", "wrangler.json", "wrangler.jsonc"]) {
  assert(!outputEntries.includes(serverArtifact), `Server artifact in static output: ${serverArtifact}`);
}

console.log("Pages build verified: compiled client assets, backgrounds, favicon, root and project URLs; no server artifacts.");
