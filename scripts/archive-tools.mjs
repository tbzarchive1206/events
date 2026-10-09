export const ROOT_FOLDER_ID = "1aD839ETHAmuVLlvXyGKT-ogKZpW4aCBr";
export const ROOT_TITLE = "EVENTS";

export function topLevelFolders(raw) {
  return raw.nodes.filter((node) => node.type === "folder" && node.path.length === 1);
}

export function filesForFolder(raw, folder) {
  return raw.nodes.filter((node) => node.type === "file" &&
    (Array.isArray(node.folderIds) ? node.folderIds.includes(folder.id) :
      [...folder.path, folder.name].every((part, index) => node.path[index] === part)));
}

export function childrenForFolder(raw, folder) {
  const prefix = [...folder.path, folder.name];
  return raw.nodes.filter((node) => Array.isArray(node.folderIds)
    ? node.folderIds.at(-1) === folder.id
    : node.path.length === prefix.length && prefix.every((part, index) => node.path[index] === part));
}

export function photoCover(media) {
  return media.find((item) => item.mimeType.startsWith("image/")) || null;
}

export function mediaTime(node) {
  const captured = node.imageMediaMetadata?.time;
  const captureTime = captured ? Date.parse(captured.replace(/^(\d{4}):(\d{2}):(\d{2}) /u, "$1-$2-$3T")) : NaN;
  if (Number.isFinite(captureTime)) return captureTime;
  // Exported social media names often contain the original Unix timestamp.
  const timestamp = node.name.match(/(?:^|\D)((?:1[5-9]|2[0-2])\d{8})(?=\D|$)/u);
  if (timestamp) return Number(timestamp[1]) * 1000;
  const date = node.name.match(/(?:^|\D)(20\d{2})[-_]?([01]\d)[-_]?([0-3]\d)(?:[T _-]([0-2]\d)[-_:]?([0-5]\d)[-_:]?([0-5]\d))?(?=\D|$)/u);
  if (date) {
    const time = Date.parse(`${date[1]}-${date[2]}-${date[3]}T${date[4] || "00"}:${date[5] || "00"}:${date[6] || "00"}Z`);
    if (Number.isFinite(time)) return time;
  }
  const created = Date.parse(node.createdTime || "");
  if (Number.isFinite(created)) return created;
  const modified = Date.parse(node.modifiedTime || "");
  return Number.isFinite(modified) ? modified : Infinity;
}

export function sortMedia(media) {
  return [...media].sort((a, b) => {
    const first = mediaTime(a), second = mediaTime(b);
    return (first === second ? 0 : first < second ? -1 : 1) ||
      a.name.localeCompare(b.name, "en", { numeric: true }) || a.id.localeCompare(b.id);
  });
}

const memberPatterns = [
  ["SANGYEON", /SANGYEON|상연/iu], ["JACOB", /JACOB|제이콥/iu], ["YOUNGHOON", /YOUNGHOON|영훈/iu],
  ["HYUNJAE", /HYUNJAE|현재/iu], ["JUYEON", /JUYEON|주연/iu], ["KEVIN", /KEVIN|케빈/iu],
  ["Q", /(?:^|[^A-Z])Q(?:[^A-Z]|$)|CHANGMIN|창민|큐/iu], ["SUNWOO", /SUNWOO|선우/iu], ["ERIC", /ERIC|에릭/iu],
  ["HAKNYEON", /HAKNYEON|JUHAKNYEON|학년/iu], ["NEW", /(?:^|[^A-Z])NEW(?:[^A-Z]|$)|CHANHEE|찬희|(?:^|[^\p{L}\p{N}])뉴(?:[^\p{L}\p{N}]|$)/iu],
];

export function membersOf(value) {
  const names = value.replace(/\bnew\s+era\b/giu, "");
  return memberPatterns.filter(([, pattern]) => pattern.test(names)).map(([member]) => member);
}

export function summarizeRaw(raw) {
  return {
    nodes: raw.nodes.length,
    folders: raw.nodes.filter((node) => node.type === "folder").length,
    files: raw.nodes.filter((node) => node.type === "file").length,
    topFolders: topLevelFolders(raw).length,
  };
}
