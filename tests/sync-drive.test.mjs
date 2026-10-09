import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { ROOT_FOLDER_ID, filesForFolder, topLevelFolders } from "../scripts/archive-tools.mjs";

test("Drive sync follows pagination and nested folders and replaces the previous snapshot", async () => {
  const temporary = await mkdtemp(path.join(tmpdir(), "events-sync-"));
  try {
    await cp(new URL("../scripts/", import.meta.url), path.join(temporary, "scripts"), { recursive: true });
    await mkdir(path.join(temporary, "app/data"), { recursive: true });
    const output = path.join(temporary, "app/data/archive.generated.json");
    await writeFile(output, JSON.stringify({ nodes: [{ id: "deleted" }] }));
    const mock = path.join(temporary, "mock.mjs");
    await writeFile(mock, `
      globalThis.fetch = async (url) => {
        const params = new URL(url).searchParams;
        const folder = params.get("q").split("'")[1];
        const directory = (id, name) => ({ id, name, mimeType: "application/vnd.google-apps.folder" });
        let data;
        if (folder === ${JSON.stringify(ROOT_FOLDER_ID)}) {
          data = params.has("pageToken")
            ? { files: [directory("empty", "Empty folder")] }
            : { files: [directory("event", "Backstage")], nextPageToken: "page2" };
        } else if (folder === "event") {
          data = { files: [directory("nested", "Photos"), { id: "video", name: "new.mp4", mimeType: "video/mp4" }] };
        } else if (folder === "nested") {
          data = { files: [{ id: "photo", name: "new.jpg", mimeType: "image/jpeg", imageMediaMetadata: { time: "2026:10:09 10:00:00Z" } }] };
        } else if (folder === "empty") data = { files: [] };
        else throw new Error("Unexpected folder " + folder);
        return { ok: true, json: async () => data };
      };
    `);
    await promisify(execFile)(process.execPath, ["--import", pathToFileURL(mock).href, path.join(temporary, "scripts/sync-drive.mjs")], {
      env: { ...process.env, GOOGLE_DRIVE_API_KEY: "test-key" },
    });
    const raw = JSON.parse(await readFile(output, "utf8"));
    assert.equal(raw.sourceFolderId, ROOT_FOLDER_ID);
    assert.ok(Number.isFinite(Date.parse(raw.generatedAt)));
    assert.deepEqual(topLevelFolders(raw).map((folder) => folder.id), ["event", "empty"]);
    assert.deepEqual(filesForFolder(raw, raw.nodes[0]).map((file) => file.id), ["video", "photo"]);
    assert.equal(raw.nodes.some((node) => node.id === "deleted"), false);
    assert.deepEqual(raw.nodes.find((node) => node.id === "photo").folderIds, [ROOT_FOLDER_ID, "event", "nested"]);
    assert.equal(raw.nodes.find((node) => node.id === "photo").imageMediaMetadata.time, "2026:10:09 10:00:00Z");
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
