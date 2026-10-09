import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { ROOT_FOLDER_ID, ROOT_TITLE, summarizeRaw, topLevelFolders, filesForFolder, childrenForFolder, photoCover, sortMedia, membersOf } from "../scripts/archive-tools.mjs";

const raw = JSON.parse(await fs.readFile(new URL("../app/data/archive.generated.json", import.meta.url), "utf8"));

test("snapshot contains a complete internally consistent Drive tree", () => {
  assert.equal(raw.sourceFolderId, ROOT_FOLDER_ID);
  const summary = summarizeRaw(raw);
  assert.equal(summary.nodes, summary.folders + summary.files);
  assert.equal(new Set(raw.nodes.map((node) => node.id)).size, summary.nodes);
  assert.ok(raw.nodes.every((node) => Array.isArray(node.path) && node.path[0] === ROOT_TITLE));
});

test("every top-level folder stays data-driven, including empty events", () => {
  const fixture = { nodes: [
    { id: "dated", name: "261009 EVENT", type: "folder", path: [ROOT_TITLE] },
    { id: "empty", name: "Backstage", type: "folder", path: [ROOT_TITLE] },
    { id: "nested", name: "Photos", type: "folder", path: [ROOT_TITLE, "261009 EVENT"] },
  ] };
  assert.deepEqual(topLevelFolders(fixture).map((folder) => folder.id), ["dated", "empty"]);
  assert.deepEqual(filesForFolder(fixture, fixture.nodes[1]), []);
  fixture.nodes.push({ id: "photo", name: "new.jpg", type: "file", mimeType: "image/jpeg", path: [ROOT_TITLE, "Backstage"] });
  assert.deepEqual(filesForFolder(fixture, fixture.nodes[1]).map((file) => file.id), ["photo"]);
});

test("folder navigation preserves each level, including empty folders and legacy snapshots", () => {
  const event = { id: "event", name: "Event", type: "folder", path: [ROOT_TITLE] };
  const nested = { id: "nested", name: "Photos", type: "folder", path: [ROOT_TITLE, "Event"] };
  const deep = { id: "deep", name: "Day 1", type: "folder", path: [ROOT_TITLE, "Event", "Photos"] };
  const direct = { id: "direct", name: "direct.jpg", type: "file", path: [ROOT_TITLE, "Event"] };
  const photo = { id: "photo", name: "photo.jpg", type: "file", path: [ROOT_TITLE, "Event", "Photos", "Day 1"] };
  const raw = { nodes: [event, nested, deep, direct, photo] };
  assert.deepEqual(childrenForFolder(raw, event).map((node) => node.id), ["nested", "direct"]);
  assert.deepEqual(childrenForFolder(raw, nested).map((node) => node.id), ["deep"]);
  assert.deepEqual(childrenForFolder(raw, deep).map((node) => node.id), ["photo"]);
  assert.deepEqual(filesForFolder(raw, nested).map((node) => node.id), ["photo"]);
  const identified = { nodes: raw.nodes.map((node) => ({ ...node, folderIds: node.id === "photo" ? [ROOT_FOLDER_ID, "event", "nested", "deep"] : node.id === "deep" ? [ROOT_FOLDER_ID, "event", "nested"] : node.id === "event" ? [ROOT_FOLDER_ID] : [ROOT_FOLDER_ID, "event"] })) };
  assert.deepEqual(childrenForFolder(identified, event).map((node) => node.id), ["nested", "direct"]);
  assert.deepEqual(childrenForFolder(identified, nested).map((node) => node.id), ["deep"]);
});

test("gallery covers always use a photo, including video-only and empty events", () => {
  const video = { id: "v", mimeType: "video/mp4" };
  const photo = { id: "p", mimeType: "image/jpeg" };
  assert.equal(photoCover([video, photo]), photo);
  assert.equal(photoCover([video]), null);
  assert.equal(photoCover([]), null);
});

test("media are chronological with stable natural filename order when dates are absent", () => {
  const media = [
    { id: "later", name: "a.jpg", createdTime: "2026-10-09T12:00:00Z" },
    { id: "early", name: "z.mp4", createdTime: "2026-10-09T10:00:00Z" },
    { id: "unknown10", name: "photo10.jpg" },
    { id: "unknown2", name: "photo2.jpg" },
    { id: "capture", name: "b.jpg", createdTime: "2026-10-09T13:00:00Z", imageMediaMetadata: { time: "2026:10:08 10:00:00Z" } },
    { id: "social", name: "allurekorea_1777349926_3885014576601969183.mp4", createdTime: "2026-10-09T15:00:00Z" },
    { id: "filename", name: "20261007_093000.jpg", createdTime: "2026-10-09T16:00:00Z" },
  ];
  const expected = ["social", "filename", "capture", "early", "later", "unknown2", "unknown10"];
  assert.deepEqual(sortMedia(media).map((node) => node.id), expected);
  assert.deepEqual(sortMedia([...media].reverse()).map((node) => node.id), expected);
  assert.equal(media[0].id, "later");
});

test("New Era brand never tags NEW but real NEW and Chanhee references still do", () => {
  assert.deepEqual(membersOf("Kevin at New Era Seongsu Flagship Store Opening"), ["KEVIN"]);
  assert.deepEqual(membersOf("Eric at New Era Seongsu Flagship Store Opening"), ["ERIC"]);
  assert.deepEqual(membersOf("NEW at New Era Seongsu Flagship Store Opening"), ["NEW"]);
  assert.deepEqual(membersOf("Chanhee at New Era"), ["NEW"]);
  assert.deepEqual(membersOf("찬희 뉴"), ["NEW"]);
});

test("new nested photos and videos belong to their event by ID even with duplicate folder names", () => {
  const folder = { id: "event-a", name: "Same name", type: "folder", path: [ROOT_TITLE] };
  const fixture = { nodes: [folder,
    { id: "photo", type: "file", path: [ROOT_TITLE, "Same name", "Photos"], folderIds: [ROOT_FOLDER_ID, "event-a", "photos"] },
    { id: "video", type: "file", path: [ROOT_TITLE, "Same name"], folderIds: [ROOT_FOLDER_ID, "event-a"] },
    { id: "other-event", type: "file", path: [ROOT_TITLE, "Same name"], folderIds: [ROOT_FOLDER_ID, "event-b"] },
  ] };
  assert.deepEqual(filesForFolder(fixture, folder).map((file) => file.id), ["photo", "video"]);
  fixture.nodes.splice(1, 1);
  assert.deepEqual(filesForFolder(fixture, folder).map((file) => file.id), ["video"]);
  assert.deepEqual(topLevelFolders({ nodes: [] }), []);
});
