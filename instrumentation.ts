type SentryRequestErrorHandler = (...args: unknown[]) => unknown;

function installServerLocalStorageShim() {
  if (typeof globalThis === "undefined") {
    return;
  }

  const currentStorage = (globalThis as typeof globalThis & { localStorage?: Storage }).localStorage;
  if (!currentStorage || typeof currentStorage.getItem === "function") {
    return;
  }

  const store = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(String(key)) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(String(key));
    },
    setItem(key: string, value: string) {
      store.set(String(key), String(value));
    }
  };

  try {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      enumerable: false,
      value: memoryStorage,
      writable: true
    });
  } catch {
    // If the runtime refuses redefining it, the application can still boot in
    // normal browser runtimes where localStorage already has the Storage API.
  }
}

export async function register() {
  installServerLocalStorageShim();

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError: SentryRequestErrorHandler = async (...args) => {
  installServerLocalStorageShim();
  const Sentry = await import("@sentry/nextjs");
  return Sentry.captureRequestError(...(args as Parameters<typeof Sentry.captureRequestError>));
};
