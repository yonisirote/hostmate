import '@testing-library/jest-dom/vitest';

import { afterAll, afterEach, beforeAll, vi } from 'vitest';

import { server } from './msw/server';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});

afterAll(() => {
  server.close();
});

// Minimal browser APIs used by the app
Object.assign(globalThis, {
  matchMedia: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
    addListener: () => {},
    removeListener: () => {},
  }),
});

// localStorage shim.
// Note: Node 25+ may emit a `--localstorage-file` warning when experimental
// web storage is initialized without a persistence path (observed via MSW).
// We set `NODE_OPTIONS=--localstorage-file=...` in npm scripts to avoid it.
const store = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  },
});

// Clipboard: let `@testing-library/user-event` manage this where possible.
// Some versions of user-event try to define `navigator.clipboard` themselves,
// so only provide a minimal shim when it's missing.
if (!('clipboard' in navigator)) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
  });
}
