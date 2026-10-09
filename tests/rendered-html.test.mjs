import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { createServer } from "vite";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

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
  assert.match(script, /\/preview/);
  assert.match(script, /folder-breadcrumbs/);
  assert.doesNotMatch(html, /iframe/iu);
});

test("renders nested folders and playable inline videos without video thumbnails", async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: "custom", optimizeDeps: { noDiscovery: true, include: [] } });
  const previousLocation = globalThis.location;
  try {
    const { EventsArchive, MediaTile } = await server.ssrLoadModule("/src/EventsArchive.tsx");
    const video = renderToStaticMarkup(createElement(MediaTile, { media: { id: "video", name: "clip.mp4", mimeType: "video/mp4", type: "file", kind: "video", path: [] } }));
    assert.match(video, /<iframe/);
    assert.match(video, /https:\/\/drive.google.com\/file\/d\/video\/preview/);
    assert.match(video, /allowFullScreen|allowfullscreen/);
    assert.doesNotMatch(video, /<img|thumbnail\?/);
    const event = { id: "event", name: "Kevin at New Era Seongsu Flagship Store Opening", mimeType: "application/vnd.google-apps.folder", type: "folder", path: ["EVENTS"] };
    const data = { generatedAt: "2026-10-09T00:00:00Z", sourceFolderId: "root", nodes: [event,
      { id: "photos", name: "Photos", mimeType: "application/vnd.google-apps.folder", type: "folder", path: ["EVENTS", event.name] },
      { id: "photo", name: "photo.jpg", mimeType: "image/jpeg", type: "file", path: ["EVENTS", event.name, "Photos"] },
      { id: "video", name: "clip.mp4", mimeType: "video/mp4", type: "file", path: ["EVENTS", event.name] },
    ] };
    globalThis.location = { hash: "#event/event" };
    const parent = renderToStaticMarkup(createElement(EventsArchive, { data }));
    assert.match(parent, /aria-label="Subfolders"/);
    assert.match(parent, /thumbnail\?id=photo/);
    assert.match(parent, /file\/d\/video\/preview/);
    assert.doesNotMatch(parent, /thumbnail\?id=video/);
    globalThis.location = { hash: "#event/event/folder/photos" };
    const nested = renderToStaticMarkup(createElement(EventsArchive, { data }));
    assert.match(nested, /aria-current="page">Photos/);
    assert.match(nested, /photo.jpg/);
    assert.doesNotMatch(nested, /<iframe/);
    globalThis.location = { hash: "#home" };
    const home = renderToStaticMarkup(createElement(EventsArchive, { data }));
    assert.match(home, /class="eyebrow">KEVIN</);
    assert.doesNotMatch(home, /NEW \(2017/);
  } finally {
    globalThis.location = previousLocation;
    await server.close();
  }
});
