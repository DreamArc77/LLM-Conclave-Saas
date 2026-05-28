import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.llmconclave.ios',
  appName: 'LLM Conclave',
  webDir: 'www',
  server: {
    url: 'https://llmconclave.com',
    cleartext: false,
    allowNavigation: ['llmconclave.com'],
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'llmconclave',
    limitsNavigationsToAppBoundDomains: false,
    webContentsDebuggingEnabled: true,
  },
};

export default config;
