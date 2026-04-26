const MAX_RECENT_FILES = 10;

export function addRecentFile(path: string, recentFiles: string[]): string[] {
  const normalized = path.trim();

  if (!normalized) {
    return recentFiles;
  }

  return [
    normalized,
    ...recentFiles.filter((item) => item !== normalized),
  ].slice(0, MAX_RECENT_FILES);
}

export function removeRecentFile(
  path: string,
  recentFiles: string[]
): string[] {
  return recentFiles.filter((item) => item !== path);
}
