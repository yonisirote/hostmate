type Listener = (token: string | null) => void;

const STORAGE_KEY = "auth_token";
let accessToken: string | null = null;
const listeners = new Set<Listener>();

export function setAccessToken(token: string | null) {
  accessToken = token ?? null;

  // Persist to localStorage so other tabs can detect changes
  if (token === null) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, token);
  }

  listeners.forEach((listener) => listener(accessToken));
}

export function getAccessToken() {
  // If in-memory token is empty, try to get from storage
  if (!accessToken) {
    accessToken = localStorage.getItem(STORAGE_KEY);
  }
  return accessToken;
}

export function subscribe(listener: Listener) {
  listeners.add(listener);

  // Listen for storage changes from other tabs
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      accessToken = e.newValue;
      listener(accessToken);
    }
  };

  window.addEventListener("storage", handleStorageChange);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorageChange);
  };
}
