type Node = { id: string; name: string; type: string; path: string[]; folderIds?: string[] };
export const ROOT_FOLDER_ID: string;
export const ROOT_TITLE: string;
export function topLevelFolders<T extends Node>(raw: { nodes: T[] }): T[];
export function filesForFolder<T extends Node>(raw: { nodes: T[] }, folder: Node): T[];
export function summarizeRaw(raw: { nodes: Node[] }): { nodes: number; folders: number; files: number; topFolders: number };
