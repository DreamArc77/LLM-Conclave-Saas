// Stub browser globals so Turbopack SSR can evaluate modules that reference
// `window` (e.g. Zustand persist middleware default: () => window.localStorage).
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    location: { hostname: '', origin: '' },
    Capacitor: undefined,
    addEventListener: () => {},
    removeEventListener: () => {},
    __REDUX_DEVTOOLS_EXTENSION__: undefined,
  };
}

if (typeof globalThis.document === 'undefined') {
  globalThis.document = {
    cookie: '',
    documentElement: { lang: 'en' },
  };
}

if (typeof globalThis.navigator === 'undefined') {
  globalThis.navigator = {
    userAgent: 'node',
    language: 'en',
  };
}
