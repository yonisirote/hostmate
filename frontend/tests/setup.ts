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
// Note: Node 25+ may emit a noisy `--localstorage-file` warning when
// experimental web storage is initialized without a persistence path.
// Avoid relying on `NODE_OPTIONS` (CI restricts allowed flags) and instead
// filter the specific warning line from Vitest output.
const originalStderrWrite = process.stderr.write.bind(process.stderr);
process.stderr.write = (chunk, encoding, callback) => {
  const text = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
  if (text.includes('--localstorage-file') && text.includes('was provided without a valid path')) {
    if (typeof callback === 'function') callback();
    return true;
  }

  // @ts-expect-error - Node's stderr.write has multiple overloads
  return originalStderrWrite(chunk, encoding, callback);
};

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
