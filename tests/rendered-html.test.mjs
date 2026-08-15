import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

test("builds the self-contained Events archive for GitHub Pages", async () => {
  const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
  const assets = await readdir(new URL("../dist/assets/", import.meta.url));
  const scriptName = assets.find((name) => name.endsWith(".js"));
  assert.ok(scriptName, "compiled JavaScript asset is missing");
  const script = await readFile(new URL(`../dist/assets/${scriptName}`, import.meta.url), "utf8");
  assert.match(html, /EVENTS — THE BOYZ ARCHIVE/);
  assert.match(html, /\.\/assets\//);
  assert.match(script, /SEARCH EVENT TITLE OR YYMMDD DATE/);
  assert.match(script, /ALL YEARS/);
  assert.match(script, /ALL MONTHS/);
  assert.match(script, /ALL MEMBERS/);
  assert.match(script, /drive\.google\.com\/thumbnail/);
  assert.match(script, /Generated preview/);
  assert.doesNotMatch(html, /iframe/iu);
});
