import '@testing-library/jest-dom';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    key: (index) => Array.from(store.keys())[index] ?? null,
    removeItem: (key) => {
      store.delete(key);
    },
    setItem: (key, value) => {
      store.set(key, String(value));
    },
  };
}

const localStorage = createMemoryStorage();

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: localStorage,
});

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: localStorage,
});
