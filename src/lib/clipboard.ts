export function canReadClipboard(): boolean {
  return typeof navigator.clipboard?.readText === 'function';
}

export function canWriteClipboard(): boolean {
  return typeof navigator.clipboard?.writeText === 'function';
}

export async function readClipboardText(): Promise<string | null> {
  if (!canReadClipboard()) {
    return null;
  }

  try {
    return await navigator.clipboard.readText();
  } catch {
    return null;
  }
}

export async function writeClipboardText(text: string): Promise<boolean> {
  if (!canWriteClipboard()) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export async function writeClipboardHtml(
  html: string,
  plainText: string
): Promise<boolean> {
  if (typeof ClipboardItem === 'function' && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plainText], { type: 'text/plain' }),
        }),
      ]);
      return true;
    } catch {
      // Degrade to plain text below.
    }
  }

  return writeClipboardText(plainText);
}
