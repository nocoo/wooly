// Node 24+ ships an experimental built-in `localStorage`/`sessionStorage` that
// reports `undefined` unless launched with `--localstorage-file=...`. That
// shadowed binding hides the jsdom-provided storage and breaks tests that read
// `localStorage` as a bare global. Replace both globals with an in-memory
// implementation before any test runs.

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

function install(name: "localStorage" | "sessionStorage"): void {
  const storage = new MemoryStorage();
  Object.defineProperty(globalThis, name, {
    configurable: true,
    enumerable: true,
    writable: true,
    value: storage,
  });
  if (typeof window !== "undefined") {
    Object.defineProperty(window, name, {
      configurable: true,
      enumerable: true,
      writable: true,
      value: storage,
    });
  }
}

install("localStorage");
install("sessionStorage");
