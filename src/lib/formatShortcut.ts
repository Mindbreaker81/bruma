const APPLE_PLATFORM_REGEX = /Mac|iPhone|iPad/i;

function isApplePlatform(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    APPLE_PLATFORM_REGEX.test(navigator.platform)
  );
}

export function formatShortcut(shortcut: string): string {
  const isApple = isApplePlatform();

  return shortcut
    .replace(/Mod-/g, isApple ? '⌘' : 'Ctrl+')
    .replace(/Shift-/g, isApple ? '⇧' : 'Shift+')
    .replace(/Alt-/g, isApple ? '⌥' : 'Alt+');
}

export function withShortcutLabel(label: string, shortcut?: string): string {
  if (!shortcut) {
    return label;
  }

  return `${label} (${formatShortcut(shortcut)})`;
}
