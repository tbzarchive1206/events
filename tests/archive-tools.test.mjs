import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { ROOT_FOLDER_ID, ROOT_TITLE, summarizeRaw, topLevelFolders, filesForFolder } from "../scripts/archive-tools.mjs";

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
