import { readImageAsDataUrl } from '../features/files/ipc';

type ImageResolver = (
  basePath: string,
  relativeSrc: string
) => Promise<string | null>;

function isAbsoluteUrl(value: string): boolean {
  try {
    return Boolean(new URL(value));
  } catch {
    return false;
  }
}

export async function resolveLocalImages(
  html: string,
  basePath: string | null,
  resolver: ImageResolver = readImageAsDataUrl
): Promise<string> {
  if (!basePath) return html;

  const isDocument = /<!doctype\s+html|<html[\s>]/i.test(html);
  const root: Document | DocumentFragment = isDocument
    ? new DOMParser().parseFromString(html, 'text/html')
    : document.createRange().createContextualFragment(html);
  const images = Array.from(root.querySelectorAll('img'));

  await Promise.all(
    images.map(async (image) => {
      const source = image.getAttribute('src') ?? '';
      if (!source || isAbsoluteUrl(source)) return;

      const dataUrl = await resolver(basePath, source);
      if (dataUrl) {
        image.setAttribute('src', dataUrl);
      }
    })
  );

  if (root instanceof Document) {
    return `<!doctype html>\n${root.documentElement.outerHTML}`;
  }

  const container = document.createElement('div');
  container.append(root.cloneNode(true));
  return container.innerHTML;
}
