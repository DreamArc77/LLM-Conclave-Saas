// Stub browser globals during SSR. Turbopack evaluates modules at build time
// and any code path referencing `window` (even inside arrow functions like
// Zustand's persist default: () => window.localStorage) will crash.
// This runs at Node module evaluation time, before any application code.
if (typeof window === 'undefined') {
  (globalThis as any).window = {
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    location: { hostname: '', origin: '' },
    Capacitor: undefined,
    addEventListener: () => {},
    removeEventListener: () => {},
    __REDUX_DEVTOOLS_EXTENSION__: undefined,
  };
  (globalThis as any).document = {
    cookie: '',
    documentElement: { lang: 'en' },
  };
  (globalThis as any).navigator = {
    userAgent: 'node',
    language: 'en',
  };
}

export function register() {}
