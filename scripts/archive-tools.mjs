export const ROOT_FOLDER_ID = "1aD839ETHAmuVLlvXyGKT-ogKZpW4aCBr";
export const ROOT_TITLE = "EVENTS";

export function topLevelFolders(raw) {
  return raw.nodes.filter((node) => node.type === "folder" && node.path.length === 1);
}

export function filesForFolder(raw, folder) {
  return raw.nodes.filter((node) => node.type === "file" &&
    (Array.isArray(node.folderIds) ? node.folderIds.includes(folder.id) : node.path[1] === folder.name));
}

export function summarizeRaw(raw) {
  return {
    nodes: raw.nodes.length,
    folders: raw.nodes.filter((node) => node.type === "folder").length,
    files: raw.nodes.filter((node) => node.type === "file").length,
    topFolders: topLevelFolders(raw).length,
  };
}
