import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function formatEntry(level: string, ...args: unknown[]): string {
  const ts = new Date().toISOString();
  const parts = args.map((arg) => {
    if (arg instanceof Error) return arg.stack ?? arg.message;
    if (typeof arg === 'object' && arg !== null) return JSON.stringify(arg);
    return String(arg);
  });
  return `[${ts}] [${level}] ${parts.join(' ')}\n`;
}

function writeLog(level: string, ...args: unknown[]) {
  try {
    ensureLogDir();
    const date = new Date().toISOString().slice(0, 10);
    const logFile = path.join(LOG_DIR, `${date}.log`);
    fs.appendFileSync(logFile, formatEntry(level, ...args), 'utf-8');
  } catch { /* writing fails silently — never crash the main flow */ }
}

export const logger = {
  error: (...args: unknown[]) => { console.error(...args); writeLog('ERROR', ...args); },
  warn:  (...args: unknown[]) => { console.warn(...args);  writeLog('WARN',  ...args); },
  info:  (...args: unknown[]) => { console.log(...args);   writeLog('INFO',  ...args); },
};
