const STORE_PATH = 'updates.json';
const IGNORED_VERSION_KEY = 'ignored_version';
const LAST_CHECK_DATE_KEY = 'last_check_date';

type StoreLike = {
  get<T>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<boolean>;
  save(): Promise<void>;
};

let storePromise: Promise<StoreLike | null> | null = null;

function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

async function loadStore(): Promise<StoreLike | null> {
  if (!isTauriRuntime()) {
    return null;
  }

  if (!storePromise) {
    storePromise = import('@tauri-apps/plugin-store').then(({ load }) =>
      load(STORE_PATH, { defaults: {}, autoSave: true })
    );
  }

  return storePromise;
}

function readLocalValue(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(`bruma:update:${key}`);
}

function writeLocalValue(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(`bruma:update:${key}`, value);
}

function deleteLocalValue(key: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(`bruma:update:${key}`);
}

export async function getIgnoredVersion(): Promise<string | null> {
  const store = await loadStore();
  if (!store) return readLocalValue(IGNORED_VERSION_KEY);
  return (await store.get<string>(IGNORED_VERSION_KEY)) ?? null;
}

export async function setIgnoredVersion(version: string): Promise<void> {
  const store = await loadStore();
  if (!store) {
    writeLocalValue(IGNORED_VERSION_KEY, version);
    return;
  }
  await store.set(IGNORED_VERSION_KEY, version);
  await store.save();
}

export async function clearIgnoredVersion(): Promise<void> {
  const store = await loadStore();
  if (!store) {
    deleteLocalValue(IGNORED_VERSION_KEY);
    return;
  }
  await store.delete(IGNORED_VERSION_KEY);
  await store.save();
}

export async function getLastCheckDate(): Promise<string | null> {
  const store = await loadStore();
  if (!store) return readLocalValue(LAST_CHECK_DATE_KEY);
  return (await store.get<string>(LAST_CHECK_DATE_KEY)) ?? null;
}

export async function setLastCheckDate(date: string): Promise<void> {
  const store = await loadStore();
  if (!store) {
    writeLocalValue(LAST_CHECK_DATE_KEY, date);
    return;
  }
  await store.set(LAST_CHECK_DATE_KEY, date);
  await store.save();
}

export async function isVersionIgnored(version: string): Promise<boolean> {
  return (await getIgnoredVersion()) === version;
}
